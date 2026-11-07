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
        WHERE m.sender_id = $1 OR m.receiver_id = $1
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
        last_message_text: previewText,
        is_new_contact: false,
      };
    });

    // 2. Fetch other registered users/leaders so user can start chatting with anyone
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

    // 3. Fetch groups joined by this user so they appear under Group category tab
    let userGroupsList = [];
    try {
      const userGroupsRes = await db.query(
        `SELECT g.id, g.name, g.category, g.description, g.icon_url, g.members, gm.joined_at
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
         WHERE gm.user_id = $1
         ORDER BY gm.joined_at DESC;`,
        [userId]
      );
      userGroupsList = userGroupsRes.rows.map((g) => ({
        user_id: `group_${g.id}`,
        group_id: g.id,
        name: g.name,
        role: g.category || 'Group',
        category: 'Group',
        is_group: true,
        company_brand: 'Fortaa Community',
        avatar_url: g.icon_url || null,
        last_message_text: g.description || 'Welcome to the group!',
        last_message_time: g.joined_at,
        unread_count: 0,
        is_new_contact: false,
      }));
    } catch (gErr) {
      console.warn('userGroups fetch error:', gErr.message);
    }

    return res.status(200).json({
      success: true,
      conversations: [...formattedConversations, ...userGroupsList, ...suggestions],
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
          u.name as sender_name, 
          u.avatar_url as sender_avatar,
          COALESCE((SELECT COUNT(*)::int FROM group_members WHERE group_id = $1 AND user_id != m.sender_id), 0) as required_readers
        FROM messages m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.group_id = $1
        ORDER BY m.created_at ASC;
      `;
      const groupHistoryRes = await db.query(groupHistoryQuery, [groupId]);
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

    // Fetch messages in chronological order
    const historyQuery = `
      SELECT id, sender_id, receiver_id, text, is_read, created_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
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
      return {
        ...r,
        text: displayText,
        attachment,
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

module.exports = {
  getConversations,
  getChatHistory,
  sendMessageHttp,
  getUnreadMessagesCount,
};

