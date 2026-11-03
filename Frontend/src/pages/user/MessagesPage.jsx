import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getSocket,
  joinChat,
  emitSendMessage,
  subscribeToNewMessages,
  subscribeToSentMessage,
  subscribeToOnlineUsers,
  emitTyping,
  emitStopTyping,
  subscribeToTyping,
  subscribeToStopTyping,
  emitMarkRead,
} from '../../services/socket.service';
import {
  fetchConversations,
  fetchChatHistory,
  sendChatMessageHttp,
} from '../../services/message.service';
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import userAvatarDefault from '../../assets/dashboard/user_avatar_rahul.png';
import './MessagesPage.css';

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectUserId = searchParams.get('userId');

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fortaa_user') || '{}');
    } catch {
      return {};
    }
  });

  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUserId = currentUser.id || currentUser._id;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 1. Initial Setup: Socket Connection & Fetch Conversations
  useEffect(() => {
    if (!currentUserId) {
      toast.error('Please log in to use messages');
      navigate('/login');
      return;
    }

    // Connect & Join Socket.io room
    getSocket();
    joinChat(currentUserId);

    // Subscribe to online users
    const unsubOnline = subscribeToOnlineUsers((onlineList) => {
      setOnlineUserIds(onlineList.map(String));
    });

    // Load conversations from backend
    async function loadContacts() {
      setLoadingConv(true);
      const data = await fetchConversations(currentUserId);
      setConversations(data);
      setLoadingConv(false);

      // If URL has ?userId=X, preselect that user or find in list
      if (preselectUserId) {
        const found = data.find((c) => String(c.user_id) === String(preselectUserId));
        if (found) {
          setSelectedContact(found);
        } else {
          // Placeholder for direct message
          setSelectedContact({
            user_id: Number(preselectUserId),
            name: `Partner #${preselectUserId}`,
            designation: 'Business Leader',
            company_brand: 'Fortaa Network',
          });
        }
      } else if (data.length > 0 && window.innerWidth > 768) {
        // Select first contact on desktop
        setSelectedContact(data[0]);
      }
    }

    loadContacts();

    return () => {
      unsubOnline();
    };
  }, [currentUserId, navigate, preselectUserId]);

  // 2. Fetch Chat History when active contact changes
  useEffect(() => {
    if (!selectedContact || !currentUserId) return;

    let isMounted = true;
    async function loadHistory() {
      setLoadingHistory(true);
      const history = await fetchChatHistory(currentUserId, selectedContact.user_id);
      if (isMounted) {
        setMessages(history);
        setLoadingHistory(false);
        // Mark as read via socket
        emitMarkRead({ senderId: selectedContact.user_id, receiverId: currentUserId });

        // Clear unread badge in list
        setConversations((prev) =>
          prev.map((c) =>
            c.user_id === selectedContact.user_id ? { ...c, unread_count: 0 } : c
          )
        );
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedContact, currentUserId]);

  // 3. Socket event listeners for incoming real-time messages & typing
  useEffect(() => {
    // Listen for new messages
    const unsubNewMsg = subscribeToNewMessages((newMsg) => {
      // Check if belongs to current open conversation
      if (
        selectedContact &&
        (String(newMsg.sender_id) === String(selectedContact.user_id) ||
          String(newMsg.receiver_id) === String(selectedContact.user_id))
      ) {
        setMessages((prev) => [...prev, newMsg]);
        emitMarkRead({ senderId: selectedContact.user_id, receiverId: currentUserId });
      } else {
        // Notify user about incoming message from another contact
        toast(`New message received`, { icon: '💬' });
      }

      // Update conversations list with latest text snippet
      setConversations((prev) => {
        const partnerId =
          String(newMsg.sender_id) === String(currentUserId)
            ? newMsg.receiver_id
            : newMsg.sender_id;

        const exists = prev.find((c) => c.user_id === partnerId);
        if (exists) {
          return prev.map((c) =>
            c.user_id === partnerId
              ? {
                  ...c,
                  last_message_text: newMsg.text,
                  last_message_time: newMsg.created_at,
                  unread_count:
                    selectedContact?.user_id === partnerId
                      ? 0
                      : (Number(c.unread_count) || 0) + 1,
                }
              : c
          );
        }
        return prev;
      });
    });

    // Listen for sent message confirmation from server
    const unsubSent = subscribeToSentMessage((confirmedMsg) => {
      setMessages((prev) => {
        // Avoid duplicate if optimistic was added
        const withoutTemp = prev.filter((m) => !m.is_optimistic || m.text !== confirmedMsg.text);
        return [...withoutTemp, confirmedMsg];
      });
    });

    // Listen for typing events
    const unsubTyping = subscribeToTyping(({ senderId }) => {
      if (selectedContact && String(senderId) === String(selectedContact.user_id)) {
        setIsTyping(true);
      }
    });

    const unsubStopTyping = subscribeToStopTyping(({ senderId }) => {
      if (selectedContact && String(senderId) === String(selectedContact.user_id)) {
        setIsTyping(false);
      }
    });

    return () => {
      unsubNewMsg();
      unsubSent();
      unsubTyping();
      unsubStopTyping();
    };
  }, [selectedContact, currentUserId]);

  // 4. Send Message Handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedContact || !currentUserId) return;

    setInputText('');
    emitStopTyping({ senderId: currentUserId, receiverId: selectedContact.user_id });

    // Optimistic UI addition
    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      sender_id: Number(currentUserId),
      receiver_id: Number(selectedContact.user_id),
      text: text,
      is_read: false,
      is_optimistic: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via Socket.io
    emitSendMessage({
      senderId: currentUserId,
      receiverId: selectedContact.user_id,
      text: text,
    });

    // Also fallback via HTTP to guarantee persistence
    sendChatMessageHttp({
      senderId: currentUserId,
      receiverId: selectedContact.user_id,
      text: text,
    });

    // Update conversation snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.user_id === selectedContact.user_id
          ? { ...c, last_message_text: text, last_message_time: new Date().toISOString() }
          : c
      )
    );
  };

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!selectedContact) return;

    emitTyping({ senderId: currentUserId, receiverId: selectedContact.user_id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping({ senderId: currentUserId, receiverId: selectedContact.user_id });
    }, 1500);
  };

  // Filter conversations
  const filteredContacts = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="msg-page-wrapper">
      {/* ── Top Header ── */}
      <header className="msg-topbar">
        <div className="msg-topbar-left">
          <Link to="/" className="msg-brand-logo">
            <img src={logoIconImg} alt="Fortaa" className="msg-logo-icon" />
            <div className="msg-logo-text-wrap">
              <img src={logoTextImg} alt="FORTAA" className="msg-logo-word" />
              <span className="msg-logo-tagline">Discover, easy and Grow</span>
            </div>
          </Link>
        </div>

        <div className="msg-topbar-center">
          <span className="msg-page-title">💬 Messages &amp; Team Chat</span>
        </div>

        <div className="msg-topbar-right">
          <button className="msg-btn-back-dashboard" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* ── Main Chat Area ── */}
      <div className="msg-main-layout">
        {/* Left Pane: Contacts & Conversations */}
        <aside className={`msg-sidebar-pane ${selectedContact ? 'has-selected' : ''}`}>
          <div className="msg-sidebar-header">
            <h3>Chats</h3>
            <span className="msg-total-badge">{conversations.length}</span>
          </div>

          <div className="msg-search-box">
            <span className="msg-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search leaders &amp; teammates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="msg-contacts-list">
            {loadingConv ? (
              <div className="msg-loading-contacts">
                <div className="msg-spinner-sm" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="msg-empty-contacts">
                <span>👥 No conversations found</span>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isOnline = onlineUserIds.includes(String(contact.user_id));
                const isSelected = selectedContact?.user_id === contact.user_id;

                return (
                  <div
                    key={contact.user_id}
                    className={`msg-contact-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="msg-avatar-container">
                      <img
                        src={contact.avatar_url || userAvatarDefault}
                        alt={contact.name}
                        className="msg-contact-avatar"
                      />
                      {isOnline && <span className="msg-online-dot" title="Online now" />}
                    </div>

                    <div className="msg-contact-info">
                      <div className="msg-contact-name-row">
                        <span className="msg-contact-name">{contact.name}</span>
                        {contact.last_message_time && (
                          <span className="msg-contact-time">
                            {new Date(contact.last_message_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="msg-contact-sub-row">
                        <span className="msg-contact-preview">
                          {contact.last_message_text || contact.designation || 'Click to start chat'}
                        </span>
                        {Number(contact.unread_count) > 0 && (
                          <span className="msg-unread-pill">{contact.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Active Chat Window */}
        <main className={`msg-chat-pane ${!selectedContact ? 'no-selection' : ''}`}>
          {selectedContact ? (
            <div className="msg-chat-active-container">
              {/* Active Chat Header */}
              <div className="msg-chat-header">
                <button
                  className="msg-btn-mobile-back"
                  onClick={() => setSelectedContact(null)}
                >
                  ←
                </button>
                <div className="msg-chat-header-avatar-wrap">
                  <img
                    src={selectedContact.avatar_url || userAvatarDefault}
                    alt={selectedContact.name}
                    className="msg-chat-header-avatar"
                  />
                  {onlineUserIds.includes(String(selectedContact.user_id)) && (
                    <span className="msg-online-dot" />
                  )}
                </div>

                <div className="msg-chat-header-info">
                  <h4 className="msg-chat-header-name">{selectedContact.name}</h4>
                  <div className="msg-chat-header-status">
                    {onlineUserIds.includes(String(selectedContact.user_id)) ? (
                      <span className="msg-status-online">● Online</span>
                    ) : (
                      <span className="msg-status-offline">Offline</span>
                    )}
                    <span className="msg-status-role">
                      • {selectedContact.designation || 'Leader'}
                    </span>
                  </div>
                </div>

                <div className="msg-chat-header-actions">
                  <button
                    className="msg-header-action-btn"
                    title="View Profile"
                    onClick={() => navigate('/profile')}
                  >
                    👤
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="msg-body-messages">
                {loadingHistory ? (
                  <div className="msg-loading-history">
                    <div className="msg-spinner" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="msg-empty-history">
                    <span className="msg-wave-icon">👋</span>
                    <h4>Say hello to {selectedContact.name}!</h4>
                    <p>Start a conversation to collaborate, network, and grow together.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.sender_id) === Number(currentUserId);
                    return (
                      <div
                        key={msg.id || idx}
                        className={`msg-bubble-row ${isMe ? 'msg-sent' : 'msg-received'}`}
                      >
                        {!isMe && (
                          <img
                            src={selectedContact.avatar_url || userAvatarDefault}
                            alt=""
                            className="msg-bubble-avatar"
                          />
                        )}
                        <div className="msg-bubble-content">
                          <p className="msg-bubble-text">{msg.text}</p>
                          <div className="msg-bubble-meta">
                            <span className="msg-bubble-time">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </span>
                            {isMe && (
                              <span className="msg-bubble-ticks">
                                {msg.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="msg-bubble-row msg-received">
                    <img
                      src={selectedContact.avatar_url || userAvatarDefault}
                      alt=""
                      className="msg-bubble-avatar"
                    />
                    <div className="msg-bubble-content msg-typing-bubble">
                      <div className="msg-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form className="msg-input-bar" onSubmit={handleSendMessage}>
                <button
                  type="button"
                  className="msg-tool-btn"
                  title="Emoji"
                  onClick={() => setInputText((prev) => prev + ' 😊')}
                >
                  😊
                </button>
                <input
                  type="text"
                  className="msg-text-input"
                  placeholder={`Message ${selectedContact.name}...`}
                  value={inputText}
                  onChange={handleInputChange}
                  autoFocus
                />
                <button
                  type="submit"
                  className="msg-send-btn"
                  disabled={!inputText.trim()}
                  title="Send message"
                >
                  <span>Send</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div className="msg-no-contact-selected">
              <div className="msg-placeholder-icon">💬</div>
              <h3>Select a Leader or Teammate</h3>
              <p>Choose any conversation from the left to start messaging in real-time.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
