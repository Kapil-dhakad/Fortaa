const express = require('express');
const router = express.Router();
const {
  submitSupportQuery,
  getSupportQueries,
  replySupportQuery,
  markSupportQueryRead,
  getUnreadSupportCount,
  getUserSupportMessages,
} = require('../controller/support.controller');

// Submit query / message from User Live Chat
router.post('/query', submitSupportQuery);

// Get user conversation messages
router.get('/user-messages', getUserSupportMessages);

// Get queries list for Admin Dashboard
router.get('/queries', getSupportQueries);

// Unread count for Admin topbar
router.get('/unread-count', getUnreadSupportCount);

// Admin replies or resolves
router.post('/reply/:id', replySupportQuery);

// Mark read
router.patch('/read/:id', markSupportQueryRead);

module.exports = router;
