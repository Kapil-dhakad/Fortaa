// Frontend Service for User Profile API

const BASE_URL = '/api/users';

export async function fetchUserProfile(userId) {
  try {
    const res = await fetch(`${BASE_URL}/profile/${userId}`);
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
