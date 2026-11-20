const BASE_URL = '/api/support';

/**
 * Submit user support query
 */
export async function submitSupportQuery(data) {
  try {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('submitSupportQuery error:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

/**
 * Fetch all support queries for Admin Dashboard
 */
export async function fetchSupportQueries() {
  try {
    const res = await fetch(`${BASE_URL}/queries`);
    if (!res.ok) throw new Error('Failed to fetch support queries');
    return await res.json();
  } catch (err) {
    console.error('fetchSupportQueries error:', err);
    return { success: false, queries: [], unreadCount: 0 };
  }
}

/**
 * Fetch messages for logged-in user's support chat
 */
export async function fetchUserSupportMessages(userId, email) {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);

    const res = await fetch(`${BASE_URL}/user-messages?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch user support messages');
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error('fetchUserSupportMessages error:', err);
    return [];
  }
}

/**
 * Admin replies to or resolves a support query
 */
export async function replySupportQuery(id, reply, status = 'Resolved') {
  try {
    const res = await fetch(`${BASE_URL}/reply/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reply, status }),
    });
    return await res.json();
  } catch (err) {
    console.error('replySupportQuery error:', err);
    return { success: false, message: 'Failed to send reply' };
  }
}

/**
 * Mark a query as read
 */
export async function markSupportQueryRead(id) {
  try {
    const res = await fetch(`${BASE_URL}/read/${id}`, {
      method: 'PATCH',
    });
    return await res.json();
  } catch (err) {
    console.error('markSupportQueryRead error:', err);
    return { success: false };
  }
}

/**
 * Fetch unread count for Admin topbar chat badge
 */
export async function fetchUnreadSupportCount() {
  try {
    const res = await fetch(`${BASE_URL}/unread-count`);
    if (!res.ok) throw new Error('Failed to fetch unread count');
    const data = await res.json();
    return data.count || 0;
  } catch (err) {
    console.error('fetchUnreadSupportCount error:', err);
    return 0;
  }
}
