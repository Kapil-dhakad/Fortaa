import { io } from 'socket.io-client';

let socket = null;

// Determine socket server URL (port 3000 where backend lives)
const SOCKET_URL = window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin;

/**
 * Initialize or get singleton socket instance
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to chat server:', socket.id);
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
  const s = getSocket();
  if (userId) {
    s.emit('join', { userId: String(userId) });
  }
}

/**
 * Send real-time message via Socket.IO
 */
export function emitSendMessage({ senderId, receiverId, text }) {
  const s = getSocket();
  s.emit('send_message', { senderId, receiverId, text });
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
 * Disconnect socket cleanly
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
