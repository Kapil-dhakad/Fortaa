/**
 * Google Authentication Service
 * Verifies Google OAuth ID Tokens securely using Google's official tokeninfo endpoint
 */

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid Google ID token');
  }

  const tokenUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;

  try {
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error_description || data.error || 'Google token validation failed';
      throw new Error(errorMsg);
    }

    // Verify email presence and verification status
    if (!data.email) {
      throw new Error('Google token did not contain an email address');
    }

    const isEmailVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!isEmailVerified) {
      throw new Error('The Google email address is not verified by Google');
    }

    return {
      googleId: data.sub,
      email: data.email.toLowerCase().trim(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null,
      emailVerified: true,
      audience: data.aud,
    };
  } catch (err) {
    console.error('[GoogleAuthService Error]:', err.message);
    throw err;
  }
}

module.exports = {
  verifyGoogleIdToken,
};
