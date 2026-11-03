const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
} = require('../controller/notification.controller');

// Get all notifications for user
router.get('/:userId', getUserNotifications);

// Get unread notification count
router.get('/count/:userId', getUnreadCount);

// Mark all as read
router.post('/mark-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
