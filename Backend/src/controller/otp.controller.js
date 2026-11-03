const { sendOtpEmail } = require('../services/email.service');
const userModel = require('../model/user.model');

// In-memory OTP storage: email -> { otp, expiresAt, attempts }
const otpStore = new Map();

/**
 * Clean up expired OTPs periodically (every 15 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 15 * 60 * 1000);

/**
 * POST /api/users/send-email-otp
 * Body: { email }
 */
async function sendEmailOtp(req, res) {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if user already exists with this email
    const existingUser = await userModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Rate-limiting check: Don't allow resending within 30 seconds
    const existing = otpStore.get(cleanEmail);
    if (existing && existing.createdAt && Date.now() - existing.createdAt < 30 * 1000) {
      const waitSeconds = Math.ceil((30 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code`,
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 10-minute validity
    otpStore.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
      attempts: 0,
    });

    // Send email via service
    const result = await sendOtpEmail(cleanEmail, otp);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email successfully',
      simulated: result.simulated || false,
    });
  } catch (error) {
    console.error('[sendEmailOtp Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.',
      error: error.message,
    });
  }
}

/**
 * POST /api/users/verify-email-otp
 * Body: { email, otp }
 */
async function verifyEmailOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required',
      });
    }

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email. Please click "Verify" to request a code.',
      });
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Max 5 attempts
    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    // Verify match
    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Success: remove used OTP
    otpStore.delete(cleanEmail);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! ✓',
    });
  } catch (error) {
    console.error('[verifyEmailOtp Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
      error: error.message,
    });
  }
}

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
};
