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
    Number(currentUserId) ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        return Number(u.id || u._id || u.userId) || 1;
      } catch {
        return 1;
      }
    })();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionStates, setActionStates] = useState({}); // { [notifId or actorId]: 'accepted' | 'declined' }
  const dropdownRef = useRef(null);

  // Load real notifications when opened (Instagram-style rich history list)
  useEffect(() => {
    if (!isOpen || !effectiveUserId) return;

    let isMounted = true;
    setLoading(true);

    fetchNotifications(effectiveUserId)
      .then((data) => {
        if (!isMounted) return;
        const realData = Array.isArray(data) ? data : [];
        setNotifications(realData);
        const unread = realData.filter((n) => !n.is_read).length;
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

  // Click outside to close (supporting mouse and touch safely on desktop & mobile)
  useEffect(() => {
    function handleClickOutside(e) {
      if (!dropdownRef.current) return;
      if (
        dropdownRef.current === e.target ||
        dropdownRef.current.contains(e.target) ||
        e.target?.closest?.('.notif-dropdown-wrapper') ||
        e.target?.closest?.('.ud-notif-btn') ||
        e.target?.closest?.('.ud-mob-icon-btn')
      ) {
        return;
      }
      onClose?.();
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Accept Follow Request
  const handleAccept = async (e, item) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const actorId = item.actor_id || item.ref_id || 1;
    const targetUserId = item.user_id || effectiveUserId;
    const actorName = item.actor_name || 'Leader';
    const notifId = item.id;

    // Immediately update UI optimistically
    setActionStates((prev) => ({
      ...prev,
      [notifId]: 'accepted',
      [actorId]: 'accepted',
    }));
    toast.success(`You accepted ${actorName}'s follow request!`);

    // Update notifications in state - KEEP IN LIST, mark accepted and read
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId || (n.actor_id && n.actor_id === actorId)
          ? { ...n, is_read: true, follow_status: 'accepted' }
          : n
      )
    );

    const remainingUnread = Math.max(0, notifications.filter((n) => !n.is_read && n.id !== notifId).length);
    onNotificationCountChange?.(remainingUnread);

    try {
      const res = await acceptFollowRequest(actorId, targetUserId, notifId);
      window.dispatchEvent(new CustomEvent('followers_count_refresh'));
      window.dispatchEvent(new CustomEvent('messages_count_refresh'));
      if (res && res.success === false) {
        console.warn('Accept API warning:', res.message);
      }
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  // Handle Decline Follow Request (DO NOT remove notification from list)
  const handleDecline = async (e, item) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const actorId = item.actor_id || item.ref_id || 1;
    const targetUserId = item.user_id || effectiveUserId;
    const notifId = item.id;

    // Immediately update UI optimistically
    setActionStates((prev) => ({
      ...prev,
      [notifId]: 'declined',
      [actorId]: 'declined',
    }));
    toast('Follow request declined', { icon: 'ℹ️' });

    // KEEP notification in list so user can still scroll and view history
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId || (n.actor_id && n.actor_id === actorId)
          ? { ...n, is_read: true, follow_status: 'declined' }
          : n
      )
    );

    const remainingUnread = Math.max(0, notifications.filter((n) => !n.is_read && n.id !== notifId).length);
    onNotificationCountChange?.(remainingUnread);

    try {
      await rejectFollowRequest(actorId, targetUserId, notifId);
      window.dispatchEvent(new CustomEvent('followers_count_refresh'));
      window.dispatchEvent(new CustomEvent('messages_count_refresh'));
    } catch (err) {
      console.error('Decline error:', err);
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
            const actionState =
              actionStates[item.id] ||
              (item.actor_id ? actionStates[item.actor_id] : null) ||
              (item.follow_status === 'accepted' ? 'accepted' : null);

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
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleAccept(e, item)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="notif-btn-decline"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleDecline(e, item)}
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
