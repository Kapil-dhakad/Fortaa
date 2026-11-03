// Frontend Service for Fortaa Follow & Social Graph APIs

const BASE_URL = '/api/follow';

/**
 * Follow or Unfollow a user (Toggle)
 */
export async function toggleFollowUser(targetUserId, currentUserId) {
  try {
    const res = await fetch(`${BASE_URL}/toggle/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId }),
    });
    return await res.json();
  } catch (err) {
    console.error('toggleFollowUser error:', err);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Get followers of a user
 */
export async function fetchFollowers(userId) {
  try {
    const res = await fetch(`${BASE_URL}/followers/${userId}`);
    const data = await res.json();
    return data.followers || [];
  } catch (err) {
    console.error('fetchFollowers error:', err);
    return [];
  }
}

/**
 * Get list of users followed by a user
 */
export async function fetchFollowing(userId) {
  try {
    const res = await fetch(`${BASE_URL}/following/${userId}`);
    const data = await res.json();
    return data.following || [];
  } catch (err) {
    console.error('fetchFollowing error:', err);
    return [];
  }
}

/**
 * Get array of IDs that current user is following (e.g. [2, 5, 8])
 */
export async function fetchFollowingIds(userId) {
  try {
    const res = await fetch(`${BASE_URL}/following-ids/${userId}`);
    const data = await res.json();
    return data.followingIds || [];
  } catch (err) {
    console.error('fetchFollowingIds error:', err);
    return [];
  }
}

/**
 * Get real social counts (followers, following, posts)
 */
export async function fetchUserSocialCounts(userId) {
  try {
    const res = await fetch(`${BASE_URL}/counts/${userId}`);
    return await res.json();
  } catch (err) {
    console.error('fetchUserSocialCounts error:', err);
    return null;
  }
}
