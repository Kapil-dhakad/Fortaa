const API_BASE = '/api/messages';

/**
 * Fetch all conversations / contacts for user
 */
export async function fetchConversations(userId) {
  try {
    const res = await fetch(`${API_BASE}/conversations/${userId}`);
    const data = await res.json();
    return data.success ? data.conversations : [];
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
export async function sendChatMessageHttp({ senderId, receiverId, text }) {
  try {
    const res = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text }),
    });
    const data = await res.json();
    return data.success ? data.message : null;
  } catch (err) {
    console.error('sendChatMessageHttp error:', err);
    return null;
  }
}
