import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import {
  fetchNotifications,
  markNotificationsRead,
  markNotificationAsRead,
  deleteNotification,
} from '../../services/notification.service';
import {
  acceptFollowRequest,
  rejectFollowRequest,
} from '../../services/follow.service';
import { fetchCurrentUser } from '../../services/user.service';
import { getSocket } from '../../services/socket.service';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const navigate = useNavigate();

  // Read stored user safely
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }
  const [currentUserId, setCurrentUserId] = useState(() => storedUser.id || storedUser._id || null);

  useEffect(() => {
    if (!currentUserId) {
      fetchCurrentUser().then((me) => {
        if (me?.id) setCurrentUserId(me.id);
      }).catch(() => {});
    }
  }, [currentUserId]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStates, setActionStates] = useState({}); // { [notifId or actorId]: 'accepted' | 'declined' }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openOptionsId, setOpenOptionsId] = useState(null); // ID for 3-dots dropdown menu

  // Auto close 3-dots dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenOptionsId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Load notifications from API
  const loadNotifications = async (showLoading = false) => {
    if (!currentUserId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await fetchNotifications(currentUserId);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);

    // Realtime notification updates via Socket
    const s = getSocket();
    const handleNewNotif = () => {
      loadNotifications(false);
    };

    if (s) {
      s.on('new_notification', handleNewNotif);
      s.on('follow_request', handleNewNotif);
      s.on('follow_accepted', handleNewNotif);
    }

    return () => {
      if (s) {
        s.off('new_notification', handleNewNotif);
        s.off('follow_request', handleNewNotif);
        s.off('follow_accepted', handleNewNotif);
      }
    };
  }, [currentUserId]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!currentUserId || notifications.length === 0) return;
    const hasUnread = notifications.some((n) => !n.is_read);
    if (!hasUnread) {
      // toast('All notifications are already marked as read', { icon: '✨' });
      return;
    }

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // toast.success('All notifications marked as read');

    try {
      await markNotificationsRead(currentUserId);
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Delete / Dismiss individual notification
  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    // toast.success('Notification removed');
    try {
      await deleteNotification(notifId, currentUserId);
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  // Accept Follow Request
  const handleAccept = async (e, item) => {
    e.stopPropagation();
    const actorId = item.actor_id || item.ref_id;
    const notifId = item.id;
    const actorName = item.actor_name || 'Leader';

    // Optimistic UI
    setActionStates((prev) => ({
      ...prev,
      [notifId]: 'accepted',
      [actorId]: 'accepted',
    }));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId || (n.actor_id && n.actor_id === actorId)
          ? { ...n, is_read: true, follow_status: 'accepted' }
          : n
      )
    );
    // toast.success(`You accepted ${actorName}'s follow request! 🎉`);

    try {
      await acceptFollowRequest(actorId, currentUserId, notifId);
      window.dispatchEvent(new CustomEvent('followers_count_refresh'));
      window.dispatchEvent(new CustomEvent('messages_count_refresh'));
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
    } catch (err) {
      console.error('Accept follow error:', err);
    }
  };

  // Decline Follow Request
  const handleDecline = async (e, item) => {
    e.stopPropagation();
    const actorId = item.actor_id || item.ref_id;
    const notifId = item.id;

    // Optimistic UI
    setActionStates((prev) => ({
      ...prev,
      [notifId]: 'declined',
      [actorId]: 'declined',
    }));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId || (n.actor_id && n.actor_id === actorId)
          ? { ...n, is_read: true, follow_status: 'declined' }
          : n
      )
    );
    // toast('Follow request declined', { icon: 'ℹ️' });

    try {
      await rejectFollowRequest(actorId, currentUserId, notifId);
      window.dispatchEvent(new CustomEvent('followers_count_refresh'));
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
    } catch (err) {
      console.error('Decline follow error:', err);
    }
  };

  // Navigate when notification item is clicked & auto-mark as read (LinkedIn/Instagram style)
  const handleNotificationClick = async (item) => {
    // If notification is unread, immediately mark read (removes light bg & blue dot)
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      try {
        await markNotificationAsRead(item.id, true);
        window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
      } catch (err) {
        console.error('Failed to mark read on click:', err);
      }
    }

    const actorId = item.actor_id || item.ref_id;
    if (item.type === 'message' && actorId) {
      navigate(`/messages?userId=${actorId}`);
    } else if (item.type === 'post_like' || item.type === 'post_comment') {
      navigate('/dashboard');
    } else if (actorId) {
      navigate(`/leader/${actorId}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Toggle read/unread status from 3-dots menu
  const handleToggleRead = async (e, item) => {
    e.stopPropagation();
    setOpenOptionsId(null);
    const newStatus = !item.is_read;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: newStatus } : n))
    );

    try {
      await markNotificationAsRead(item.id, newStatus);
      window.dispatchEvent(new CustomEvent('notifications_count_refresh'));
      // toast.success(newStatus ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      console.error('Toggle read error:', err);
    }
  };

  // Relative time helper (compact LinkedIn style)
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'now';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Total unread notifications count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Helper for notification type icons & labels
  const getNotificationBadge = (type) => {
    switch (type) {
      case 'follow_request':
        return { icon: '👥', label: 'Request', badgeClass: 'np-badge-request' };
      case 'follow_accepted':
      case 'new_follower':
        return { icon: '✨', label: 'Follower', badgeClass: 'np-badge-follow' };
      case 'profile_view':
        return { icon: '👁️', label: 'View', badgeClass: 'np-badge-view' };
      case 'post_like':
        return { icon: '❤️', label: 'Like', badgeClass: 'np-badge-like' };
      case 'post_comment':
        return { icon: '💬', label: 'Comment', badgeClass: 'np-badge-comment' };
      case 'message':
        return { icon: '✉️', label: 'Message', badgeClass: 'np-badge-message' };
      default:
        return { icon: '🔔', label: 'Alert', badgeClass: 'np-badge-default' };
    }
  };

  return (
    <div className="np-page-root">
      {/* Universal Desktop & Mobile Header */}
      <UserHeader currentUserId={currentUserId} />

      <div className="np-main-layout">
        {/* Unified Sidebar for Desktop */}
        <UserSidebar
          activeTab="Notifications"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="np-content-container">
          <div className="np-card-box">
            {/* Page Header (Instagram / LinkedIn Style) */}
            <div className="np-header-row">
              <div className="np-header-left">
                <button
                  type="button"
                  className="np-back-btn"
                  onClick={() => navigate(-1)}
                  title="Go back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <div className="np-title-wrap">
                  <h1 className="np-header-title">Notifications</h1>
                  {unreadCount > 0 && (
                    <span className="np-unread-pill">{unreadCount} new</span>
                  )}
                </div>
              </div>

              <div className="np-header-actions">
                <button
                  type="button"
                  className="np-refresh-btn"
                  onClick={() => loadNotifications(true)}
                  title="Refresh notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            {loading ? (
              <div className="np-loading-state">
                <div className="np-spinner" />
                <p>Loading your notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="np-empty-state">
                <div className="np-empty-icon-wrap">
                  <span className="np-empty-icon">🔔</span>
                </div>
                <h3 className="np-empty-title">No notifications yet</h3>
                <p className="np-empty-desc">
                  When leaders connect with you, view your profile, or like your posts, you will see them here.
                </p>
                <button
                  type="button"
                  className="np-explore-btn"
                  onClick={() => navigate('/leaders')}
                >
                  Explore Leaders & Network
                </button>
              </div>
            ) : (
              <div className="np-list-container">
                {notifications.map((item) => {
                  const badge = getNotificationBadge(item.type);
                  const isUnread = !item.is_read;
                  const currentStatus =
                    actionStates[item.id] ||
                    actionStates[item.actor_id] ||
                    item.follow_status ||
                    (item.type === 'follow_request' ? 'pending' : null);

                  return (
                    <article
                      key={item.id}
                      className={`np-item-card ${isUnread ? 'is-unread' : 'is-read'}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      {/* Far-left LinkedIn Style Unread Blue Indicator Dot */}
                      <div className="np-unread-col">
                        {isUnread ? (
                          <span className="np-unread-dot-linkedin" title="Unread notification" />
                        ) : (
                          <span className="np-unread-dot-placeholder" />
                        )}
                      </div>

                      {/* Left: Avatar + Badge */}
                      <div className="np-avatar-container">
                        <img
                          src={item.actor_avatar || userAvatarImg}
                          alt={item.actor_name || 'User'}
                          className="np-avatar-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = userAvatarImg;
                          }}
                        />
                        <span className={`np-type-badge ${badge.badgeClass}`} title={badge.label}>
                          {badge.icon}
                        </span>
                      </div>

                      {/* Middle: Content details */}
                      <div className="np-content-col">
                        <div className="np-message-row">
                          <span
                            className="np-actor-name"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.actor_id) navigate(`/leader/${item.actor_id}`);
                            }}
                          >
                            {item.actor_name || 'Fortaa Member'}
                          </span>
                          <span className="np-action-text">
                            {item.message?.replace(item.actor_name || '', '').trim() ||
                              (item.type === 'follow_request'
                                ? 'sent you a follow request.'
                                : item.type === 'follow_accepted'
                                ? 'accepted your follow request.'
                                : item.type === 'new_follower'
                                ? 'started following you.'
                                : item.type === 'profile_view'
                                ? 'viewed your profile.'
                                : 'interacted with your profile.')}
                          </span>
                        </div>

                        <div className="np-meta-row">
                          <span className="np-actor-role">
                            {item.actor_role || 'Business Leader'}
                            {item.actor_company ? ` • ${item.actor_company}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Time, Contextual Action Buttons & 3-Dots Options */}
                      <div className="np-actions-col" onClick={(e) => e.stopPropagation()}>
                        <span className="np-time-text">{formatTimeAgo(item.created_at)}</span>

                        {item.type === 'follow_request' && (
                          <>
                            {currentStatus === 'accepted' ? (
                              <div className="np-status-group">
                                <span className="np-badge-done">✓ Accepted</span>
                                <button
                                  type="button"
                                  className="np-btn-sm np-btn-msg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/messages?userId=${item.actor_id}`);
                                  }}
                                >
                                  Message
                                </button>
                              </div>
                            ) : currentStatus === 'declined' ? (
                              <span className="np-badge-declined">Declined</span>
                            ) : (
                              <div className="np-btn-group">
                                <button
                                  type="button"
                                  className="np-btn-sm np-btn-primary"
                                  onClick={(e) => handleAccept(e, item)}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="np-btn-sm np-btn-secondary"
                                  onClick={(e) => handleDecline(e, item)}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {item.type !== 'follow_request' && (
                          <button
                            type="button"
                            className="np-btn-sm np-btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(item);
                            }}
                          >
                            {item.type === 'message'
                              ? 'Reply'
                              : item.type === 'profile_view'
                              ? 'View Profile'
                              : 'View'}
                          </button>
                        )}

                        {/* 3-Dots More Options (LinkedIn style) */}
                        <div className="np-more-wrap">
                          <button
                            type="button"
                            className="np-more-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOptionsId(openOptionsId === item.id ? null : item.id);
                            }}
                            title="More options"
                            aria-label="More options"
                          >
                            •••
                          </button>

                          {openOptionsId === item.id && (
                            <div className="np-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="np-dropdown-item"
                                onClick={(e) => handleToggleRead(e, item)}
                              >
                                {isUnread ? 'Mark as read' : 'Mark as unread'}
                              </button>
                              <button
                                type="button"
                                className="np-dropdown-item np-dropdown-delete"
                                onClick={(e) => {
                                  setOpenOptionsId(null);
                                  handleDelete(e, item.id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Universal Mobile Bottom Navigation */}
      <UserMobileBottomNav
        active="Notifications"
        onPlusClick={() => navigate('/dashboard')}
      />
    </div>
  );
}
