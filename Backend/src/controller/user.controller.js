const userModel = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/db');
const { sendOtpEmail, sendWelcomeEmail, handleProfileViewNotification } = require('../services/email.service');
const { sendWhatsAppOtp: sendWhatsAppOtpMessage, sendWhatsAppWelcomeMessage, formatPhoneNumber } = require('../services/whatsapp.service');

/**
 * Register User with 4-step onboarding data
 */
async function registerUser(req, res) {
  try {
    const {
      accountType,
      name,
      fullName,
      email,
      password,
      mobileNumber,
      whatsappNumber,
      dob,
      gender,
      referralId,
      businessName,
      companyBrand,
      businessCategory,
      designation,
      experience,
      websiteSocial,
      mobileVerified,
      emailVerified,
      govtIdUrl,
      businessDocUrl,
      catalogUrl,
      avatarUrl,
      avatar_url,
    } = req.body;

    const resolvedName = (name || fullName || '').trim();
    const resolvedEmail = (email || '').trim().toLowerCase();
    const resolvedPassword = password || 'Fortaa@12345'; 

    if (!resolvedName || !resolvedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required for registration.',
      });
    }

    const userAlreadyExists = await userModel.findOne({ email: resolvedEmail });
    if (userAlreadyExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const resolvedMobile = (mobileNumber || '').trim();
    if (resolvedMobile) {
      const mobileAlreadyExists = await userModel.findOne({ mobileNumber: resolvedMobile });
      if (mobileAlreadyExists) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists. Please use a different number or log in.',
        });
      }
    }


    const hash = await bcrypt.hash(resolvedPassword, 10);


    const user = await userModel.create({
      accountType: accountType || 'Individual / Professional',
      name: resolvedName,
      email: resolvedEmail,
      password: hash,
      mobileNumber: mobileNumber || '',
      whatsappNumber: whatsappNumber || '',
      dob: dob || null,
      gender: gender || null,
      referralId: referralId || null,
      businessName: businessName || null,
      companyBrand: companyBrand || null,
      businessCategory: businessCategory || null,
      designation: designation || null,
      experience: experience || null,
      websiteSocial: websiteSocial || null,
      mobileVerified: mobileVerified ?? true,
      emailVerified: emailVerified ?? true,
      govtIdUrl: govtIdUrl || null,
      businessDocUrl: businessDocUrl || null,
      catalogUrl: catalogUrl || null,
      avatarUrl: avatarUrl || avatar_url || null,
    });

   
    const token = jwt.sign(
      { id: user._id, memberId: user.member_id },
      process.env.JWT_SECRET || 'fortaa_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send Welcome Email & WhatsApp message asynchronously (non-blocking)
    try {
      if (user.email) {
        sendWelcomeEmail(user.email, user.name).catch((emErr) =>
          console.warn('[Welcome Email Warning]:', emErr.message)
        );
      }
      const mobileToSend = user.whatsapp_number || user.mobile_number || mobileNumber || whatsappNumber;
      if (mobileToSend) {
        sendWhatsAppWelcomeMessage(mobileToSend, user.name).catch((waErr) =>
          console.warn('[Welcome WhatsApp Warning]:', waErr.message)
        );
      }
    } catch (msgErr) {
      console.warn('[Welcome notifications warning]:', msgErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        memberId: user.member_id,
        accountType: user.account_type,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobile_number,
        dob: user.dob,
        gender: user.gender,
        businessName: user.business_name,
        companyBrand: user.company_brand,
        businessCategory: user.business_category,
        designation: user.designation,
        experience: user.experience,
        govtIdUrl: user.govt_id_url,
        avatarUrl: user.avatar_url || user.avatarUrl || null,
        coverUrl: user.cover_url || user.coverUrl || null,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later',
      error: error.message,
    });
  }
}


async function loginUser(req, res) {
  try {
    const { email, emailOrMobile, password } = req.body;
    const loginIdentifier = (email || emailOrMobile || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

   
    let user = await userModel.findOne({ email: loginIdentifier.toLowerCase() });
    if (!user) {
      const cleanPhone = loginIdentifier.replace(/[\s\-\+\(\)]/g, '').replace(/^91(?=\d{10})/, '').trim();
      user = await userModel.findOne({ mobileNumber: cleanPhone });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const token = jwt.sign(
      { id: user._id, memberId: user.member_id },
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
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        memberId: user.member_id,
        accountType: user.account_type,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobile_number,
        company: user.company_brand,
        designation: user.designation,
        avatarUrl: user.avatar_url || user.avatarUrl || null,
        coverUrl: user.cover_url || user.coverUrl || null,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later',
    });
  }
}

/**
 * Get Current User Profile (Protected)
 */
async function getMe(req, res) {
  try {
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id || user._id,
        _id: user.id || user._id,
        memberId: user.member_id,
        accountType: user.account_type,
        name: user.name,
        username: user.username || (user.email ? user.email.split('@')[0] : 'user'),
        email: user.email,
        mobileNumber: user.mobile_number,
        whatsappNumber: user.whatsapp_number,
        dob: user.dob,
        gender: user.gender,
        location: user.location,
        skills: user.skills,
        bio: user.bio,
        businessName: user.business_name,
        companyBrand: user.company_brand,
        businessCategory: user.business_category,
        designation: user.designation,
        experience: user.experience,
        websiteSocial: user.website_social,
        profileVisibility: user.profile_visibility || 'public',
        govtIdUrl: user.govt_id_url,
        avatarUrl: user.avatar_url || user.avatarUrl || null,
        coverUrl: user.cover_url || user.coverUrl || null,
      },
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

/**
 * Logout User
 */
async function logoutUser(req, res) {
  try {
    res.clearCookie('token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Logout Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

/**
 * Get All Registered Users (For Admin Panel)
 */
async function getAllUsers(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const users = await userModel.findAll(limit);
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('[GetAllUsers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
}

/**
 * Get User Statistics (For Admin Dashboard)
 */
async function getUserStats(req, res) {
  try {
    const stats = await userModel.getStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[GetUserStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message,
    });
  }
}

/**
 * Check if Email already exists in Database
 */
async function checkEmail(req, res) {
  try {
    const email = (req.query.email || req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: 'Email is available',
    });
  } catch (error) {
    console.error('[CheckEmail Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check email',
      error: error.message,
    });
  }
}

/**
 * Check if Mobile Number already exists in Database
 */
async function checkMobile(req, res) {
  try {
    const mobile = (req.query.mobile || req.body.mobile || req.query.mobileNumber || req.body.mobileNumber || '').trim();

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    const existingUser = await userModel.findOne({ mobileNumber: mobile });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: 'This mobile number is already registered. Please log in or use another number.',
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: 'Mobile number is available',
    });
  } catch (error) {
    console.error('[CheckMobile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check mobile number',
      error: error.message,
    });
  }
}

/**
 * Get User Profile by ID
 */
async function getUserProfile(req, res) {
  try {
    const userId = parseInt(req.params.id || req.userId || req.query.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (db.isDBConnected()) {
      const result = await db.query(
        `SELECT id, member_id, account_type, name, username, email, mobile_number, dob, gender,
                location, skills, experience, bio, designation, company_brand, business_name, avatar_url, cover_url,
                website_social, COALESCE(profile_visibility, 'public') as profile_visibility, created_at
         FROM users WHERE id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Record profile view and trigger LinkedIn-style email notification (Throttled to 1 email / 24h per viewer)
      const viewerId = req.query.viewerId || req.body?.viewerId || req.userId;
      if (viewerId && Number(viewerId) !== Number(userId)) {
        handleProfileViewNotification(viewerId, userId).catch((err) => {
          console.warn('[Profile View Notification Warning]:', err.message);
        });
      }

      return res.status(200).json({ success: true, profile: result.rows[0] });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: userId,
        name: 'Kapil Dhakad',
        username: 'kapil',
        email: 'dhakadkapil350@gmail.com',
        designation: 'Senior Leader',
        company_brand: 'Forever Living',
        profile_visibility: 'public',
      },
    });
  } catch (error) {
    console.error('[getUserProfile Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
}

/**
 * Update User Profile
 */
async function updateUserProfile(req, res) {
  try {
    const userId = parseInt(req.params.id || req.userId || req.body.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const {
      name,
      username,
      dob,
      gender,
      location,
      skills,
      experience,
      bio,
      mobileNumber,
      avatarUrl,
      coverUrl,
      cover_url,
      businessName,
      business_name,
      companyBrand,
      company_brand,
      businessCategory,
      business_category,
      designation,
      whatsappNumber,
      referralId,
      govtIdUrl,
      profileVisibility,
      profile_visibility,
    } = req.body;

    const visibilityVal = profileVisibility || profile_visibility || null;

    let cleanMobile = null;
    if (mobileNumber) {
      cleanMobile = String(mobileNumber).trim().replace(/\D/g, '').slice(-10);
      if (cleanMobile.length === 10 && db.isDBConnected()) {
        const curUserRes = await db.query('SELECT mobile_number FROM users WHERE id = $1', [userId]);
        const curMobile = curUserRes.rows[0]?.mobile_number;
        // Only run duplicate mobile validation if user is actually changing to a new mobile number
        if (curMobile !== cleanMobile) {
          const dupCheck = await db.query(
            'SELECT id FROM users WHERE mobile_number = $1 AND id != $2 LIMIT 1',
            [cleanMobile, userId]
          );
          if (dupCheck.rows.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'This mobile number is already registered with another account.',
            });
          }
        }
      }
    }

    if (db.isDBConnected()) {
      const updateRes = await db.query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             username = COALESCE($2, username),
             dob = COALESCE($3, dob),
             gender = COALESCE($4, gender),
             location = COALESCE($5, location),
             skills = COALESCE($6, skills),
             experience = COALESCE($7, experience),
             bio = COALESCE($8, bio),
             mobile_number = COALESCE($9, mobile_number),
             mobile_verified = CASE WHEN $9 IS NOT NULL AND $9 != '' THEN TRUE ELSE mobile_verified END,
             avatar_url = COALESCE($10, avatar_url),
             business_name = COALESCE($11, business_name),
             company_brand = COALESCE($12, company_brand),
             business_category = COALESCE($13, business_category),
             designation = COALESCE($14, designation),
             whatsapp_number = COALESCE($15, whatsapp_number),
             referral_id = COALESCE($16, referral_id),
             govt_id_url = COALESCE($17, govt_id_url),
             profile_visibility = COALESCE($18, profile_visibility),
             cover_url = COALESCE($19, cover_url)
         WHERE id = $20
         RETURNING id, member_id, account_type, name, username, email, mobile_number, whatsapp_number, dob, gender,
                   location, skills, experience, bio, designation, company_brand, business_name, business_category,
                   referral_id, govt_id_url, avatar_url, cover_url, COALESCE(profile_visibility, 'public') as profile_visibility`,
        [
          name || null,
          username || null,
          dob || null,
          gender || null,
          location || null,
          skills || null,
          experience || null,
          bio || null,
          cleanMobile || mobileNumber || null,
          avatarUrl || null,
          businessName || business_name || null,
          companyBrand || company_brand || null,
          businessCategory || business_category || null,
          designation || null,
          whatsappNumber || null,
          referralId || null,
          govtIdUrl || null,
          visibilityVal,
          coverUrl || cover_url || null,
          userId,
        ]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updateRes.rows[0],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully (offline)',
      profile: req.body,
    });
  } catch (error) {
    console.error('[updateUserProfile Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
}

/**
 * Get Downline Network Team for a user
 */
async function getUserTeam(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(200).json({ success: true, team: [] });
    }
    if (db.isDBConnected()) {
      const uRes = await db.query('SELECT member_id FROM users WHERE id = $1', [userId]);
      const memberId = uRes.rows[0]?.member_id;

      let teamRows = [];
      if (memberId) {
        const teamRes = await db.query(
          `SELECT id, name, email, member_id, avatar_url,
                  COALESCE(designation, 'Leader') as designation,
                  COALESCE(company_brand, 'Fortaa') as company_brand
           FROM users
           WHERE referral_id = $1
           ORDER BY id DESC`,
          [memberId]
        );
        teamRows = teamRes.rows;
      }
      return res.status(200).json({ success: true, team: teamRows });
    }
    return res.status(200).json({ success: true, team: [] });
  } catch (err) {
    console.error('getUserTeam error:', err);
    return res.status(200).json({ success: true, team: [] });
  }
}

// In-memory store for password reset sessions: identifierKey -> { userId, identifier, isMobile, otp, expiresAt, attempts, resetToken, createdAt }
const passwordResetStore = new Map();

// Periodic cleanup every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of passwordResetStore.entries()) {
    if (item.expiresAt < now) {
      passwordResetStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

function normalizeResetIdentifier(raw) {
  const clean = (raw || '').trim();
  if (clean.includes('@')) {
    return { isEmail: true, key: clean.toLowerCase(), original: clean };
  }
  const digits = clean.replace(/\D/g, '');
  const key = digits.length >= 10 ? digits.slice(-10) : digits;
  return { isEmail: false, key, original: clean, digits };
}

/**
 * POST /api/users/forgot-password
 * Body: { identifier } (email or mobile number)
 */
async function forgotPassword(req, res) {
  try {
    const rawIdentifier = req.body.identifier || req.body.emailOrMobile || req.body.email || req.body.mobile || '';
    if (!rawIdentifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your registered email or mobile number.',
      });
    }

    const { isEmail, key, original } = normalizeResetIdentifier(rawIdentifier);
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or mobile number provided.',
      });
    }

    // Lookup user by email or mobile
    let user = null;
    if (isEmail) {
      user = await userModel.findOne({ email: key });
    } else {
      if (db.isConnected()) {
        const queryRes = await db.query(
          `SELECT * FROM users 
           WHERE mobile_number = $1 
              OR whatsapp_number = $1 
              OR RIGHT(REGEXP_REPLACE(COALESCE(mobile_number, ''), '\\D', '', 'g'), 10) = $2
              OR RIGHT(REGEXP_REPLACE(COALESCE(whatsapp_number, ''), '\\D', '', 'g'), 10) = $2
           LIMIT 1`,
          [original, key]
        );
        if (queryRes.rows.length > 0) {
          user = queryRes.rows[0];
        }
      }
      if (!user) {
        user = await userModel.findOne({ mobileNumber: key });
      }
      if (!user && original !== key) {
        user = await userModel.findOne({ mobileNumber: original });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: isEmail
          ? 'No account found with this email address. Please check and try again.'
          : 'No account found with this mobile number. Please check and try again.',
      });
    }

    // Rate-limiting check: 30 seconds
    const existing = passwordResetStore.get(key);
    if (existing && existing.createdAt && Date.now() - existing.createdAt < 30 * 1000) {
      const waitSeconds = Math.ceil((30 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory
    passwordResetStore.set(key, {
      userId: user.id || user._id,
      identifier: isEmail ? user.email : key,
      isMobile: !isEmail,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
      attempts: 0,
      resetToken: null,
    });

    let maskedTarget = '';
    let simulated = false;

    if (isEmail) {
      const email = user.email || key;
      const [uPart, dPart] = email.split('@');
      maskedTarget = uPart.length > 2 ? `${uPart.slice(0, 2)}***@${dPart}` : `${uPart}***@${dPart}`;
      const emailRes = await sendOtpEmail(email, otp);
      simulated = emailRes?.simulated || false;
    } else {
      const rawPhone = user.mobile_number || user.whatsapp_number || key;
      const cleanDigits = rawPhone.toString().replace(/\D/g, '');
      const clean10 = cleanDigits.slice(-10);
      maskedTarget = `+91 ${clean10}`;
      const formattedPhone = formatPhoneNumber ? formatPhoneNumber(rawPhone) : `+91 ${clean10}`;
      const waRes = await sendWhatsAppOtpMessage(formattedPhone, otp);
      simulated = waRes?.simulated || false;
    }

    return res.status(200).json({
      success: true,
      message: isEmail
        ? 'We have sent a 6-digit verification code to your email.'
        : 'We have sent a 6-digit code to your WhatsApp / mobile number.',
      isMobile: !isEmail,
      maskedTarget,
      identifier: key,
      simulated,
    });
  } catch (err) {
    console.error('[forgotPassword Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request. Please try again later.',
      error: err.message,
    });
  }
}

/**
 * POST /api/users/verify-reset-otp
 * Body: { identifier, otp }
 */
async function verifyResetOtp(req, res) {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.mobile || '';
    const rawOtp = (req.body.otp || '').toString().trim();

    if (!rawIdentifier || !rawOtp) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and 6-digit OTP code are required.',
      });
    }

    const { key } = normalizeResetIdentifier(rawIdentifier);
    const record = passwordResetStore.get(key);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active reset session found or the session has expired. Please request a new OTP.',
      });
    }

    if (Date.now() > record.expiresAt) {
      passwordResetStore.delete(key);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    if (record.attempts >= 5) {
      passwordResetStore.delete(key);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    if (record.otp !== rawOtp) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Generate resetToken valid for 15 minutes
    const resetToken = crypto.randomBytes(24).toString('hex');
    record.resetToken = resetToken;
    record.tokenExpiresAt = Date.now() + 15 * 60 * 1000;

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (err) {
    console.error('[verifyResetOtp Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
      error: err.message,
    });
  }
}

/**
 * POST /api/users/reset-password
 * Body: { identifier, resetToken, newPassword }
 */
async function resetPassword(req, res) {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.mobile || '';
    const resetToken = (req.body.resetToken || '').trim();
    const newPassword = (req.body.newPassword || '').trim();

    if (!rawIdentifier || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const { key } = normalizeResetIdentifier(rawIdentifier);
    const record = passwordResetStore.get(key);

    if (!record || record.resetToken !== resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please restart the forgot password process.',
      });
    }

    if (record.tokenExpiresAt && Date.now() > record.tokenExpiresAt) {
      passwordResetStore.delete(key);
      return res.status(400).json({
        success: false,
        message: 'Reset session expired. Please start over.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(record.userId, hashedPassword);

    // Clean up reset session
    passwordResetStore.delete(key);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('[resetPassword Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
      error: err.message,
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsers,
  getUserStats,
  checkEmail,
  checkMobile,
  getUserProfile,
  updateUserProfile,
  getUserTeam,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
