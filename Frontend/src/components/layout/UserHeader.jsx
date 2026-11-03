import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { fetchUnreadCount } from '../../services/notification.service';
import { joinChat, getSocket } from '../../services/socket.service';
import './UserNavigation.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';
import whatsappIconImg from '../../assets/dashboard/whatsaap-icon.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';

export default function UserHeader({
  user,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onProfileClick,
  onMessagesClick,
  notificationCount = 4,
  messageCount = 3,
}) {
  const navigate = useNavigate();

  // Fallback to local storage if user prop is missing or partial
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }

  const displayName = user?.name || storedUser.name || 'User';
  const displayRole = user?.role || user?.userRole || storedUser.designation || storedUser.role || 'Leader';
  const displayAvatar = user?.avatarUrl || user?.avatarImg || storedUser.avatarUrl || userAvatarImg;
  const currentUserId = user?.id || storedUser.id;

  const [notifOpen, setNotifOpen] = useState(false);
  const [realNotifCount, setRealNotifCount] = useState(0);

  // Fetch real notification count from backend + live socket updates
  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;

    const refreshCount = () => {
      fetchUnreadCount(currentUserId)
        .then((cnt) => {
          if (isMounted) setRealNotifCount(cnt || 0);
        })
        .catch((err) => console.error('fetchUnreadCount error:', err));
    };

    refreshCount();

    // Socket live listener
    joinChat(currentUserId);
    const s = getSocket();
    s.on('new_notification', refreshCount);
    s.on('follow_request_received', refreshCount);

    // 5s background sync
    const interval = setInterval(refreshCount, 5000);

    return () => {
      isMounted = false;
      s.off('new_notification', refreshCount);
      s.off('follow_request_received', refreshCount);
      clearInterval(interval);
    };
  }, [currentUserId]);

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handleMessagesClick = () => {
    if (onMessagesClick) {
      onMessagesClick();
    } else {
      navigate('/messages');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <>
      {/* ───────────────── DESKTOP TOPBAR (> 768px) ───────────────── */}
      <header className="ud-topbar ud-topbar-desktop">
        {/* Brand logo & mobile toggle */}
        <div className="ud-topbar-left">
          <button
            type="button"
            className="ud-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)}
            aria-label="Toggle Sidebar Navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="ud-brand-logo-card">
            <Link to="/dashboard" className="ud-brand-logo">
              <img src={logoIconImg} alt="Fortaa" className="ud-logo-icon" />
              <div className="ud-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="ud-logo-word" />
                <span className="ud-logo-tagline">Discover, easy and Grow</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Global Unified Search Bar (Figma spec: 741x35px, radius 10px, padding 10px, gap 10px) */}
        <form className="ud-search-wrapper" onSubmit={handleFormSubmit}>
          <img src={searchIconPurple} alt="" className="ud-search-icon-img" />
          <input
            type="text"
            className="ud-search-input"
            placeholder="Search people, posts, companies, products, opportunities..."
            value={searchQuery !== undefined ? searchQuery : undefined}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </form>

        {/* Topbar Actions & Profile Pill */}
        <div className="ud-topbar-right">
          <button
            type="button"
            className="ud-icon-circle-btn ud-wa-btn"
            title="WhatsApp"
            onClick={() => toast.success('WhatsApp connected!')}
          >
            <img src={whatsappIconImg} alt="WhatsApp" className="ud-wa-img-icon" />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="ud-icon-circle-btn ud-notif-btn"
              title="Notifications"
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <img src={bellIconImg} alt="Notifications" className="ud-header-action-icon" />
              {realNotifCount > 0 && <span className="ud-badge-count">{realNotifCount}</span>}
            </button>
            <NotificationDropdown
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              currentUserId={currentUserId}
              onNotificationCountChange={setRealNotifCount}
            />
          </div>

          <button
            type="button"
            className="ud-icon-circle-btn ud-msg-btn"
            title="Messages"
            onClick={handleMessagesClick}
          >
            <img src={messageIconImg} alt="Messages" className="ud-header-action-icon" />
            {messageCount > 0 && <span className="ud-badge-count">{messageCount}</span>}
          </button>

          {/* User Profile Mini Capsule */}
          <div
            className="ud-user-pill"
            title="Current User"
            onClick={handleProfileClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleProfileClick();
            }}
          >
            <img src={displayAvatar} alt="Profile" className="ud-user-pill-avatar" />
            <div className="ud-user-pill-info">
              <span className="ud-user-pill-name">{displayName}</span>
              <span className="ud-user-pill-role">{displayRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────── MOBILE HEADER (<= 768px, FIGMA ROYAL BLUE #3A23D5) ───────────────── */}
      <header className="ud-mob-header">
        {/* Navigation row: Logo pill left, actions right */}
        <div className="ud-mob-nav-row">
          <Link to="/dashboard" className="ud-mob-logo-pill" title="FORTAA Home">
            <img src={logoIconImg} alt="Fortaa" className="ud-mob-logo-icon" />
            <div className="ud-mob-logo-text">
              <img src={logoTextImg} alt="FORTAA" className="ud-mob-logo-word" />
              <span className="ud-mob-logo-tagline">Discover, easy and Grow</span>
            </div>
          </Link>

          <div className="ud-mob-header-actions">
            <button
              type="button"
              className="ud-mob-icon-btn"
              title="WhatsApp"
              onClick={() => toast.success('Connecting to WhatsApp...')}
            >
              <img src={whatsappIconImg} alt="WhatsApp" className="ud-mob-action-img" />
            </button>

            <button
              type="button"
              className="ud-mob-icon-btn badge-btn"
              title="Notifications"
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <img src={bellIconImg} alt="Notifications" className="ud-mob-action-img" />
              {realNotifCount > 0 && <span className="ud-mob-red-badge">{realNotifCount}</span>}
            </button>

            <button
              type="button"
              className="ud-mob-icon-btn badge-btn"
              title="Messages"
              onClick={handleMessagesClick}
            >
              <img src={messageIconImg} alt="Messages" className="ud-mob-action-img" />
              {messageCount > 0 && <span className="ud-mob-red-badge">{messageCount}</span>}
            </button>

            <div
              className="ud-mob-avatar-btn"
              onClick={handleProfileClick}
              role="button"
              tabIndex={0}
              title="Profile"
            >
              <img src={displayAvatar} alt="Profile" className="ud-mob-avatar-img" />
            </div>
          </div>
        </div>

        {/* Full-width Search Bar */}
        <form className="ud-mob-search-wrap" onSubmit={handleFormSubmit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#232356" strokeWidth="2.2" className="ud-mob-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="ud-mob-search-input"
            placeholder="Search people, posts, companies, products, opportunities..."
            value={searchQuery !== undefined ? searchQuery : undefined}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </form>
      </header>
    </>
  );
}
