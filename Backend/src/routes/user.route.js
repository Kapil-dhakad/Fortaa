const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsers,
  getUserStats,
} = require('../controller/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logoutUser);

// Admin user data routes
router.get('/all', getAllUsers);
router.get('/stats', getUserStats);

module.exports = router;
