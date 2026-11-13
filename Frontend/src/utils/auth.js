/**
 * Authentication Helper Utilities for Fortaa
 */

export function getAuthUser() {
  try {
    const raw = localStorage.getItem('fortaa_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && (user.id || user.email)) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthUser());
}

export function getRedirectUrl(fallback = '/dashboard') {
  if (typeof window === 'undefined') return fallback;
  try {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
