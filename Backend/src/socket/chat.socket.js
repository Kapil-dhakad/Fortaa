const db = require('../db/db');

// In-memory tracking of active online users: userId -> Set of socketIds
const onlineUsers = new Map();
let ioInstance = null;

function setupChatSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    let currentUserId = null;

    // User joins with their personal userId
    socket.on('join', ({ userId }) => {
      if (!userId) return;
      currentUserId = String(userId);

      // Join personal room for 1-to-1 message dispatch
      socket.join(`room_${currentUserId}`);

      // Track online socket
      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Notify everyone about active online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`[Socket.IO] User ${currentUserId} connected (socket: ${socket.id})`);
    });

    // Request current online users
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Real-time Send Message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, text } = data;
        if (!senderId || !receiverId || !text || !text.trim()) {
          return socket.emit('error', { message: 'Invalid message payload' });
        }

        const cleanText = text.trim();
        let savedMessage = null;

        if (db.isDBConnected()) {
          const insertRes = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, text, is_read)
             VALUES ($1, $2, $3, FALSE)
             RETURNING id, sender_id, receiver_id, text, is_read, created_at`,
            [Number(senderId), Number(receiverId), cleanText]
          );
          savedMessage = insertRes.rows[0];
        } else {
          // Fallback in-memory object
          savedMessage = {
            id: Date.now(),
            sender_id: Number(senderId),
            receiver_id: Number(receiverId),
            text: cleanText,
            is_read: false,
            created_at: new Date().toISOString(),
          };
        }

        // 1. Dispatch in real-time to receiver's private room
        io.to(`room_${receiverId}`).emit('new_message', savedMessage);

        // 2. Acknowledge back to sender with confirmed saved message
        socket.emit('message_sent', savedMessage);
      } catch (err) {
        console.error('[Socket send_message error]:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on('typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(`room_${receiverId}`).emit('user_typing', { senderId });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(`room_${receiverId}`).emit('user_stop_typing', { senderId });
      }
    });

    // Mark Messages as Read
    socket.on('mark_read', async ({ senderId, receiverId }) => {
      try {
        if (db.isDBConnected() && senderId && receiverId) {
          await db.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
            [Number(senderId), Number(receiverId)]
          );
        }
        // Inform sender that their messages were read
        io.to(`room_${senderId}`).emit('messages_read', { byUserId: receiverId });
      } catch (err) {
        console.error('[Socket mark_read error]:', err);
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
