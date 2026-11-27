import {
  fetchUnreadNotificationCountApi,
  fetchUnreadMessageCountApi,
  markNotificationsSeenApi,
} from './api';

let currentCounts = {
  notificationCount: 0,
  messageCount: 0,
};

const listeners = new Set();
let pollingTimer = null;
let activeUserId = null;

export function getUnreadCounts() {
  return currentCounts;
}

export function subscribeUnreadCounts(listener) {
  listeners.add(listener);
  try {
    listener(currentCounts);
  } catch (e) {
    console.warn('subscribeUnreadCounts initial error:', e);
  }
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(currentCounts);
    } catch (e) {
      console.warn('unread listener error:', e);
    }
  });
}

export async function refreshUnreadCounts(userId = activeUserId) {
  const uid = userId || activeUserId;
  if (!uid) return currentCounts;

  try {
    const [notifCnt, msgCnt] = await Promise.all([
      fetchUnreadNotificationCountApi(uid),
      fetchUnreadMessageCountApi(uid),
    ]);

    const updated = {
      notificationCount: Number(notifCnt) || 0,
      messageCount: Number(msgCnt) || 0,
    };

    if (
      updated.notificationCount !== currentCounts.notificationCount ||
      updated.messageCount !== currentCounts.messageCount
    ) {
      currentCounts = updated;
      notifyListeners();
    }
    return currentCounts;
  } catch (err) {
    return currentCounts;
  }
}

export function startUnreadCountPolling(userId) {
  if (!userId) return;
  activeUserId = userId;
  refreshUnreadCounts(userId);

  if (!pollingTimer) {
    // 3-second live sync matching Fortaa Web
    pollingTimer = setInterval(() => {
      if (activeUserId) {
        refreshUnreadCounts(activeUserId);
      }
    }, 3000);
  }
}

export function stopUnreadCountPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  activeUserId = null;
}

export function clearNotificationBadge(userId = activeUserId) {
  currentCounts = { ...currentCounts, notificationCount: 0 };
  notifyListeners();
  const uid = userId || activeUserId;
  if (uid) {
    markNotificationsSeenApi(uid).catch(() => {});
  }
}

export function clearMessageBadge(userId = activeUserId) {
  const uid = userId || activeUserId;
  if (uid) {
    refreshUnreadCounts(uid);
  }
}
