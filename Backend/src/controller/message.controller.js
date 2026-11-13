const db = require('../db/db');

/**
 * Get active conversations / contacts for a user
 * Returns list of chat partners with latest message preview and unread count
 */
async function getConversations(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Valid userId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, conversations: [] });
    }

    // 1. Get distinct chat partners and their latest message
    const convQuery = `
      WITH recent_messages AS (
        SELECT 
          m.*,
          CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as partner_id,
          ROW_NUMBER() OVER (
            PARTITION BY (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
            ORDER BY m.created_at DESC
          ) as rn
        FROM messages m
        WHERE (m.sender_id = $1 OR m.receiver_id = $1)
          AND NOT ($1 = ANY(COALESCE(m.deleted_for, '{}')))
      )
      SELECT 
        rm.id as last_message_id,
        rm.text as last_message_text,
        rm.created_at as last_message_time,
        rm.sender_id as last_message_sender,
        rm.is_read as last_message_is_read,
        u.id as user_id,
        u.name,
        u.designation,
        u.company_brand,
        u.avatar_url,
        COALESCE(unread.count, 0) as unread_count
      FROM recent_messages rm
      JOIN users u ON u.id = rm.partner_id
      LEFT JOIN (
        SELECT sender_id, COUNT(*) as count 
        FROM messages 
        WHERE receiver_id = $1 AND is_read = FALSE
          AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')))
        GROUP BY sender_id
      ) unread ON unread.sender_id = u.id
      WHERE rm.rn = 1
      ORDER BY rm.created_at DESC;
    `;

    const convResult = await db.query(convQuery, [userId]);
    const existingPartnerIds = convResult.rows.map((r) => r.user_id);

    const formattedConversations = convResult.rows.map((r) => {
      let previewText = r.last_message_text;
      try {
        if (previewText && previewText.startsWith('{"') && previewText.includes('"attachment"')) {
          const parsed = JSON.parse(previewText);
          previewText = parsed.text || (parsed.attachment ? `📎 ${parsed.attachment.name || 'File'}` : '');
        }
      } catch {}
      return {
        ...r,
        category: 'Direct',
        last_message_text: previewText,
        is_new_contact: false,
      };
    });

    // 2. Fetch other registered users/leaders as suggestions (for search / new chat only)
    const otherUsersQuery = `
      SELECT id as user_id, name, designation, company_brand, avatar_url
      FROM users
      WHERE id != $1 AND id NOT IN (${existingPartnerIds.length ? existingPartnerIds.join(',') : '0'})
      ORDER BY created_at DESC
      LIMIT 25;
    `;
    const otherUsersRes = await db.query(otherUsersQuery, [userId]);

    const suggestions = otherUsersRes.rows.map((u) => ({
      user_id: u.user_id,
      name: u.name,
      designation: u.designation || 'Member',
      company_brand: u.company_brand || 'Direct Seller',
      avatar_url: u.avatar_url,
      last_message_text: null,
      last_message_time: null,
      unread_count: 0,
      is_new_contact: true,
      category: 'Direct',
    }));

    // 3. Fetch groups joined by this user with real last message & unread counts
    let userGroupsList = [];
    try {
      const userGroupsRes = await db.query(
        `SELECT 
           g.id, 
           g.name, 
           g.category, 
           g.description, 
           g.icon_url, 
           g.members, 
           gm.joined_at,
           lm.text as last_msg_text,
           lm.created_at as last_msg_time,
           COALESCE(unread.count, 0)::int as unread_count
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN LATERAL (
           SELECT m.text, m.created_at
           FROM messages m
           WHERE m.group_id = g.id
             AND NOT ($1 = ANY(COALESCE(m.deleted_for, '{}')))
           ORDER BY m.created_at DESC
           LIMIT 1
         ) lm ON TRUE
         LEFT JOIN (
           SELECT group_id, COUNT(*)::int as count
           FROM messages
           WHERE group_id IS NOT NULL
             AND sender_id != $1
             AND NOT ($1 = ANY(COALESCE(read_by, '{}')))
             AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')))
           GROUP BY group_id
         ) unread ON unread.group_id = g.id
         WHERE gm.user_id = $1
         ORDER BY COALESCE(lm.created_at, gm.joined_at) DESC;`,
        [userId]
      );
      userGroupsList = userGroupsRes.rows.map((g) => {
        let preview = g.last_msg_text || g.description || 'Welcome to the group!';
        try {
          if (preview && preview.startsWith('{"') && preview.includes('"attachment"')) {
            const parsed = JSON.parse(preview);
            preview = parsed.text || (parsed.attachment ? `📎 ${parsed.attachment.name || 'File'}` : '');
          }
        } catch {}

        return {
          user_id: `group_${g.id}`,
          group_id: g.id,
          name: g.name,
          role: g.category || 'Group',
          category: 'Group',
          is_group: true,
          company_brand: 'Fortaa Community',
          avatar_url: g.icon_url || null,
          last_message_text: preview,
          last_message_time: g.last_msg_time || g.joined_at,
          unread_count: Number(g.unread_count) || 0,
          is_new_contact: false,
        };
      });
    } catch (gErr) {
      console.warn('userGroups fetch error:', gErr.message);
    }

    // Instagram style: conversations ONLY contains actual active conversations & joined groups!
    return res.status(200).json({
      success: true,
      conversations: [...formattedConversations, ...userGroupsList],
      suggestions,
    });
  } catch (error) {
    console.error('[getConversations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
}

/**
 * Get full message history between two users
 */
async function getChatHistory(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const rawOtherId = String(req.params.otherUserId);

    // Group Chat History Support
    if (rawOtherId.startsWith('group_')) {
      const groupId = parseInt(rawOtherId.replace('group_', ''), 10);
      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({ success: false, message: 'Valid groupId required' });
      }

      if (!db.isDBConnected()) {
        return res.status(200).json({ success: true, messages: [] });
      }

      // 1. Mark incoming group messages as read by current user
      if (userId) {
        try {
          await db.query(
            `UPDATE messages
             SET read_by = array_append(COALESCE(read_by, '{}'), $1)
             WHERE group_id = $2 
               AND sender_id != $1 
               AND NOT ($1 = ANY(COALESCE(read_by, '{}')));`,
            [userId, groupId]
          );

          // Mark is_read = TRUE if all other group members have read
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
            [groupId]
          );

          // Broadcast group read receipt so senders see Blue Ticks in real-time
          const { getIO } = require('../socket/chat.socket');
          const io = getIO();
          if (io) {
            io.to(`group_${groupId}`).emit('group_messages_read', { groupId, readByUserId: userId });
          }
        } catch (readErr) {
          console.warn('[group read receipts error]:', readErr.message);
        }
      }

      const groupHistoryQuery = `
        SELECT 
          m.id, 
          m.sender_id, 
          m.text, 
          m.created_at, 
          m.is_read,
          COALESCE(m.read_by, '{}') as read_by,
          COALESCE(m.reactions, '{}'::jsonb) as reactions,
          COALESCE(m.is_deleted, FALSE) as is_deleted,
          u.name as sender_name, 
          u.avatar_url as sender_avatar,
          COALESCE((SELECT COUNT(*)::int FROM group_members WHERE group_id = $1 AND user_id != m.sender_id), 0) as required_readers
        FROM messages m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.group_id = $1
          AND NOT ($2 = ANY(COALESCE(m.deleted_for, '{}')))
        ORDER BY m.created_at ASC;
      `;
      const groupHistoryRes = await db.query(groupHistoryQuery, [groupId, userId || 0]);
      const formatted = groupHistoryRes.rows.map((r) => {
        let msgText = r.text;
        let attachment = null;
        try {
          if (r.text && r.text.startsWith('{"') && r.text.includes('"attachment"')) {
            const parsed = JSON.parse(r.text);
            msgText = parsed.text || '';
            attachment = parsed.attachment || null;
          }
        } catch {}

        const readCount = Array.isArray(r.read_by) ? r.read_by.length : 0;
        const reqCount = r.required_readers || 0;
        let msgStatus = 'sent';
        if (r.is_read || (reqCount > 0 && readCount >= reqCount) || (reqCount === 0 && readCount > 0)) {
          msgStatus = 'read'; // Blue double tick!
        } else if (readCount > 0) {
          msgStatus = 'delivered'; // Grey double tick
        } else {
          msgStatus = 'sent'; // Grey single tick
        }

        let parsedReactions = {};
        try {
          parsedReactions = typeof r.reactions === 'object' ? r.reactions : JSON.parse(r.reactions || '{}');
        } catch {}

        return {
          id: r.id,
          sender_id: r.sender_id,
          sender_name: r.sender_name,
          sender_avatar: r.sender_avatar,
          text: msgText,
          attachment,
          created_at: r.created_at,
          is_read: msgStatus === 'read',
          status: msgStatus,
          read_by: r.read_by || [],
          reactions: parsedReactions || {},
          is_deleted: Boolean(r.is_deleted),
        };
      });
      return res.status(200).json({ success: true, messages: formatted });
    }

    const otherUserId = parseInt(rawOtherId, 10);

    if (!userId || !otherUserId || isNaN(userId) || isNaN(otherUserId)) {
      return res.status(400).json({ success: false, message: 'Valid user IDs required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, messages: [] });
    }

    // Mark incoming messages as read
    const updateRes = await db.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [otherUserId, userId]
    );

    // Notify original sender that their messages were read
    try {
      const { getIO } = require('../socket/chat.socket');
      const io = getIO();
      if (io) {
        io.to(`room_${String(otherUserId)}`).emit('messages_read', { byUserId: Number(userId) });
        io.to(`room_${String(userId)}`).emit('messages_marked_read', { senderId: Number(otherUserId) });
      }
    } catch {}

    // Fetch messages in chronological order (excluding messages deleted by current user)
    const historyQuery = `
      SELECT id, sender_id, receiver_id, text, is_read, created_at,
             COALESCE(reactions, '{}'::jsonb) as reactions,
             COALESCE(is_deleted, FALSE) as is_deleted
      FROM messages
      WHERE ((sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1))
        AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')))
      ORDER BY created_at ASC;
    `;

    const result = await db.query(historyQuery, [userId, otherUserId]);

    const formattedMessages = result.rows.map((r) => {
      let displayText = r.text;
      let attachment = null;
      try {
        if (r.text && r.text.startsWith('{"') && r.text.includes('"attachment"')) {
          const parsed = JSON.parse(r.text);
          displayText = parsed.text || '';
          attachment = parsed.attachment || null;
        }
      } catch {}

      let parsedReactions = {};
      try {
        parsedReactions = typeof r.reactions === 'object' ? r.reactions : JSON.parse(r.reactions || '{}');
      } catch {}

      return {
        ...r,
        text: displayText,
        attachment,
        reactions: parsedReactions || {},
        is_deleted: Boolean(r.is_deleted),
      };
    });

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('[getChatHistory Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load chat history' });
  }
}

/**
 * REST fallback to send message
 */
async function sendMessageHttp(req, res) {
  try {
    const { senderId, receiverId, text, attachment } = req.body;
    const cleanText = (text || '').trim();
    if (!senderId || !receiverId || (!cleanText && !attachment)) {
      return res.status(400).json({ success: false, message: 'senderId, receiverId and text or attachment required' });
    }

    const payloadToSave = attachment
      ? JSON.stringify({ text: cleanText, attachment })
      : cleanText;

    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        message: {
          id: Date.now(),
          sender_id: Number(senderId),
          receiver_id: Number(receiverId),
          text: cleanText,
          attachment: attachment || null,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      });
    }

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
        return res.status(403).json({
          success: false,
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

    return res.status(201).json({
      success: true,
      message: {
        ...insertRes.rows[0],
        text: cleanText,
        attachment: attachment || null,
      },
    });
  } catch (error) {
    console.error('[sendMessageHttp Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

/**
 * Get total unread incoming messages count for a user
 */
async function getUnreadMessagesCount(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.userId || req.query.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Valid userId required', count: 0 });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [userId]
    );

    const count = result.rows[0]?.count || 0;
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('[getUnreadMessagesCount Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count', count: 0 });
  }
}

/**
 * Delete message (Delete for everyone OR Delete for me)
 */
async function deleteMessage(req, res) {
  try {
    const messageId = parseInt(req.params.messageId, 10);
    const userId = parseInt(req.body.userId || req.userId || req.query.userId, 10);
    const { deleteForEveryone } = req.body;

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({ success: false, message: 'Valid messageId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    if (deleteForEveryone) {
      await db.query(
        `UPDATE messages SET is_deleted = TRUE, text = '🚫 This message was deleted' WHERE id = $1`,
        [messageId]
      );
    } else if (userId) {
      await db.query(
        `UPDATE messages
         SET deleted_for = array_append(COALESCE(deleted_for, '{}'), $1)
         WHERE id = $2 AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')));`,
        [userId, messageId]
      );
    }

    return res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('[deleteMessage Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

/**
 * Ensure user_blocks and chat_reports tables exist
 */
async function ensureBlockAndReportTables() {
  try {
    if (!db.isDBConnected()) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
      );

      CREATE TABLE IF NOT EXISTS chat_reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.warn('[ensureBlockAndReportTables warn]:', e.message);
  }
}

/**
 * Clear chat messages for current user (hides messages for userId)
 */
async function clearChat(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.body.userId, 10);
    const target = String(req.params.targetId || req.body.targetId || '');

    if (!userId || !target) {
      return res.status(400).json({ success: false, message: 'userId and targetId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Chat cleared' });
    }

    if (target.startsWith('group_')) {
      const groupId = parseInt(target.replace('group_', ''), 10);
      await db.query(
        `UPDATE messages
         SET deleted_for = array_append(COALESCE(deleted_for, '{}'), $1)
         WHERE group_id = $2 AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')));`,
        [userId, groupId]
      );
    } else {
      const otherUserId = parseInt(target, 10);
      await db.query(
        `UPDATE messages
         SET deleted_for = array_append(COALESCE(deleted_for, '{}'), $1)
         WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
           AND NOT ($1 = ANY(COALESCE(deleted_for, '{}')));`,
        [userId, otherUserId]
      );
    }

    return res.status(200).json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('[clearChat Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear chat' });
  }
}

/**
 * Block / Unblock user
 */
async function toggleBlockUser(req, res) {
  try {
    const blockerId = parseInt(req.body.blockerId || req.userId, 10);
    const blockedId = parseInt(req.body.blockedId, 10);
    if (!blockerId || !blockedId) {
      return res.status(400).json({ success: false, message: 'blockerId and blockedId required' });
    }

    await ensureBlockAndReportTables();

    const check = await db.query(
      `SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2;`,
      [blockerId, blockedId]
    );

    let isBlocked = false;
    if (check.rows.length > 0) {
      // Unblock
      await db.query(
        `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2;`,
        [blockerId, blockedId]
      );
      isBlocked = false;
    } else {
      // Block
      await db.query(
        `INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [blockerId, blockedId]
      );
      isBlocked = true;
    }

    return res.status(200).json({
      success: true,
      isBlocked,
      message: isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
    });
  } catch (error) {
    console.error('[toggleBlockUser Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle block status' });
  }
}

/**
 * Get block status between two users
 */
async function getBlockStatus(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const otherUserId = parseInt(req.params.otherUserId, 10);

    if (!userId || !otherUserId) {
      return res.status(200).json({ success: true, isBlocked: false, isBlockedByThem: false });
    }

    await ensureBlockAndReportTables();

    const iBlocked = await db.query(
      `SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2;`,
      [userId, otherUserId]
    );
    const theyBlocked = await db.query(
      `SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2;`,
      [otherUserId, userId]
    );

    return res.status(200).json({
      success: true,
      isBlocked: iBlocked.rows.length > 0,
      isBlockedByThem: theyBlocked.rows.length > 0,
    });
  } catch (error) {
    console.error('[getBlockStatus Error]:', error);
    return res.status(500).json({ success: false, isBlocked: false });
  }
}

/**
 * Report chat / user
 */
async function reportChat(req, res) {
  try {
    const reporterId = parseInt(req.body.reporterId, 10);
    const reportedId = req.body.reportedId ? parseInt(req.body.reportedId, 10) : null;
    const groupId = req.body.groupId ? parseInt(req.body.groupId, 10) : null;
    const reason = req.body.reason || 'Inappropriate content';

    if (!reporterId) {
      return res.status(400).json({ success: false, message: 'reporterId required' });
    }

    await ensureBlockAndReportTables();

    await db.query(
      `INSERT INTO chat_reports (reporter_id, reported_id, group_id, reason) VALUES ($1, $2, $3, $4);`,
      [reporterId, reportedId, groupId, reason]
    );

    return res.status(200).json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping our community safe.',
    });
  } catch (error) {
    console.error('[reportChat Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
}

module.exports = {
  getConversations,
  getChatHistory,
  sendMessageHttp,
  getUnreadMessagesCount,
  deleteMessage,
  clearChat,
  toggleBlockUser,
  getBlockStatus,
  reportChat,
};

