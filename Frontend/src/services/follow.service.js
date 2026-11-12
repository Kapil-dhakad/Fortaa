// Frontend Service for Fortaa Follow & Social Graph APIs

const BASE_URL = '/api/follow';

/**
 * Send Follow Request (Status: pending)
 */
export async function sendFollowRequest(targetUserId, currentUserId) {
  try {
    const res = await fetch(`${BASE_URL}/request/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId }),
    });
    return await res.json();
  } catch (err) {
    console.error('sendFollowRequest error:', err);
    return { success: false, message: 'Network error sending follow request' };
  }
}

/**
 * Accept incoming Follow Request
 */
export async function acceptFollowRequest(requesterId, currentUserId, notificationId = null) {
  try {
    const res = await fetch(`${BASE_URL}/accept/${requesterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, notificationId }),
    });
    return await res.json();
  } catch (err) {
    console.error('acceptFollowRequest error:', err);
    return { success: false, message: 'Network error accepting follow request' };
  }
}

/**
 * Reject / Decline incoming Follow Request
 */
export async function rejectFollowRequest(requesterId, currentUserId, notificationId = null) {
  try {
    const res = await fetch(`${BASE_URL}/reject/${requesterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, notificationId }),
    });
    return await res.json();
  } catch (err) {
    console.error('rejectFollowRequest error:', err);
    return { success: false, message: 'Network error declining follow request' };
  }
}

/**
 * Cancel outgoing pending Follow Request
 */
export async function cancelFollowRequest(targetUserId, currentUserId) {
  try {
    const res = await fetch(`${BASE_URL}/cancel/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId }),
    });
    return await res.json();
  } catch (err) {
    console.error('cancelFollowRequest error:', err);
    return { success: false, message: 'Network error cancelling follow request' };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId, currentUserId) {
  try {
    const res = await fetch(`${BASE_URL}/unfollow/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId }),
    });
    return await res.json();
  } catch (err) {
    console.error('unfollowUser error:', err);
    return { success: false, message: 'Network error unfollowing user' };
  }
}

/**
 * Toggle Follow or Unfollow (Legacy fallback)
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
 * Get pending incoming follow requests
 */
export async function fetchPendingRequests(userId) {
  try {
    const res = await fetch(`${BASE_URL}/requests/pending/${userId}`);
    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    console.error('fetchPendingRequests error:', err);
    return [];
  }
}

/**
 * Get followers of a user (Accepted)
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
 * Get list of users followed by a user (includes 'follow_status': 'accepted' | 'pending')
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
 * Get array of IDs that current user is following and pending
 * Returns { followingIds: number[], pendingIds: number[] }
 */
export async function fetchFollowingIds(userId) {
  try {
    const res = await fetch(`${BASE_URL}/following-ids/${userId}`);
    const data = await res.json();
    return {
      followingIds: data.followingIds || [],
      pendingIds: data.pendingIds || [],
    };
  } catch (err) {
    console.error('fetchFollowingIds error:', err);
    return { followingIds: [], pendingIds: [] };
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
