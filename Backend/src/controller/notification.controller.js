const db = require('../db/db');

/**
 * Get all notifications for the current user (includes follow requests, accepts, etc.)
 */
async function getUserNotifications(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.query.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, notifications: [], unreadCount: 0 });
    }

    const result = await db.query(
      `SELECT n.id, n.user_id, n.actor_id, n.actor_name, n.actor_avatar, n.type,
              n.message, n.is_read, n.ref_id, n.created_at,
              COALESCE(u.designation, 'Business Leader') as actor_role,
              COALESCE(u.company_brand, 'Fortaa') as actor_company,
              -- Also check current status of the follow request if type is follow_request
              f.status as follow_status
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       LEFT JOIN follows f ON (n.type = 'follow_request' AND f.follower_id = n.actor_id AND f.following_id = n.user_id)
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const unreadCount = result.rows.filter((n) => !n.is_read).length;

    return res.status(200).json({
      success: true,
      notifications: result.rows,
      unreadCount,
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

/**
 * Get unread notification badge count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.query.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(200).json({ success: true, unreadCount: 0 });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, unreadCount: 0 });
    }

    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: parseInt(result.rows[0].count, 10),
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(200).json({ success: true, unreadCount: 0 });
  }
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(req, res) {
  try {
    const userId = parseInt(req.body.userId || req.params.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Marked read (offline)' });
    }

    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
}

/**
 * Delete a specific notification
 */
async function deleteNotification(req, res) {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId || req.query.userId || req.userId, 10);

    if (!notificationId) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Notification deleted' });
    }

    await db.query('DELETE FROM notifications WHERE id = $1', [notificationId]);

    return res.status(200).json({
      success: true,
      message: 'Notification removed',
    });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
}

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
};
