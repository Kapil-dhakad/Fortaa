// Frontend Service for Notifications (Real-time in-app alerts)

const BASE_URL = '/api/notifications';

/**
 * Get all notifications for current user
 */
export async function fetchNotifications(userId) {
  try {
    const res = await fetch(`${BASE_URL}/${userId}`);
    const data = await res.json();
    return data.notifications || [];
  } catch (err) {
    console.error('fetchNotifications error:', err);
    return [];
  }
}

/**
 * Get unread badge count
 */
export async function fetchUnreadCount(userId) {
  try {
    const res = await fetch(`${BASE_URL}/count/${userId}`);
    const data = await res.json();
    return data.unreadCount || 0;
  } catch (err) {
    console.error('fetchUnreadCount error:', err);
    return 0;
  }
}

/**
 * Mark all notifications as read
 */
export async function markNotificationsRead(userId) {
  try {
    const res = await fetch(`${BASE_URL}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('markNotificationsRead error:', err);
    return { success: false };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('deleteNotification error:', err);
    return { success: false };
  }
}
