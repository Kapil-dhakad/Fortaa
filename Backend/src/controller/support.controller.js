const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'postgres'),
  database: process.env.PG_DATABASE || 'fortaa',
});

/**
 * 1. Submit a new support query from User Dashboard (Desktop & Mobile)
 * POST /api/support/query
 */
async function submitSupportQuery(req, res) {
  try {
    const { name, email, phone, subject, message, userId } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    const cleanSubject = subject && subject.trim() ? subject.trim() : 'General Support';
    const parsedUserId = userId && !isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null;

    const insertQuery = `
      INSERT INTO support_queries (user_id, name, email, phone, subject, message, status, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, 'New', false)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      parsedUserId,
      name.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      cleanSubject,
      message.trim(),
    ]);

    const newQuery = result.rows[0];

    // Real-time notification to Admin via Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('new_support_query', newQuery);
      }
    } catch (socketErr) {
      console.warn('Socket emit error on support query:', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Your query has been submitted to the support team. We will review it and get back to you!',
      query: newQuery,
    });
  } catch (error) {
    console.error('Error submitting support query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit support query. Please try again.',
      error: error.message,
    });
  }
}

/**
 * 2. Get all support queries for Admin Dashboard
 * GET /api/support/queries
 */
async function getSupportQueries(req, res) {
  try {
    const queriesResult = await pool.query(`
      SELECT 
        sq.*,
        u.avatar_url,
        u.designation,
        u.account_type
      FROM support_queries sq
      LEFT JOIN users u ON sq.user_id = u.id
      ORDER BY sq.created_at DESC;
    `);

    const unreadResult = await pool.query(`
      SELECT COUNT(*) AS unread_count 
      FROM support_queries 
      WHERE is_read = false;
    `);

    const unreadCount = parseInt(unreadResult.rows[0]?.unread_count || '0', 10);

    return res.status(200).json({
      success: true,
      queries: queriesResult.rows,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch support queries.',
      error: error.message,
    });
  }
}

/**
 * 3. Admin replies to a query or updates status
 * POST /api/support/reply/:id
 */
async function replySupportQuery(req, res) {
  try {
    const { id } = req.params;
    const { reply, status = 'Resolved' } = req.body;

    const updateResult = await pool.query(
      `
      UPDATE support_queries
      SET admin_reply = $1, status = $2, is_read = true
      WHERE id = $3
      RETURNING *;
      `,
      [reply || 'Query reviewed by support team.', status, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Query not found.' });
    }

    // Real-time socket emit to notify user
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('support_reply', updateResult.rows[0]);
      }
    } catch (socketErr) {
      console.warn('Socket emit error on support reply:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Reply saved and query updated successfully.',
      query: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error replying to support query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reply to support query.',
      error: error.message,
    });
  }
}

/**
 * 4. Mark query as read
 * PATCH /api/support/read/:id
 */
async function markSupportQueryRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE support_queries SET is_read = true WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    console.error('Error marking support query as read:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 5. Get unread support count for Admin Header badge
 * GET /api/support/unread-count
 */
async function getUnreadSupportCount(req, res) {
  try {
    const result = await pool.query('SELECT COUNT(*) AS count FROM support_queries WHERE is_read = false');
    const count = parseInt(result.rows[0]?.count || '0', 10);
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error getting unread support count:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 6. Get all messages for a specific user (for their live chat page)
 * GET /api/support/user-messages?userId=...&email=...
 */
async function getUserSupportMessages(req, res) {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'User ID or Email is required.' });
    }

    const parsedUserId = userId && !isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null;
    const cleanEmail = email ? email.trim() : '';

    let queryText = '';
    let params = [];

    if (parsedUserId && cleanEmail) {
      queryText = `
        SELECT * FROM support_queries
        WHERE user_id = $1 OR email ILIKE $2
        ORDER BY created_at ASC;
      `;
      params = [parsedUserId, cleanEmail];
    } else if (parsedUserId) {
      queryText = `
        SELECT * FROM support_queries
        WHERE user_id = $1
        ORDER BY created_at ASC;
      `;
      params = [parsedUserId];
    } else {
      queryText = `
        SELECT * FROM support_queries
        WHERE email ILIKE $1
        ORDER BY created_at ASC;
      `;
      params = [cleanEmail];
    }

    const result = await pool.query(queryText, params);
    return res.status(200).json({
      success: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user support messages:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  submitSupportQuery,
  getSupportQueries,
  replySupportQuery,
  markSupportQueryRead,
  getUnreadSupportCount,
  getUserSupportMessages,
};
