import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  fetchNotifications,
  markNotificationsRead,
  deleteNotification,
} from '../../services/notification.service';
import {
  acceptFollowRequest,
  rejectFollowRequest,
} from '../../services/follow.service';
import './NotificationDropdown.css';

export default function NotificationDropdown({
  isOpen,
  onClose,
  currentUserId,
  onNotificationCountChange,
}) {
  const effectiveUserId =
    currentUserId ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        return u.id || u._id || null;
      } catch {
        return null;
      }
    })();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionStates, setActionStates] = useState({}); // { [actorId]: 'accepted' | 'declined' }
  const dropdownRef = useRef(null);

  // Load real notifications when opened
  useEffect(() => {
    if (!isOpen || !effectiveUserId) return;

    let isMounted = true;
    setLoading(true);

    fetchNotifications(effectiveUserId)
      .then((data) => {
        if (!isMounted) return;
        setNotifications(data || []);
        const unread = (data || []).filter((n) => !n.is_read).length;
        onNotificationCountChange?.(unread);
      })
      .catch((err) => console.error('Notifications load error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveUserId, onNotificationCountChange]);

  // Click outside to close (supporting mouse and touch)
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Accept Follow Request
  const handleAccept = async (actorId, actorName) => {
    if (!actorId || !effectiveUserId) return;

    setActionStates((prev) => ({ ...prev, [actorId]: 'accepted' }));
    toast.success(`You accepted ${actorName || 'user'}'s follow request!`);

    try {
      const res = await acceptFollowRequest(actorId, effectiveUserId);
      if (res.success) {
        // Update local notification status
        setNotifications((prev) =>
          prev.map((n) =>
            n.actor_id === actorId ? { ...n, is_read: true, follow_status: 'accepted' } : n
          )
        );
        onNotificationCountChange?.(Math.max(0, notifications.filter((n) => !n.is_read).length - 1));
      } else {
        toast.error(res.message || 'Failed to accept request');
        setActionStates((prev) => {
          const next = { ...prev };
          delete next[actorId];
          return next;
        });
      }
    } catch (err) {
      console.error('Accept error:', err);
      toast.error('Network error accepting request');
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[actorId];
        return next;
      });
    }
  };

  // Handle Decline Follow Request
  const handleDecline = async (actorId, actorName) => {
    if (!actorId || !effectiveUserId) return;

    setActionStates((prev) => ({ ...prev, [actorId]: 'declined' }));
    toast('Follow request declined', { icon: 'ℹ️' });

    try {
      const res = await rejectFollowRequest(actorId, effectiveUserId);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => !(n.actor_id === actorId && n.type === 'follow_request')));
        onNotificationCountChange?.(Math.max(0, notifications.filter((n) => !n.is_read).length - 1));
      } else {
        setActionStates((prev) => {
          const next = { ...prev };
          delete next[actorId];
          return next;
        });
      }
    } catch (err) {
      console.error('Decline error:', err);
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[actorId];
        return next;
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!effectiveUserId) return;
    try {
      await markNotificationsRead(effectiveUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onNotificationCountChange?.(0);
      toast.success('All marked as read');
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Format relative time helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isOpen) return null;

  const unreadTotal = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef} role="dialog" aria-label="Notifications list">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-title-wrap">
          <h3 className="notif-title">Notifications</h3>
          {unreadTotal > 0 && <span className="notif-pill-count">{unreadTotal}</span>}
        </div>
        <div className="notif-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadTotal > 0 && (
            <button
              type="button"
              className="notif-mark-read-btn"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="notif-header-close-btn"
            onClick={onClose}
            title="Close notifications"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="notif-list-body">
        {loading ? (
          <div className="notif-empty-state">
            <div className="notif-empty-desc">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty-state">
            <span className="notif-empty-icon">🔔</span>
            <h4 className="notif-empty-title">No new notifications</h4>
            <p className="notif-empty-desc">When leaders connect or follow you, updates will appear here.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isFollowRequest = item.type === 'follow_request';
            const actionState = actionStates[item.actor_id] || (item.follow_status === 'accepted' ? 'accepted' : null);

            return (
              <div
                key={item.id}
                className={`notif-item ${!item.is_read ? 'unread' : ''}`}
              >
                {/* Avatar */}
                <div className="notif-avatar-wrap">
                  {item.actor_avatar ? (
                    <img
                      src={item.actor_avatar}
                      alt={item.actor_name || 'User'}
                      className="notif-avatar-img"
                    />
                  ) : (
                    <div className="notif-avatar-initials">
                      {(item.actor_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="notif-type-icon-badge">
                    {isFollowRequest ? '👥' : '✨'}
                  </span>
                </div>

                {/* Content */}
                <div className="notif-content-wrap">
                  <p className="notif-message-text">
                    <span className="notif-actor-name">{item.actor_name || 'A Leader'}</span>{' '}
                    {isFollowRequest ? 'sent you a follow request.' : item.message || 'interacted with your profile.'}
                  </p>

                  <div className="notif-meta-sub">
                    {item.actor_role || 'Business Leader'} • {item.actor_company || 'Fortaa'}
                  </div>

                  {/* Follow Request Action Buttons */}
                  {isFollowRequest && (
                    <div className="notif-actions-row">
                      {actionState === 'accepted' ? (
                        <span className="notif-badge-accepted">✓ Following</span>
                      ) : actionState === 'declined' ? (
                        <span className="notif-badge-declined">Declined</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="notif-btn-accept"
                            onClick={() => handleAccept(item.actor_id, item.actor_name)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="notif-btn-decline"
                            onClick={() => handleDecline(item.actor_id, item.actor_name)}
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <span className="notif-time-ago">{formatTimeAgo(item.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
