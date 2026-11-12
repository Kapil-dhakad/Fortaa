import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './UserNavigation.css';

// Sidebar Icons for Mobile Menu Grid
import navHomeIcon from '../../assets/sidebar/nav_home.png';
import navProfileIcon from '../../assets/sidebar/nav_profile.png';
import navServicesIcon from '../../assets/sidebar/nav_services.png';
import navMarketplaceIcon from '../../assets/sidebar/nav_marketplace.png';
import navCompaniesIcon from '../../assets/sidebar/nav_companies.png';
import navProductsIcon from '../../assets/sidebar/nav_products.png';
import navLeadersIcon from '../../assets/sidebar/nav_leaders.png';
import navPromotionsIcon from '../../assets/sidebar/nav_promotions.png';
import navEventsIcon from '../../assets/sidebar/nav_events.png';
import navNewsIcon from '../../assets/sidebar/nav_news.png';
import navMessagesIcon from '../../assets/sidebar/nav_messages.png';
import navGroupsIcon from '../../assets/sidebar/nav_groups.png';
import navResourcesIcon from '../../assets/sidebar/nav_resources.png';
import navSettingsIcon from '../../assets/sidebar/nav_settings.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';

const MOBILE_MENU_ITEMS = [
  { label: 'Home', icon: navHomeIcon, path: '/dashboard' },
  { label: 'My Profile', icon: navProfileIcon, path: '/profile' },
  { label: 'Services', icon: navServicesIcon, path: '/services' },
  { label: 'Market Place', icon: navMarketplaceIcon, path: '/marketplace' },
  { label: 'Companies', icon: navCompaniesIcon, path: '/companies' },
  { label: 'Products', icon: navProductsIcon, path: '/products' },
  { label: 'Leaders', icon: navLeadersIcon, path: '/leaders' },
  { label: 'Promotions', icon: navPromotionsIcon, path: '/promotions' },
  { label: 'Events', icon: navEventsIcon, path: '/events' },
  { label: 'News & Updates', icon: navNewsIcon, path: '/news' },
  { label: 'Messages', icon: navMessagesIcon, path: '/messages' },
  { label: 'Groups', icon: navGroupsIcon, path: '/groups' },
  { label: 'Resources', icon: navResourcesIcon, path: '/resources' },
  { label: 'Settings', icon: navSettingsIcon, path: '/settings' },
];

export default function UserMobileBottomNav({
  active = 'Home',
  onPlusClick,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Stored user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  const userName = storedUser.name || 'Kapil Dhakad';
  const userRole = storedUser.designation || 'Gold Leader';
  const userAvatar = storedUser.avatarUrl || userAvatarImg;

  const handleLogout = () => {
    localStorage.removeItem('fortaa_token');
    localStorage.removeItem('fortaa_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleItemClick = (item) => {
    setMenuOpen(false);
    if (item.path) {
      navigate(item.path);
    } else {
      toast(`${item.label} opened`);
    }
  };

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar ── */}
      <nav className="ud-mob-bottom-navbar">
        {/* Home */}
        <button
          type="button"
          className={`ud-mob-bnav-item ${active === 'Home' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Home</span>
        </button>

        {/* Network / Leaders */}
        <button
          type="button"
          className={`ud-mob-bnav-item ${active === 'Network' ? 'active' : ''}`}
          onClick={() => navigate('/leaders')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Network</span>
        </button>

        {/* Center Floating Plus FAB */}
        <button
          type="button"
          className="ud-mob-bnav-fab"
          onClick={() => {
            if (onPlusClick) {
              onPlusClick();
            } else {
              navigate('/dashboard');
            }
          }}
          aria-label="Create Post"
        >
          +
        </button>

        {/* Opportunity */}
        <button
          type="button"
          className={`ud-mob-bnav-item ${active === 'Opportunity' ? 'active' : ''}`}
          onClick={() => navigate('/services')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span>Opportunity</span>
        </button>

        {/* Menu (Platform Full Drawer) */}
        <button
          type="button"
          className={`ud-mob-bnav-item ${menuOpen || active === 'Menu' || active === 'More' ? 'active' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open Navigation Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Menu</span>
        </button>
      </nav>

      {/* ── Slide-up Mobile Navigation Bottom Sheet Drawer ── */}
      {menuOpen && (
        <div
          className="ud-mob-menu-backdrop"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="ud-mob-menu-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div className="ud-mob-menu-handle-bar" />

            {/* User Profile Mini Header */}
            <div className="ud-mob-menu-user-row">
              <div
                className="ud-mob-menu-user-meta"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                title="View Profile"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="ud-mob-menu-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = userAvatarImg;
                  }}
                />
                <div className="ud-mob-menu-name-wrap">
                  <span className="ud-mob-menu-name">{userName}</span>
                  <span className="ud-mob-menu-badge">{userRole}</span>
                </div>
              </div>

              <button
                type="button"
                className="ud-mob-menu-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            {/* Quick Links Grid (All Sidebar Items) */}
            <div className="ud-mob-menu-grid">
              {MOBILE_MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`ud-mob-menu-card ${active === item.label ? 'is-active' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="ud-mob-menu-card-icon-wrap">
                    <img src={item.icon} alt={item.label} className="ud-mob-menu-card-icon" />
                  </span>
                  <span className="ud-mob-menu-card-title">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Bottom Actions: Logout */}
            <div className="ud-mob-menu-footer">
              <button
                type="button"
                className="ud-mob-menu-logout-btn"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
