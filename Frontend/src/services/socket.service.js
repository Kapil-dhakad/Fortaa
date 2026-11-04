import { io } from 'socket.io-client';

let socket = null;
let currentChatUserId = null;

// Determine socket server URL (supports production environment variables or defaults)
const SOCKET_URL =
  import.meta.env?.VITE_SOCKET_URL ||
  import.meta.env?.VITE_BACKEND_URL ||
  (window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin);

function getStoredUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
    return u?.id || u?._id || null;
  } catch {
    return null;
  }
}

/**
 * Initialize or get singleton socket instance
 */
export function getSocket() {
  if (!socket) {
    const initialUid = currentChatUserId || getStoredUserId();

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      query: initialUid ? { userId: String(initialUid) } : {},
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to chat server:', socket.id);
      const uid = currentChatUserId || getStoredUserId();
      if (uid) {
        socket.emit('join', { userId: String(uid) });
      }
      socket.emit('get_online_users');
    });

    socket.on('reconnect', (attempt) => {
      console.log(`⚡ [Socket.IO] Reconnected (attempt ${attempt}):`, socket.id);
      const uid = currentChatUserId || getStoredUserId();
      if (uid) {
        socket.emit('join', { userId: String(uid) });
      }
      socket.emit('get_online_users');
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO] Connection error:', err.message);
    });
  }
  return socket;
}

/**
 * Join socket with user's ID
 */
export function joinChat(userId) {
  if (userId) {
    currentChatUserId = String(userId);
  }
  const uid = currentChatUserId || getStoredUserId();
  const s = getSocket();
  if (uid && s) {
    if (s.io && s.io.opts) {
      s.io.opts.query = { userId: String(uid) };
    }
    if (s.connected) {
      s.emit('join', { userId: String(uid) });
      s.emit('get_online_users');
    }
  }
}

/**
 * Send real-time message via Socket.IO
 */
export function emitSendMessage({ senderId, receiverId, text, attachment }) {
  const s = getSocket();
  s.emit('send_message', { senderId, receiverId, text, attachment });
}

/**
 * Listen for incoming messages
 */
export function subscribeToNewMessages(callback) {
  const s = getSocket();
  s.on('new_message', callback);
  return () => s.off('new_message', callback);
}

/**
 * Listen for message delivery confirmation
 */
export function subscribeToSentMessage(callback) {
  const s = getSocket();
  s.on('message_sent', callback);
  return () => s.off('message_sent', callback);
}

/**
 * Listen for active online users list
 */
export function subscribeToOnlineUsers(callback) {
  const s = getSocket();
  s.on('online_users', callback);
  s.emit('get_online_users');
  return () => s.off('online_users', callback);
}

/**
 * Typing notification helpers
 */
export function emitTyping({ senderId, receiverId }) {
  const s = getSocket();
  s.emit('typing', { senderId, receiverId });
}

export function emitStopTyping({ senderId, receiverId }) {
  const s = getSocket();
  s.emit('stop_typing', { senderId, receiverId });
}

export function subscribeToTyping(callback) {
  const s = getSocket();
  s.on('user_typing', callback);
  return () => s.off('user_typing', callback);
}

export function subscribeToStopTyping(callback) {
  const s = getSocket();
  s.on('user_stop_typing', callback);
  return () => s.off('user_stop_typing', callback);
}

/**
 * Mark messages as read
 */
export function emitMarkRead({ senderId, receiverId }) {
  const s = getSocket();
  s.emit('mark_read', { senderId, receiverId });
}

export function subscribeToMessagesRead(callback) {
  const s = getSocket();
  s.on('messages_read', callback);
  return () => s.off('messages_read', callback);
}

/**
 * Subscribe to real-time follow events (accept, request received, update)
 */
export function subscribeToFollowEvents({ onFollowAccepted, onFollowRequestReceived, onFollowUpdated }) {
  const s = getSocket();

  if (onFollowAccepted) s.on('follow_accepted', onFollowAccepted);
  if (onFollowRequestReceived) s.on('follow_request_received', onFollowRequestReceived);
  if (onFollowUpdated) s.on('follow_updated', onFollowUpdated);

  return () => {
    if (onFollowAccepted) s.off('follow_accepted', onFollowAccepted);
    if (onFollowRequestReceived) s.off('follow_request_received', onFollowRequestReceived);
    if (onFollowUpdated) s.off('follow_updated', onFollowUpdated);
  };
}

/**
 * Disconnect socket cleanly
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
