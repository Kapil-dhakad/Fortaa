const express = require('express');
const router = express.Router();
const {
  getConversations,
  getChatHistory,
  sendMessageHttp,
} = require('../controller/message.controller');

router.get('/conversations/:userId', getConversations);
router.get('/history/:userId/:otherUserId', getChatHistory);
router.post('/send', sendMessageHttp);

module.exports = router;
