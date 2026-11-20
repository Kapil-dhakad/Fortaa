import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMail,
  FiPhone,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiAlertCircle,
  FiCornerDownRight,
  FiCheck,
} from 'react-icons/fi';
import {
  fetchSupportQueries,
  replySupportQuery,
  markSupportQueryRead,
} from '../../services/support.service';
import './AdminSupportChatModal.css';

const QUICK_REPLIES = [
  'Thank you for reaching out! Our team is looking into this.',
  'Your request has been processed successfully. Please refresh your page.',
  'Could you please provide more details or a screenshot of the issue?',
  'This issue has been resolved. Let us know if you need any further help!',
];

export default function AdminSupportChatModal({ isOpen, onClose, onUpdated }) {
  const [queries, setQueries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, New, In Progress, Resolved
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSupportQueries();
      if (res.success && Array.isArray(res.queries)) {
        setQueries(res.queries);
        if (res.queries.length > 0 && !selectedId) {
          setSelectedId(res.queries[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load support queries');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (isOpen) {
      loadQueries();
    }
  }, [isOpen, loadQueries]);

  // Selected query object
  const selectedQuery = useMemo(() => {
    return queries.find((q) => q.id === selectedId) || null;
  }, [queries, selectedId]);

  // When a query is selected, mark as read if not already read
  const handleSelectQuery = async (query) => {
    setSelectedId(query.id);
    if (!query.is_read) {
      try {
        await markSupportQueryRead(query.id);
        setQueries((prev) =>
          prev.map((q) => (q.id === query.id ? { ...q, is_read: true } : q))
        );
        onUpdated?.();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter queries based on search and status
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchesSearch =
        !searchTerm.trim() ||
        q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.message?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Unread' && !q.is_read) ||
        q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queries, searchTerm, statusFilter]);

  // Handle Admin reply
  const handleSendReply = async (newStatus = 'Resolved') => {
    if (!selectedQuery) return;
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setSendingReply(true);
    try {
      const res = await replySupportQuery(selectedQuery.id, replyText.trim(), newStatus);
      if (res.success) {
        toast.success(`Reply sent and query marked as ${newStatus}! 🎉`);
        setReplyText('');
        // Update local state
        setQueries((prev) =>
          prev.map((q) =>
            q.id === selectedQuery.id
              ? { ...q, admin_reply: replyText.trim(), status: newStatus, is_read: true }
              : q
          )
        );
        onUpdated?.();
      } else {
        toast.error(res.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!selectedQuery) return;
    try {
      const res = await replySupportQuery(
        selectedQuery.id,
        selectedQuery.admin_reply || 'Status updated by Admin',
        newStatus
      );
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        setQueries((prev) =>
          prev.map((q) =>
            q.id === selectedQuery.id ? { ...q, status: newStatus } : q
          )
        );
        onUpdated?.();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  if (!isOpen) return null;

  const unreadCount = queries.filter((q) => !q.is_read).length;

  return (
    <div className="adm-chat-overlay" onClick={onClose}>
      <div className="adm-chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="adm-chat-header">
          <div className="adm-chat-header-title-wrap">
            <div className="adm-chat-header-icon-badge">
              <FiMessageSquare size={20} color="#FFFFFF" />
            </div>
            <div>
              <div className="adm-chat-title-row">
                <h3 className="adm-chat-title">User Support & Messages Desk</h3>
                {unreadCount > 0 && (
                  <span className="adm-chat-unread-pill">
                    {unreadCount} New {unreadCount === 1 ? 'Message' : 'Messages'}
                  </span>
                )}
              </div>
              <p className="adm-chat-subtitle">
                Queries submitted by users from the User Dashboard & Mobile App
              </p>
            </div>
          </div>

          <div className="adm-chat-header-actions">
            <button
              type="button"
              className="adm-chat-refresh-btn"
              onClick={loadQueries}
              title="Refresh Queries"
              disabled={loading}
            >
              <FiRefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="adm-chat-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Content (Split View) */}
        <div className="adm-chat-body">
          {/* Left Column: Query Inquiries List */}
          <div className="adm-chat-sidebar">
            {/* Search & Filters */}
            <div className="adm-chat-filter-box">
              <div className="adm-chat-search-wrap">
                <FiSearch size={15} className="adm-chat-search-icon" />
                <input
                  type="text"
                  className="adm-chat-search-input"
                  placeholder="Search queries or user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="adm-chat-pill-tabs">
                {['ALL', 'Unread', 'New', 'In Progress', 'Resolved'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`adm-chat-pill-tab ${statusFilter === tab ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="adm-chat-list">
              {loading && queries.length === 0 ? (
                <div className="adm-chat-list-empty">Loading user queries...</div>
              ) : filteredQueries.length === 0 ? (
                <div className="adm-chat-list-empty">
                  <FiAlertCircle size={32} color="#94A3B8" />
                  <p>No queries found matching filter.</p>
                </div>
              ) : (
                filteredQueries.map((item) => {
                  const isSelected = item.id === selectedId;
                  const isUnread = !item.is_read;
                  return (
                    <div
                      key={item.id}
                      className={`adm-chat-item ${isSelected ? 'is-selected' : ''} ${
                        isUnread ? 'is-unread' : ''
                      }`}
                      onClick={() => handleSelectQuery(item)}
                    >
                      <div className="adm-chat-item-top">
                        <div className="adm-chat-item-user">
                          <span className="adm-chat-avatar-circle">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                          <span className="adm-chat-user-name">{item.name || 'User'}</span>
                        </div>
                        <span
                          className={`adm-chat-status-badge status-${(
                            item.status || 'New'
                          ).toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item.status || 'New'}
                        </span>
                      </div>

                      <div className="adm-chat-item-subject">
                        <span className="adm-chat-subject-tag">{item.subject}</span>
                      </div>

                      <p className="adm-chat-item-snippet">{item.message}</p>

                      <div className="adm-chat-item-footer">
                        <span className="adm-chat-item-time">
                          <FiClock size={11} style={{ marginRight: 4 }} />
                          {new Date(item.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isUnread && <span className="adm-chat-unread-dot" title="Unread" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Query Detail & Reply Panel */}
          <div className="adm-chat-detail">
            {selectedQuery ? (
              <div className="adm-chat-detail-content">
                {/* User Meta Card Header */}
                <div className="adm-chat-user-header">
                  <div className="adm-chat-user-info-left">
                    <div className="adm-chat-big-avatar">
                      {selectedQuery.name ? selectedQuery.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="adm-chat-detail-name">{selectedQuery.name}</h4>
                      <div className="adm-chat-detail-meta-row">
                        <span className="adm-chat-meta-pill">
                          <FiMail size={12} />
                          <a href={`mailto:${selectedQuery.email}`}>{selectedQuery.email}</a>
                        </span>
                        {selectedQuery.phone && (
                          <span className="adm-chat-meta-pill">
                            <FiPhone size={12} />
                            <a href={`tel:${selectedQuery.phone}`}>{selectedQuery.phone}</a>
                          </span>
                        )}
                        <span className="adm-chat-meta-pill date-pill">
                          <FiClock size={12} />
                          {new Date(selectedQuery.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Dropdown */}
                  <div className="adm-chat-user-actions-right">
                    <span className="adm-chat-status-label">Status:</span>
                    <select
                      className="adm-chat-status-select"
                      value={selectedQuery.status || 'New'}
                      onChange={(e) => handleQuickStatusChange(e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Conversation Thread / Message View */}
                <div className="adm-chat-messages-area">
                  {/* Topic badge */}
                  <div className="adm-chat-topic-banner">
                    <span className="adm-chat-topic-label">Query Topic:</span>
                    <span className="adm-chat-topic-value">{selectedQuery.subject}</span>
                  </div>

                  {/* User Query Bubble */}
                  <div className="adm-chat-bubble-row user-bubble-row">
                    <div className="adm-chat-bubble-avatar">
                      {selectedQuery.name ? selectedQuery.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="adm-chat-bubble user-bubble">
                      <div className="adm-chat-bubble-sender">
                        <span>{selectedQuery.name}</span>
                        <span className="adm-chat-bubble-time">
                          {new Date(selectedQuery.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="adm-chat-bubble-text">{selectedQuery.message}</p>
                    </div>
                  </div>

                  {/* Admin Reply Bubble (if exists) */}
                  {selectedQuery.admin_reply && (
                    <div className="adm-chat-bubble-row admin-bubble-row">
                      <div className="adm-chat-bubble admin-bubble">
                        <div className="adm-chat-bubble-sender">
                          <span>Admin Support Desk</span>
                          <span className="adm-chat-badge-resolved">
                            <FiCheck size={11} /> {selectedQuery.status}
                          </span>
                        </div>
                        <p className="adm-chat-bubble-text">{selectedQuery.admin_reply}</p>
                      </div>
                      <div className="adm-chat-bubble-avatar admin-avatar">🛡️</div>
                    </div>
                  )}
                </div>

                {/* Quick Reply Presets */}
                <div className="adm-chat-quick-replies">
                  <span className="adm-chat-qr-label">Quick Responses:</span>
                  <div className="adm-chat-qr-chips">
                    {QUICK_REPLIES.map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="adm-chat-qr-chip"
                        onClick={() => setReplyText(text)}
                      >
                        {text.length > 40 ? `${text.slice(0, 40)}...` : text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Input Box */}
                <div className="adm-chat-reply-box">
                  <textarea
                    className="adm-chat-textarea"
                    placeholder={`Write a reply to ${selectedQuery.name}...`}
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="adm-chat-reply-actions">
                    <div className="adm-chat-reply-left">
                      <button
                        type="button"
                        className="adm-chat-btn-secondary"
                        onClick={() => handleSendReply('In Progress')}
                        disabled={sendingReply || !replyText.trim()}
                      >
                        <FiCornerDownRight size={14} />
                        <span>Send as In Progress</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="adm-chat-btn-primary"
                      onClick={() => handleSendReply('Resolved')}
                      disabled={sendingReply || !replyText.trim()}
                    >
                      <FiSend size={14} />
                      <span>{sendingReply ? 'Sending...' : 'Send Reply & Resolve'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="adm-chat-detail-empty">
                <FiMessageSquare size={48} color="#CBD5E1" />
                <h4 className="adm-chat-empty-title">No Query Selected</h4>
                <p className="adm-chat-empty-desc">
                  Select a user query from the left list to view their full message and respond.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
