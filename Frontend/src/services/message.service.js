const BACKEND_BASE = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_BASE}/api/messages`;

/**
 * Fetch all conversations / contacts for user
 */
export async function fetchConversations(userId) {
  try {
    const res = await fetch(`${API_BASE}/conversations/${userId}`);
    const data = await res.json();
    if (!data.success) return [];
    const list = data.conversations || [];
    list.suggestions = data.suggestions || [];
    return list;
  } catch (err) {
    console.error('fetchConversations error:', err);
    return [];
  }
}

/**
 * Fetch chat message history between two users
 */
export async function fetchChatHistory(userId, otherUserId) {
  try {
    const res = await fetch(`${API_BASE}/history/${userId}/${otherUserId}`);
    const data = await res.json();
    return data.success ? data.messages : [];
  } catch (err) {
    console.error('fetchChatHistory error:', err);
    return [];
  }
}

/**
 * Send message via HTTP fallback
 */
export async function sendChatMessageHttp({ senderId, receiverId, text, attachment }) {
  try {
    const res = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text, attachment }),
    });
    const data = await res.json();
    return data.success ? data.message : null;
  } catch (err) {
    console.error('sendChatMessageHttp error:', err);
    return null;
  }
}

/**
 * Fetch total unread incoming messages count for user
 */
export async function fetchUnreadMessageCount(userId) {
  try {
    if (!userId) return 0;
    const res = await fetch(`${API_BASE}/unread-count/${userId}`);
    const data = await res.json();
    return data.success ? (data.count || 0) : 0;
  } catch (err) {
    console.error('fetchUnreadMessageCount error:', err);
    return 0;
  }
}

/**
 * Delete message via HTTP fallback (deleteForEveryone OR deleteForMe)
 */
export async function deleteChatMessageHttp(messageId, userId, deleteForEveryone = false) {
  try {
    if (!messageId) return false;
    const res = await fetch(`${API_BASE}/delete/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deleteForEveryone }),
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('deleteChatMessageHttp error:', err);
    return false;
  }
}

/**
 * Clear chat history for user
 */
export async function clearChatApi(userId, targetId) {
  try {
    const res = await fetch(`${API_BASE}/clear/${userId}/${targetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    console.error('clearChatApi error:', err);
    return { success: false, message: 'Failed to clear chat' };
  }
}

/**
 * Toggle block status
 */
export async function toggleBlockUserApi(blockerId, blockedId) {
  try {
    const res = await fetch(`${API_BASE}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId, blockedId }),
    });
    return await res.json();
  } catch (err) {
    console.error('toggleBlockUserApi error:', err);
    return { success: false, message: 'Failed to toggle block' };
  }
}

/**
 * Fetch block status
 */
export async function fetchBlockStatusApi(userId, otherUserId) {
  try {
    const res = await fetch(`${API_BASE}/block-status/${userId}/${otherUserId}`);
    return await res.json();
  } catch (err) {
    console.error('fetchBlockStatusApi error:', err);
    return { success: false, isBlocked: false };
  }
}

/**
 * Report chat / user
 */
export async function reportChatApi({ reporterId, reportedId, groupId, reason }) {
  try {
    const res = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId, reportedId, groupId, reason }),
    });
    return await res.json();
  } catch (err) {
    console.error('reportChatApi error:', err);
    return { success: false, message: 'Failed to report chat' };
  }
}

