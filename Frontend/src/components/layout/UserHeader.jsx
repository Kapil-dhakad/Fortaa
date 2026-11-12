import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { fetchUnreadCount } from '../../services/notification.service';
import { fetchUnreadMessageCount } from '../../services/message.service';
import { joinChat, getSocket } from '../../services/socket.service';
import './UserNavigation.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';
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
  notificationCount = 0,
  messageCount = null,
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
  const [resolvedUserId, setResolvedUserId] = useState(() => user?.id || storedUser.id || storedUser._id || null);
  const currentUserId = user?.id || resolvedUserId || storedUser.id;

  // Auto-resolve real user id from backend if missing in localStorage
  useEffect(() => {
    const knownId = user?.id || storedUser.id || storedUser._id;
    if (knownId) {
      setResolvedUserId(knownId);
      return;
    }

    const email = user?.email || storedUser.email;
    if (email) {
      fetch(`/api/dashboard/overview?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.user?.id) {
            setResolvedUserId(data.user.id);
            try {
              const cur = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
              localStorage.setItem('fortaa_user', JSON.stringify({ ...cur, id: data.user.id, ...data.user }));
              window.dispatchEvent(new CustomEvent('fortaa_user_synced', { detail: data.user }));
            } catch {}
          }
        })
        .catch((err) => console.log('[UserHeader] resolve user error:', err));
    }
  }, [user?.id, user?.email, storedUser.id, storedUser._id, storedUser.email]);

  useEffect(() => {
    const handleUserSynced = (e) => {
      if (e?.detail?.id) {
        setResolvedUserId(e.detail.id);
      }
    };
    window.addEventListener('fortaa_user_synced', handleUserSynced);
    return () => window.removeEventListener('fortaa_user_synced', handleUserSynced);
  }, []);

  const [desktopNotifOpen, setDesktopNotifOpen] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [realNotifCount, setRealNotifCount] = useState(0);
  const [realMessageCount, setRealMessageCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const mobProfileDropdownRef = useRef(null);

  // Live User Search State
  const [internalSearch, setInternalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const mobSearchDropdownRef = useRef(null);

  const effectiveSearchText = searchQuery !== undefined ? searchQuery : internalSearch;

  const handleSearchChange = (val) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // Query leaders for live user autocomplete
  useEffect(() => {
    const q = (effectiveSearchText || '').trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    let isMounted = true;
    fetch('/api/dashboard/leaders')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list = data?.leaders || [];
        const matches = list.filter((u) => {
          const matchName = (u.name || '').toLowerCase().includes(q);
          const matchRole = (u.role || u.designation || '').toLowerCase().includes(q);
          const matchCompany = (u.company_brand || '').toLowerCase().includes(q);
          const matchUsername = (u.username || '').toLowerCase().includes(q);
          return matchName || matchRole || matchCompany || matchUsername;
        });
        setSearchResults(matches.slice(0, 6));
        setSearchDropdownOpen(true);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [effectiveSearchText]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleSearchClickOutside(event) {
      const isDesktop = searchDropdownRef.current?.contains(event.target);
      const isMobile = mobSearchDropdownRef.current?.contains(event.target);
      const isSearchInput = event.target?.closest?.('.ud-search-wrapper, .ud-mob-search-wrap');
      if (!isDesktop && !isMobile && !isSearchInput) {
        setSearchDropdownOpen(false);
      }
    }
    if (searchDropdownOpen) {
      document.addEventListener('mousedown', handleSearchClickOutside);
      document.addEventListener('touchstart', handleSearchClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleSearchClickOutside);
      document.removeEventListener('touchstart', handleSearchClickOutside);
    };
  }, [searchDropdownOpen]);

  // Handle clicking a searched leader
  const handleSelectLeader = (leader) => {
    setSearchDropdownOpen(false);
    navigate(`/leaders/${leader.id}`, { state: { leader } });
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      const isInsideDesktop = profileDropdownRef.current?.contains(event.target);
      const isInsideMobile = mobProfileDropdownRef.current?.contains(event.target);
      const isTrigger = event.target.closest('.ud-user-pill, .ud-mob-avatar-btn');

      if (!isInsideDesktop && !isInsideMobile && !isTrigger) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    localStorage.clear();
    sessionStorage.clear();
    setProfileMenuOpen(false);
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  // Fetch real notification & unread message count from backend + live socket updates
  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;

    const refreshNotifCount = () => {
      fetchUnreadCount(currentUserId)
        .then((cnt) => {
          if (isMounted) setRealNotifCount(cnt || 0);
        })
        .catch((err) => console.error('fetchUnreadCount error:', err));
    };

    const refreshMsgCount = () => {
      fetchUnreadMessageCount(currentUserId)
        .then((cnt) => {
          if (isMounted) setRealMessageCount(cnt || 0);
        })
        .catch((err) => console.error('fetchUnreadMessageCount error:', err));
    };

    refreshNotifCount();
    refreshMsgCount();

    // Socket live listener
    joinChat(currentUserId);
    const s = getSocket();

    const handleFollowRequestNotif = (data) => {
      refreshNotifCount();
      const requesterName = data?.requesterName || 'A member';
      toast(
        (t) => (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => {
              setDesktopNotifOpen(true);
              setMobileNotifOpen(true);
              toast.dismiss(t.id);
            }}
          >
            <span style={{ fontSize: '20px' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E1B4B' }}>New Follow Request!</div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>{requesterName} sent you a follow request. Click to view.</div>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    };

    s.on('new_notification', refreshNotifCount);
    s.on('follow_request_received', handleFollowRequestNotif);

    s.on('new_message', refreshMsgCount);
    s.on('messages_read', refreshMsgCount);
    s.on('messages_marked_read', refreshMsgCount);

    // Custom window event for instant local updates across tabs / components
    const handleCountRefresh = () => {
      refreshNotifCount();
      refreshMsgCount();
    };
    window.addEventListener('messages_count_refresh', handleCountRefresh);

    // 3s background sync
    const interval = setInterval(() => {
      refreshNotifCount();
      refreshMsgCount();
    }, 3000);

    return () => {
      isMounted = false;
      s.off('new_notification', refreshNotifCount);
      s.off('follow_request_received', handleFollowRequestNotif);
      s.off('new_message', refreshMsgCount);
      s.off('messages_read', refreshMsgCount);
      s.off('messages_marked_read', refreshMsgCount);
      window.removeEventListener('messages_count_refresh', handleCountRefresh);
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
    setSearchDropdownOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(effectiveSearchText);
    } else if (effectiveSearchText?.trim()) {
      navigate(`/leaders?search=${encodeURIComponent(effectiveSearchText.trim())}`);
    }
  };

  const effectiveMsgCount = messageCount !== null ? messageCount : realMessageCount;

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
            value={effectiveSearchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (effectiveSearchText?.trim() && searchResults.length > 0) {
                setSearchDropdownOpen(true);
              }
            }}
          />

          {/* Live Search Autocomplete Dropdown */}
          {searchDropdownOpen && (
            <div className="ud-search-dropdown" ref={searchDropdownRef}>
              {searchResults.length > 0 ? (
                <>
                  <div className="ud-search-dropdown-header">
                    <span>PEOPLE & LEADERS</span>
                    <span className="ud-search-count">{searchResults.length} found</span>
                  </div>
                  <div className="ud-search-dropdown-list">
                    {searchResults.map((person) => (
                      <div
                        key={person.id}
                        className="ud-search-dropdown-item"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => handleSelectLeader(person)}
                      >
                        <img
                          src={person.avatar_url || userAvatarImg}
                          alt={person.name}
                          className="ud-search-item-avatar"
                        />
                        <div className="ud-search-item-info">
                          <span className="ud-search-item-name">{person.name}</span>
                          <span className="ud-search-item-role">
                            {person.role || person.designation || 'Business Leader'}
                            {person.company_brand ? ` • ${person.company_brand}` : ''}
                          </span>
                        </div>
                        <span className="ud-search-item-arrow">→</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="ud-search-dropdown-footer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate(`/leaders?search=${encodeURIComponent(effectiveSearchText.trim())}`);
                    }}
                  >
                    <span>View all leaders matching "{effectiveSearchText}"</span>
                    <span>→</span>
                  </div>
                </>
              ) : effectiveSearchText.trim().length >= 2 ? (
                <div className="ud-search-no-results">
                  <span>No leaders found matching "{effectiveSearchText}"</span>
                  <button
                    type="button"
                    className="ud-search-view-all-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate(`/leaders?search=${encodeURIComponent(effectiveSearchText.trim())}`);
                    }}
                  >
                    Search in Directory
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </form>

        {/* Topbar Actions & Profile Pill */}
        <div className="ud-topbar-right">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="ud-icon-circle-btn ud-notif-btn"
              title="Notifications"
              onClick={() => setDesktopNotifOpen((prev) => !prev)}
            >
              <img src={bellIconImg} alt="Notifications" className="ud-header-action-icon" />
              {realNotifCount > 0 && <span className="ud-badge-count">{realNotifCount}</span>}
            </button>
            <NotificationDropdown
              isOpen={desktopNotifOpen}
              onClose={() => setDesktopNotifOpen(false)}
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
            {effectiveMsgCount > 0 && (
              <span className="ud-badge-count">
                {effectiveMsgCount > 99 ? '99+' : effectiveMsgCount}
              </span>
            )}
          </button>

          {/* User Profile Mini Capsule with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              className="ud-user-pill"
              title="Profile menu"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setProfileMenuOpen((prev) => !prev);
              }}
            >
              <img src={displayAvatar} alt="Profile" className="ud-user-pill-avatar" />
              <div className="ud-user-pill-info">
                <span className="ud-user-pill-name">{displayName}</span>
                <span className="ud-user-pill-role">{displayRole}</span>
              </div>
              <span style={{ fontSize: '10px', marginLeft: '2px', color: 'rgba(255,255,255,0.7)' }}>
                {profileMenuOpen ? '▲' : '▼'}
              </span>
            </div>

            {profileMenuOpen && (
              <div className="ud-profile-dropdown" ref={profileDropdownRef}>
                <div className="ud-profile-dropdown-user-block">
                  <img src={displayAvatar} alt="" className="ud-profile-dropdown-avatar" />
                  <div className="ud-profile-dropdown-meta">
                    <span className="ud-profile-dropdown-name">{displayName}</span>
                    <span className="ud-profile-dropdown-role">{displayRole}</span>
                    <span className="ud-profile-dropdown-email">{storedUser.email || ''}</span>
                  </div>
                </div>

                <div className="ud-profile-dropdown-divider" />

                <button
                  type="button"
                  className="ud-profile-dropdown-btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                >
                  <span className="ud-dropdown-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  className="ud-profile-dropdown-btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  <span className="ud-dropdown-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </span>
                  <span>Settings</span>
                </button>

                <div className="ud-profile-dropdown-divider" />

                <button
                  type="button"
                  className="ud-profile-dropdown-btn ud-dropdown-logout-btn"
                  onClick={handleLogout}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="ud-dropdown-icon ud-dropdown-logout-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  <span>Log Out</span>
                </button>
              </div>
            )}
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
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="ud-mob-icon-btn badge-btn"
                title="Notifications"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileNotifOpen((prev) => !prev);
                }}
              >
                <img src={bellIconImg} alt="Notifications" className="ud-mob-action-img" />
                {realNotifCount > 0 && <span className="ud-mob-red-badge">{realNotifCount}</span>}
              </button>
              <NotificationDropdown
                isOpen={mobileNotifOpen}
                onClose={() => setMobileNotifOpen(false)}
                currentUserId={currentUserId}
                onNotificationCountChange={setRealNotifCount}
              />
            </div>

            <button
              type="button"
              className="ud-mob-icon-btn badge-btn"
              title="Messages"
              onClick={handleMessagesClick}
            >
              <img src={messageIconImg} alt="Messages" className="ud-mob-action-img" />
              {effectiveMsgCount > 0 && (
                <span className="ud-mob-red-badge">
                  {effectiveMsgCount > 99 ? '99+' : effectiveMsgCount}
                </span>
              )}
            </button>

            <div style={{ position: 'relative' }}>
              <div
                className="ud-mob-avatar-btn"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                title="Profile menu"
              >
                <img src={displayAvatar} alt="Profile" className="ud-mob-avatar-img" />
              </div>

              {profileMenuOpen && (
                <div className="ud-profile-dropdown ud-profile-dropdown-mob" ref={mobProfileDropdownRef}>
                  <div className="ud-profile-dropdown-user-block">
                    <img src={displayAvatar} alt="" className="ud-profile-dropdown-avatar" />
                    <div className="ud-profile-dropdown-meta">
                      <span className="ud-profile-dropdown-name">{displayName}</span>
                      <span className="ud-profile-dropdown-role">{displayRole}</span>
                    </div>
                  </div>

                  <div className="ud-profile-dropdown-divider" />

                  <button
                    type="button"
                    className="ud-profile-dropdown-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <span className="ud-dropdown-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    className="ud-profile-dropdown-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <span className="ud-dropdown-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </span>
                    <span>Settings</span>
                  </button>

                  <div className="ud-profile-dropdown-divider" />

                  <button
                    type="button"
                    className="ud-profile-dropdown-btn ud-dropdown-logout-btn"
                    onClick={handleLogout}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <span className="ud-dropdown-icon ud-dropdown-logout-icon">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
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
            value={effectiveSearchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (effectiveSearchText?.trim() && searchResults.length > 0) {
                setSearchDropdownOpen(true);
              }
            }}
          />

          {/* Live Mobile Search Autocomplete Dropdown */}
          {searchDropdownOpen && (
            <div className="ud-search-dropdown" ref={mobSearchDropdownRef}>
              {searchResults.length > 0 ? (
                <>
                  <div className="ud-search-dropdown-header">
                    <span>PEOPLE & LEADERS</span>
                    <span className="ud-search-count">{searchResults.length} found</span>
                  </div>
                  <div className="ud-search-dropdown-list">
                    {searchResults.map((person) => (
                      <div
                        key={person.id}
                        className="ud-search-dropdown-item"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => handleSelectLeader(person)}
                      >
                        <img
                          src={person.avatar_url || userAvatarImg}
                          alt={person.name}
                          className="ud-search-item-avatar"
                        />
                        <div className="ud-search-item-info">
                          <span className="ud-search-item-name">{person.name}</span>
                          <span className="ud-search-item-role">
                            {person.role || person.designation || 'Business Leader'}
                            {person.company_brand ? ` • ${person.company_brand}` : ''}
                          </span>
                        </div>
                        <span className="ud-search-item-arrow">→</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="ud-search-dropdown-footer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate(`/leaders?search=${encodeURIComponent(effectiveSearchText.trim())}`);
                    }}
                  >
                    <span>View all leaders matching "{effectiveSearchText}"</span>
                    <span>→</span>
                  </div>
                </>
              ) : effectiveSearchText.trim().length >= 2 ? (
                <div className="ud-search-no-results">
                  <span>No leaders found matching "{effectiveSearchText}"</span>
                  <button
                    type="button"
                    className="ud-search-view-all-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate(`/leaders?search=${encodeURIComponent(effectiveSearchText.trim())}`);
                    }}
                  >
                    Search in Directory
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </form>
      </header>
    </>
  );
}
