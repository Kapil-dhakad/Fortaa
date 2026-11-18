const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
  markAllAsSeen,
  markOneAsRead,
  deleteNotification,
} = require('../controller/notification.controller');

// Get all notifications for user
router.get('/:userId', getUserNotifications);

// Get unread notification count
router.get('/count/:userId', getUnreadCount);

// Mark all as read
router.post('/mark-read', markAllAsRead);

// Mark all as seen (clears bell count)
router.post('/mark-seen', markAllAsSeen);

// Mark single notification as read
router.post('/:id/read', markOneAsRead);
router.patch('/:id/read', markOneAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
