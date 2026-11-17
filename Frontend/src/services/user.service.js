// Frontend Service for User Profile API

const BASE_URL = '/api/users';

/**
 * Fetch authenticated current user profile from /api/users/me using Bearer token
 */
export async function fetchCurrentUser() {
  try {
    const token = localStorage.getItem('fortaa_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success ? data.user : null;
  } catch (err) {
    console.error('fetchCurrentUser error:', err);
    return null;
  }
}

export async function fetchUserProfile(userId, viewerId = null) {
  try {
    const url = viewerId
      ? `${BASE_URL}/profile/${userId}?viewerId=${viewerId}`
      : `${BASE_URL}/profile/${userId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    return data.profile;
  } catch (err) {
    console.error('fetchUserProfile error:', err);
    return null;
  }
}

export async function updateUserProfile(userId, profileData) {
  try {
    const res = await fetch(`${BASE_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  } catch (err) {
    console.error('updateUserProfile error:', err);
    throw err;
  }
}
