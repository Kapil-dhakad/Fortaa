const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  getConversations,
  getChatHistory,
  sendMessageHttp,
  getUnreadMessagesCount,
  deleteMessage,
} = require('../controller/message.controller');

// Local storage for chat media (photos, videos, documents)
const chatUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `chat_${Date.now()}_${cleanName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

router.get('/unread-count/:userId', getUnreadMessagesCount);
router.get('/conversations/:userId', getConversations);
router.get('/history/:userId/:otherUserId', getChatHistory);
router.post('/send', sendMessageHttp);
router.post('/delete/:messageId', deleteMessage);

module.exports = router;
