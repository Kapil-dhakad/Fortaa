/**
 * Frontend Google Authentication Service
 * Communicates with Google Identity Services (GIS) and Fortaa Backend API
 */

import { jwtDecode } from 'jwt-decode';

/**
 * Send Google Credential (ID Token) to Fortaa Backend
 * Backend validates the token directly with Google, checks if user exists:
 * - If user exists: logs in without duplicate creation
 * - If new: creates user account
 */
export async function authenticateWithBackend(credential, fallbackProfile = null) {
  try {
    const payload = credential ? { credential } : fallbackProfile;

    const response = await fetch('/api/users/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google authentication failed on server');
    }

    // Persist authenticated session
    if (data.token) {
      localStorage.setItem('fortaa_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('fortaa_user', JSON.stringify(data.user));
    }

    return {
      success: true,
      isNewUser: data.isNewUser ?? false,
      message: data.message,
      user: data.user,
      token: data.token,
    };
  } catch (err) {
    console.error('[Google AuthService Error]:', err);
    throw err;
  }
}

/**
 * Decode Google ID Token on Client for instant preview
 */
export function decodeGoogleToken(credential) {
  try {
    return jwtDecode(credential);
  } catch (e) {
    console.warn('[JWT Decode Warning]:', e.message);
    return null;
  }
}

/**
 * Load Google Identity Services script dynamically if not present
 */
export function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      return resolve(window.google.accounts.id);
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.onload = () => resolve(window.google.accounts.id);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services script loaded but API not available'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
}
