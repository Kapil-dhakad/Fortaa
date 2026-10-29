/**
 * Authentication Validators
 * Strict validation for Registration, Login, and Social Auth
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,}$/;
const NAME_REGEX = /^[a-zA-Z\s]{3,50}$/;

/**
 * Validates standard user registration payload
 */
function validateRegistration(req, res, next) {
  const { name, fullName, email, mobileNumber, whatsappNumber, password } = req.body;

  const resolvedName = (name || fullName || '').trim();
  const resolvedEmail = (email || '').trim().toLowerCase();
  const resolvedMobile = (mobileNumber || '').trim();
  const resolvedWhatsApp = (whatsappNumber || '').trim();
  const resolvedPassword = password || '';

  // 1. Name Validation
  if (!resolvedName) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required.',
      field: 'name',
    });
  }
  if (!NAME_REGEX.test(resolvedName)) {
    return res.status(400).json({
      success: false,
      message: 'Full name must contain only alphabets and be at least 3 characters long.',
      field: 'name',
    });
  }

  // 2. Email Validation
  if (!resolvedEmail) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required.',
      field: 'email',
    });
  }
  if (!EMAIL_REGEX.test(resolvedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address (e.g. name@domain.com).',
      field: 'email',
    });
  }

  // 3. Indian Mobile Number Validation
  if (!resolvedMobile) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required.',
      field: 'mobileNumber',
    });
  }
  if (!INDIAN_PHONE_REGEX.test(resolvedMobile)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9).',
      field: 'mobileNumber',
    });
  }

  // 4. WhatsApp Number Validation (if provided)
  if (resolvedWhatsApp && !INDIAN_PHONE_REGEX.test(resolvedWhatsApp)) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp number must be a valid 10-digit Indian mobile number (starting with 6-9).',
      field: 'whatsappNumber',
    });
  }

  // 5. Strong Password Validation
  if (!resolvedPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password is required.',
      field: 'password',
    });
  }
  if (!PASSWORD_REGEX.test(resolvedPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (!@#$%^&* etc.).',
      field: 'password',
    });
  }

  next();
}

/**
 * Validates Google OAuth request payload
 */
function validateGoogleAuth(req, res, next) {
  const { credential, email, name } = req.body;

  // Case 1: Google ID token credential provided
  if (credential && typeof credential === 'string') {
    if (credential.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential token provided.',
      });
    }
    return next();
  }

  // Case 2: Direct verified user profile payload
  if (email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format provided from Google authentication.',
      });
    }

    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User name is required for registration.',
      });
    }

    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Google authentication requires a valid credential token or verified profile.',
  });
}

module.exports = {
  validateRegistration,
  validateGoogleAuth,
  EMAIL_REGEX,
  INDIAN_PHONE_REGEX,
  PASSWORD_REGEX,
  NAME_REGEX,
};
