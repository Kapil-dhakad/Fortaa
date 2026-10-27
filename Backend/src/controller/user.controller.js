const userModel = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    } = req.body;

    const resolvedName = (name || fullName || '').trim();
    const resolvedEmail = (email || '').trim().toLowerCase();
    const resolvedPassword = password || 'Fortaa@12345'; // Default secure password if not provided

    if (!resolvedName || !resolvedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required for registration.',
      });
    }

    // Check if user already exists
    const userAlreadyExists = await userModel.findOne({ email: resolvedEmail });
    if (userAlreadyExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password
    const hash = await bcrypt.hash(resolvedPassword, 10);

    // Save user
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
    });

    // Generate JWT token
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

/**
 * Login User by Email or Mobile
 */
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

    // Try finding by email first, then mobile
    let user = await userModel.findOne({ email: loginIdentifier });
    if (!user) {
      user = await userModel.findOne({ mobileNumber: loginIdentifier });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email or mobile number',
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsers,
  getUserStats,
};
