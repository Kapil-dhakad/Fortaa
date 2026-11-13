const db = require('../db/db');

// In-memory tracking of active online users: userId -> Set of socketIds
const onlineUsers = new Map();
let ioInstance = null;

function setupChatSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    let currentUserId = socket.handshake.query?.userId
      ? String(socket.handshake.query.userId).trim()
      : null;

    if (currentUserId === 'undefined' || currentUserId === 'null' || !currentUserId) {
      currentUserId = null;
    }

    // Register user function (used by handshake query and 'join' event)
    const registerUser = (userId) => {
      if (!userId) return;
      const uidStr = String(userId).trim();
      if (!uidStr || uidStr === 'undefined' || uidStr === 'null') return;

      // If user ID changed on same socket, clean up previous
      if (currentUserId && currentUserId !== uidStr) {
        socket.leave(`room_${currentUserId}`);
        if (onlineUsers.has(currentUserId)) {
          const oldSockets = onlineUsers.get(currentUserId);
          oldSockets.delete(socket.id);
          if (oldSockets.size === 0) {
            onlineUsers.delete(currentUserId);
          }
        }
      }

      currentUserId = uidStr;
      socket.join(`room_${currentUserId}`);

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Broadcast active online users list to all connected clients
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`[Socket.IO] User ${currentUserId} active (socket: ${socket.id}, total online: ${onlineUsers.size})`);
    };

    // Auto-register from handshake query if provided
    if (currentUserId) {
      registerUser(currentUserId);
    }

    // User explicitly joins with their personal userId
    socket.on('join', ({ userId }) => {
      registerUser(userId);
    });

    // Request current online users list
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Join a group chat room
    socket.on('join_group_room', ({ groupId }) => {
      if (groupId) {
        socket.join(`group_${String(groupId)}`);
      }
    });

    // Leave a group chat room
    socket.on('leave_group_room', ({ groupId }) => {
      if (groupId) {
        socket.leave(`group_${String(groupId)}`);
      }
    });

    // Real-time Send Message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, text, attachment, groupId } = data;
        const cleanText = (text || '').trim();
        if (!senderId || (!receiverId && !groupId) || (!cleanText && !attachment)) {
          return socket.emit('error', { message: 'Invalid message payload' });
        }

        const payloadToSave = attachment
          ? JSON.stringify({ text: cleanText, attachment })
          : cleanText;

        let savedMessage = null;

        // Group Message branch
        const isGroup = Boolean(groupId || String(receiverId).startsWith('group_'));
        const gid = isGroup ? (groupId || parseInt(String(receiverId).replace('group_', ''), 10)) : null;

        if (isGroup && gid) {
          if (db.isDBConnected()) {
            const insertRes = await db.query(
              `INSERT INTO messages (sender_id, group_id, text, is_read)
               VALUES ($1, $2, $3, FALSE)
               RETURNING id, sender_id, group_id, text, created_at`,
              [Number(senderId), Number(gid), payloadToSave]
            );
            savedMessage = insertRes.rows[0];
          } else {
            savedMessage = {
              id: Date.now(),
              sender_id: Number(senderId),
              group_id: Number(gid),
              text: payloadToSave,
              created_at: new Date().toISOString(),
            };
          }

          const finalMsg = {
            ...savedMessage,
            receiver_id: `group_${gid}`,
            group_id: gid,
            text: cleanText,
            attachment: attachment || null,
            status: 'sent',
          };

          // Broadcast to everyone currently viewing this group room except sender
          socket.to(`group_${gid}`).emit('new_message', finalMsg);
          socket.emit('message_sent', finalMsg);
          return;
        }

        // Direct 1-on-1 Message branch
        if (db.isDBConnected()) {
          // Check if either user has blocked the other
          try {
            const blockCheck = await db.query(
              `SELECT blocker_id FROM user_blocks 
               WHERE (blocker_id = $1 AND blocked_id = $2) 
                  OR (blocker_id = $2 AND blocked_id = $1)
               LIMIT 1;`,
              [Number(senderId), Number(receiverId)]
            );
            if (blockCheck.rows.length > 0) {
              const isSelfBlocker = Number(blockCheck.rows[0].blocker_id) === Number(senderId);
              return socket.emit('error', {
                message: isSelfBlocker
                  ? 'You have blocked this contact. Unblock to send messages.'
                  : 'You cannot send messages to this contact.',
              });
            }
          } catch {}

          const insertRes = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, text, is_read)
             VALUES ($1, $2, $3, FALSE)
             RETURNING id, sender_id, receiver_id, text, is_read, created_at`,
            [Number(senderId), Number(receiverId), payloadToSave]
          );
          savedMessage = insertRes.rows[0];
        } else {
          // Fallback in-memory object
          savedMessage = {
            id: Date.now(),
            sender_id: Number(senderId),
            receiver_id: Number(receiverId),
            text: payloadToSave,
            is_read: false,
            created_at: new Date().toISOString(),
          };
        }

        // Check if receiver is online
        const isReceiverOnline =
          onlineUsers.has(String(receiverId)) && onlineUsers.get(String(receiverId)).size > 0;
        const status = isReceiverOnline ? 'delivered' : 'sent';

        const finalMsg = {
          ...savedMessage,
          text: cleanText,
          attachment: attachment || null,
          status,
        };

        // 1. Dispatch in real-time to receiver's private room
        io.to(`room_${String(receiverId)}`).emit('new_message', finalMsg);

        // 2. Acknowledge back to sender with confirmed saved message and status
        socket.emit('message_sent', finalMsg);
      } catch (err) {
        console.error('[Socket send_message error]:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on('typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(`room_${String(receiverId)}`).emit('user_typing', { senderId });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(`room_${String(receiverId)}`).emit('user_stop_typing', { senderId });
      }
    });

    // Mark Messages as Read
    socket.on('mark_read', async ({ senderId, receiverId, groupId }) => {
      try {
        const isGroup = Boolean(groupId || String(senderId).startsWith('group_') || String(receiverId).startsWith('group_'));
        const gid = groupId || (String(receiverId).startsWith('group_') ? parseInt(String(receiverId).replace('group_', ''), 10) : (String(senderId).startsWith('group_') ? parseInt(String(senderId).replace('group_', ''), 10) : null));

        if (isGroup && gid && currentUserId) {
          const readerUid = Number(currentUserId);
          if (db.isDBConnected()) {
            await db.query(
              `UPDATE messages
               SET read_by = array_append(COALESCE(read_by, '{}'), $1)
               WHERE group_id = $2 
                 AND sender_id != $1 
                 AND NOT ($1 = ANY(COALESCE(read_by, '{}')));`,
              [readerUid, gid]
            );

            await db.query(
              `WITH member_counts AS (
                 SELECT group_id, COUNT(*)::int as total_members
                 FROM group_members
                 WHERE group_id = $1
                 GROUP BY group_id
               )
               UPDATE messages m
               SET is_read = TRUE
               FROM member_counts mc
               WHERE m.group_id = $1
                 AND m.is_read = FALSE
                 AND mc.total_members > 1
                 AND cardinality(COALESCE(m.read_by, '{}')) >= (mc.total_members - 1);`,
              [gid]
            );
          }
          io.to(`group_${gid}`).emit('group_messages_read', { groupId: gid, readByUserId: readerUid });
          return;
        }

        if (db.isDBConnected() && senderId && receiverId) {
          await db.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
            [Number(senderId), Number(receiverId)]
          );
        }
        // Inform sender that their messages were read
        io.to(`room_${String(senderId)}`).emit('messages_read', { byUserId: Number(receiverId) });
        // Inform receiver (and any other tabs of receiver) that messages were read
        io.to(`room_${String(receiverId)}`).emit('messages_marked_read', { senderId: Number(senderId) });
      } catch (err) {
        console.error('[Socket mark_read error]:', err);
      }
    });

    // Message Reaction (WhatsApp emoji reaction sync)
    socket.on('message_reaction', async (payload) => {
      try {
        const { messageId, emoji, senderId, receiverId, groupId } = payload || {};
        if (!messageId) return;

        let updatedReactions = {};
        if (db.isDBConnected()) {
          try {
            const msgRes = await db.query('SELECT reactions FROM messages WHERE id = $1', [Number(messageId)]);
            if (msgRes.rows.length > 0 && msgRes.rows[0].reactions) {
              const raw = msgRes.rows[0].reactions;
              updatedReactions = typeof raw === 'object' ? { ...raw } : JSON.parse(raw || '{}');
            }
            if (emoji) {
              updatedReactions[String(senderId)] = emoji;
            } else {
              delete updatedReactions[String(senderId)];
            }
            await db.query('UPDATE messages SET reactions = $1 WHERE id = $2', [JSON.stringify(updatedReactions), Number(messageId)]);
          } catch (rErr) {
            console.warn('[message_reaction DB error]:', rErr.message);
          }
        } else {
          if (emoji) {
            updatedReactions[String(senderId)] = emoji;
          }
        }

        const reactionEvent = {
          messageId: Number(messageId),
          emoji,
          senderId: Number(senderId),
          reactions: updatedReactions,
          receiverId: receiverId ? Number(receiverId) : null,
          groupId: groupId || null,
        };

        if (groupId || (receiverId && String(receiverId).startsWith('group_'))) {
          const gid = groupId || parseInt(String(receiverId).replace('group_', ''), 10);
          io.to(`group_${gid}`).emit('message_reaction', reactionEvent);
        } else if (receiverId) {
          io.to(`room_${String(receiverId)}`).emit('message_reaction', reactionEvent);
        }
        if (senderId) {
          io.to(`room_${String(senderId)}`).emit('message_reaction', reactionEvent);
        }
      } catch (err) {
        console.error('[Socket message_reaction error]:', err);
      }
    });

    // Delete Message (WhatsApp delete for everyone / me)
    socket.on('delete_message', async (payload) => {
      try {
        const { messageId, deleteForEveryone, deleteForMe, senderId, receiverId, groupId } = payload || {};
        if (!messageId) return;

        if (deleteForEveryone) {
          if (db.isDBConnected()) {
            try {
              await db.query(
                `UPDATE messages
                 SET is_deleted = TRUE, text = '🚫 This message was deleted'
                 WHERE id = $1`,
                [Number(messageId)]
              );
            } catch (dErr) {
              console.warn('[Socket delete_message DB error]:', dErr.message);
            }
          }

          const deleteEvent = {
            messageId: Number(messageId),
            deleteForEveryone: true,
            senderId: Number(senderId),
          };

          if (groupId || (receiverId && String(receiverId).startsWith('group_'))) {
            const gid = groupId || parseInt(String(receiverId).replace('group_', ''), 10);
            io.to(`group_${gid}`).emit('message_deleted', deleteEvent);
          } else if (receiverId) {
            io.to(`room_${String(receiverId)}`).emit('message_deleted', deleteEvent);
          }
          if (senderId) {
            io.to(`room_${String(senderId)}`).emit('message_deleted', deleteEvent);
          }
        } else if (deleteForMe || !deleteForEveryone) {
          // Delete for me: persist userId in deleted_for array in database
          if (db.isDBConnected() && senderId) {
            try {
              await db.query(
                `UPDATE messages
                 SET deleted_for = array_append(COALESCE(deleted_for, '{}'), $1)
                 WHERE id = $2 AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')));`,
                [Number(senderId), Number(messageId)]
              );
            } catch (dErr) {
              console.warn('[Socket delete_for_me DB error]:', dErr.message);
            }
          }

          if (senderId) {
            io.to(`room_${String(senderId)}`).emit('message_deleted_for_me', {
              messageId: Number(messageId),
              userId: Number(senderId),
            });
          }
        }
      } catch (err) {
        console.error('[Socket delete_message error]:', err);
      }
    });

    // ==========================================
    // 📞 1-on-1 AUDIO & VIDEO CALLING (WebRTC)
    // ==========================================

    // 1. Caller initiates call
    socket.on('call_initiate', (payload) => {
      try {
        const { toUserId, callType, callerName, callerAvatar, callerRole } = payload || {};
        if (!toUserId || !currentUserId) return;

        const targetUid = String(toUserId).trim();
        const callerUid = String(currentUserId).trim();

        // Check if recipient is online
        const isTargetOnline = onlineUsers.has(targetUid) && onlineUsers.get(targetUid).size > 0;
        if (!isTargetOnline) {
          return socket.emit('call_user_offline', { targetUserId: targetUid });
        }

        // Send incoming call event to recipient room
        io.to(`room_${targetUid}`).emit('call_incoming', {
          fromUserId: callerUid,
          callType: callType || 'video', // 'video' | 'audio'
          callerName: callerName || 'Fortaa Member',
          callerAvatar: callerAvatar || null,
          callerRole: callerRole || 'Leader',
        });
      } catch (err) {
        console.error('[call_initiate error]:', err);
      }
    });

    // 2. Recipient accepts call
    socket.on('call_accept', ({ toUserId }) => {
      try {
        if (!toUserId || !currentUserId) return;
        io.to(`room_${String(toUserId).trim()}`).emit('call_accepted', {
          fromUserId: String(currentUserId).trim(),
        });
      } catch (err) {
        console.error('[call_accept error]:', err);
      }
    });

    // 3. Recipient rejects call or Caller cancels
    socket.on('call_reject', ({ toUserId, reason }) => {
      try {
        if (!toUserId) return;
        io.to(`room_${String(toUserId).trim()}`).emit('call_rejected', {
          fromUserId: String(currentUserId || '').trim(),
          reason: reason || 'declined', // 'declined' | 'busy' | 'cancelled'
        });
      } catch (err) {
        console.error('[call_reject error]:', err);
      }
    });

    // 4. WebRTC Signaling exchange (SDP Offer, Answer, ICE Candidates)
    socket.on('call_signal', ({ toUserId, signal }) => {
      try {
        if (!toUserId || !signal || !currentUserId) return;
        io.to(`room_${String(toUserId).trim()}`).emit('call_signal', {
          fromUserId: String(currentUserId).trim(),
          signal,
        });
      } catch (err) {
        console.error('[call_signal error]:', err);
      }
    });

    // 5. Either participant ends the ongoing call
    socket.on('call_end', ({ toUserId }) => {
      try {
        if (toUserId) {
          io.to(`room_${String(toUserId).trim()}`).emit('call_ended', {
            fromUserId: String(currentUserId || '').trim(),
          });
        }
      } catch (err) {
        console.error('[call_end error]:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('online_users', Array.from(onlineUsers.keys()));
        }
      }
      console.log(`[Socket.IO] Client disconnected (${socket.id})`);
    });
  });
}

function getIO() {
  return ioInstance;
}

module.exports = { setupChatSocket, getIO };
