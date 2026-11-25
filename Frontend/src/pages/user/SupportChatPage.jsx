import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiSend,
  FiHeadphones,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiArrowLeft,
  FiRefreshCw,
  FiHelpCircle,
} from 'react-icons/fi';

import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import {
  fetchUserSupportMessages,
  submitSupportQuery,
} from '../../services/support.service';
import { getSocket } from '../../services/socket.service';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import './SupportChatPage.css';

const QUICK_PROMPTS = [
  '👋 Need help with my Account & Verification',
  '🏢 Inquiry about Company Listing & Products',
  '💰 Rewards, Earnings & Opportunity query',
  '🐞 Report a technical issue or bug',
  '📞 Please connect me with a support representative',
];

export default function SupportChatPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Authenticated user details
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  const userId = storedUser.id || storedUser._id || null;
  const userName = storedUser.name || 'Fortaa User';
  const userEmail = storedUser.email || '';
  const userPhone = storedUser.mobile_number || storedUser.phone || '';
  const userAvatar = storedUser.avatarUrl || userAvatarImg;

  // Scroll smoothly to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Fetch messages for this user
  const loadMessages = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const msgs = await fetchUserSupportMessages(userId, userEmail);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [userId, userEmail]);

  // Initial load + Real-time socket and polling fallback
  useEffect(() => {
    loadMessages(true);

    // Socket.io for live admin replies
    const socket = getSocket();
    if (socket) {
      socket.on('support_reply', (updatedQuery) => {
        if (
          (updatedQuery.user_id && updatedQuery.user_id === userId) ||
          (updatedQuery.email && updatedQuery.email.toLowerCase() === userEmail.toLowerCase())
        ) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === updatedQuery.id);
            if (exists) {
              return prev.map((m) => (m.id === updatedQuery.id ? updatedQuery : m));
            }
            return [...prev, updatedQuery];
          });
          toast('💬 New reply received from Fortaa Support Desk!', {
            icon: '🛡️',
          });
        }
      });
    }

    // Passive polling fallback (Socket.IO handles real-time instant reply)
    const interval = setInterval(() => {
      loadMessages(false);
    }, 15000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('support_reply');
      }
    };
  }, [loadMessages, userEmail, userId]);

  // Auto scroll to bottom when messages load or change
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    // Optimistic message placeholder
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      user_id: userId,
      name: userName,
      email: userEmail,
      phone: userPhone,
      subject: 'Live Support Chat',
      message: text,
      status: 'New',
      admin_reply: null,
      created_at: new Date().toISOString(),
      is_optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const res = await submitSupportQuery({
        name: userName,
        email: userEmail,
        phone: userPhone,
        userId: userId,
        subject: 'Live Support Chat',
        message: text,
      });

      if (res.success && res.query) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.query : m))
        );
      } else {
        toast.error('Failed to send message. Please retry.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to support desk. Please try again.');
    } finally {
      setSending(false);
      scrollToBottom(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ud-dashboard-root sp-chat-page-root">
      {/* Header */}
      <UserHeader
        user={storedUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Wrapper */}
      <div className="ud-main-wrapper">
        {/* Left Sidebar */}
        <UserSidebar
          activeTab="Support"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Center Support Chat Area */}
        <main className="sp-chat-main-container">
          <div className="sp-chat-card">
            {/* Chat Room Top Bar */}
            <div className="sp-chat-header">
              <div className="sp-chat-header-left">
                <button
                  type="button"
                  className="sp-chat-back-btn"
                  onClick={() => navigate('/dashboard')}
                  title="Back to Dashboard"
                >
                  <FiArrowLeft size={18} />
                </button>

                <div className="sp-chat-agent-avatar-wrap">
                  <div className="sp-chat-agent-avatar">
                    <FiHeadphones size={22} color="#FFFFFF" />
                  </div>
                  <span className="sp-chat-status-indicator" title="Support Online" />
                </div>

                <div className="sp-chat-agent-info">
                  <div className="sp-chat-title-badge-row">
                    <h2 className="sp-chat-agent-name">Fortaa Support Desk</h2>
                    <span className="sp-chat-verified-badge">
                      <FiShield size={11} /> Verified
                    </span>
                  </div>
                  <p className="sp-chat-agent-status">
                    <span className="sp-status-dot" />
                    Online • Direct Assistance for Authenticated Members
                  </p>
                </div>
              </div>

              <div className="sp-chat-header-right">
                <button
                  type="button"
                  className="sp-chat-refresh-btn"
                  onClick={() => loadMessages(true)}
                  title="Refresh Conversation"
                  disabled={loading}
                >
                  <FiRefreshCw size={15} className={loading ? 'sp-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="sp-chat-body">
              {/* Date stamp */}
              <div className="sp-chat-date-divider">
                <span>Today</span>
              </div>

              {/* Bot Initial Welcome Greeting */}
              <div className="sp-chat-msg-row sp-msg-incoming">
                <div className="sp-chat-msg-avatar">
                  <FiHeadphones size={16} color="#FFFFFF" />
                </div>
                <div className="sp-chat-bubble sp-bubble-incoming">
                  <div className="sp-bubble-header">
                    <span className="sp-bubble-sender">Fortaa Support Team</span>
                    <span className="sp-bubble-bot-tag">24/7 Desk</span>
                  </div>
                  <p className="sp-bubble-text">
                    Hello <strong>{userName}</strong>! 👋 Welcome to Fortaa Live Support Desk.
                    <br />
                    Since you are already logged in, you can directly chat with our support team here without filling any forms. How can we help you today?
                  </p>
                </div>
              </div>

              {/* Chat Thread */}
              {loading && messages.length === 0 ? (
                <div className="sp-chat-loading-notice">
                  <FiRefreshCw size={20} className="sp-spin" />
                  <span>Loading support conversation...</span>
                </div>
              ) : (
                messages.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* User's Message */}
                    <div className="sp-chat-msg-row sp-msg-outgoing">
                      <div className="sp-chat-bubble sp-bubble-outgoing">
                        <p className="sp-bubble-text">{item.message}</p>
                        <div className="sp-bubble-footer">
                          <span className="sp-bubble-time">
                            <FiClock size={11} style={{ marginRight: 3 }} />
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="sp-bubble-status">
                            <FiCheck size={14} />
                          </span>
                        </div>
                      </div>
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="sp-chat-msg-user-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarImg;
                        }}
                      />
                    </div>

                    {/* Admin Reply (if present) */}
                    {item.admin_reply && (
                      <div className="sp-chat-msg-row sp-msg-incoming">
                        <div className="sp-chat-msg-avatar sp-admin-avatar">
                          🛡️
                        </div>
                        <div className="sp-chat-bubble sp-bubble-incoming sp-admin-reply-bubble">
                          <div className="sp-bubble-header">
                            <span className="sp-bubble-sender">Fortaa Support Team</span>
                            <span className="sp-bubble-status-pill status-resolved">
                              <FiCheckCircle size={11} /> {item.status || 'Resolved'}
                            </span>
                          </div>
                          <p className="sp-bubble-text">{item.admin_reply}</p>
                          <div className="sp-bubble-footer">
                            <span className="sp-bubble-time">
                              <FiClock size={11} style={{ marginRight: 3 }} />
                              Support Response
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="sp-chat-quick-chips">
              <span className="sp-chips-label">
                <FiHelpCircle size={13} /> Common Topics:
              </span>
              <div className="sp-chips-scroll">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="sp-quick-chip"
                    onClick={() => setInputText(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form className="sp-chat-input-bar" onSubmit={handleSendMessage}>
              <div className="sp-input-wrapper">
                <textarea
                  className="sp-chat-input"
                  placeholder="Type your message or query here..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
              </div>

              <button
                type="submit"
                className="sp-chat-send-btn"
                disabled={sending || !inputText.trim()}
                title="Send Message (Enter)"
                aria-label="Send Message"
              >
                {sending ? (
                  <FiRefreshCw size={17} className="sp-spin" />
                ) : (
                  <FiSend size={17} />
                )}
                <span className="sp-send-btn-label">Send</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Universal Mobile Bottom Navigation */}
      <UserMobileBottomNav
        active="Support"
        onPlusClick={() => navigate('/dashboard')}
      />
    </div>
  );
}
