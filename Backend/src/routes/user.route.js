const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsers,
  getUserStats,
  checkEmail,
  getUserProfile,
  updateUserProfile,
} = require('../controller/user.controller');
const { handleGoogleAuth } = require('../controller/googleAuth.controller');
const { sendEmailOtp, verifyEmailOtp } = require('../controller/otp.controller');
const { validateGoogleAuth, validateRegistration } = require('../validators/auth.validator');
const authMiddleware = require('../middleware/auth.middleware');

// Authentication routes
router.get('/check-email', checkEmail);
router.post('/register', validateRegistration, registerUser);
router.post('/login', loginUser);
router.post('/google-login', validateGoogleAuth, handleGoogleAuth);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logoutUser);

// Admin user data routes
router.get('/all', getAllUsers);
router.get('/stats', getUserStats);

// Profile routes
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', updateUserProfile);

module.exports = router;
