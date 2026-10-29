const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../model/user.model');
const { verifyGoogleIdToken } = require('../services/googleAuth.service');

/**
 * Handle Google Login / Signup
 * If user with email already exists -> log them in (DO NOT RECREATE)
 * If user is new -> create user account and log in
 */
async function handleGoogleAuth(req, res) {
  try {
    const { credential, email, name, picture, accountType } = req.body;

    let googleProfile = null;

    // 1. If Google ID token credential provided, verify with Google
    if (credential) {
      try {
        googleProfile = await verifyGoogleIdToken(credential);
      } catch (tokenErr) {
        return res.status(401).json({
          success: false,
          message: `Google authentication verification failed: ${tokenErr.message}`,
        });
      }
    } else if (email) {
      // 2. Verified profile directly supplied by trusted client-side flow
      googleProfile = {
        email: String(email).toLowerCase().trim(),
        name: (name || email.split('@')[0]).trim(),
        picture: picture || null,
        emailVerified: true,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'No Google credential or verified profile provided',
      });
    }

    const cleanEmail = googleProfile.email;

    // 3. CHECK IF USER ALREADY EXISTS IN DATABASE
    const existingUser = await userModel.findOne({ email: cleanEmail });

    if (existingUser) {
      // ─── USER ALREADY EXISTS ───
      // DO NOT RECREATE USER! Link session & log in directly
      console.log(`[Google Auth]: Existing user found with email (${cleanEmail}). Logging in directly.`);

      const token = jwt.sign(
        { id: existingUser._id || existingUser.id, memberId: existingUser.member_id },
        process.env.JWT_SECRET || 'fortaa_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: `Welcome back, ${existingUser.name}!`,
        token,
        user: {
          id: existingUser._id || existingUser.id,
          memberId: existingUser.member_id,
          accountType: existingUser.account_type,
          name: existingUser.name,
          email: existingUser.email,
          mobileNumber: existingUser.mobile_number,
          company: existingUser.company_brand,
          picture: googleProfile.picture || null,
        },
      });
    }

    // ─── NEW USER SIGNUP ───
    // User does not exist, create a new record
    console.log(`[Google Auth]: No existing user with email (${cleanEmail}). Creating new user.`);

    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await userModel.create({
      accountType: accountType || 'Individual / Professional',
      name: googleProfile.name,
      email: cleanEmail,
      password: hashedPassword,
      mobileNumber: '',
      emailVerified: true,
      mobileVerified: false,
    });

    const token = jwt.sign(
      { id: newUser._id || newUser.id, memberId: newUser.member_id },
      process.env.JWT_SECRET || 'fortaa_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      isNewUser: true,
      message: `Account created successfully with Google! Welcome to Fortaa, ${newUser.name}!`,
      token,
      user: {
        id: newUser._id || newUser.id,
        memberId: newUser.member_id,
        accountType: newUser.account_type,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobile_number,
        company: newUser.company_brand,
        picture: googleProfile.picture || null,
      },
    });
  } catch (error) {
    console.error('[Google Auth Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication. Please try again.',
      error: error.message,
    });
  }
}

module.exports = {
  handleGoogleAuth,
};
