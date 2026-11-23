import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome,
  FiGlobe,
  FiBriefcase,
  FiFileText,
  FiUsers,
  FiUser,
  FiTrendingUp,
  FiSettings,
  FiChevronDown,
  FiLogOut,
  FiPackage,
  FiCalendar,
  FiTag,
  FiShield,
  FiTarget,
  FiVolume2,
  FiMail,
  FiSearch,
  FiList,
  FiEye,
  FiEdit,
  FiMoreVertical,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
  FiLayers,
  FiX,
} from 'react-icons/fi';

import '../../components/layout/UserNavigation.css';
import './AdminDashboard.css';
import './AdminUserDashboard.css';

// Brand & Icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';
import AdminSupportChatModal from '../../components/admin/AdminSupportChatModal';
import AdminAccountTypesModal from '../../components/admin/AdminAccountTypesModal';
import { fetchUnreadSupportCount } from '../../services/support.service';

export default function AdminUserDashboard() {
  const [dbUsers, setDbUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [accountTypesModalOpen, setAccountTypesModalOpen] = useState(false);

  const loadUnreadSupport = useCallback(async () => {
    try {
      const count = await fetchUnreadSupportCount();
      setUnreadSupportCount(count);
    } catch {
      // ignore
    }
  }, []);

  const profileDropdownRef = useRef(null);

  // Stats matching Frame 151
  const [dbStats, setDbStats] = useState({
    totalUsers: '24,892',
    approvedUsers: '21,568',
    pendingApprovals: '2,147',
    rejectedUsers: '178',
    totalCompanies: '342',
  });

  // Collapsible sidebar accordion states — User Management open by default
  const [openSections, setOpenSections] = useState({
    website: false,
    company: false,
    content: false,
    user: true,
    marketing: false,
    settings: false,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // Profile click-outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key listener to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && showAllUsersModal) {
        setShowAllUsersModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAllUsersModal]);

  // Fetch real users from PostgreSQL database on component mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const response = await fetch('/api/users/all');
        const data = await response.json();
        if (isMounted && data.success && Array.isArray(data.users)) {
          setDbUsers(data.users);
        }

        // Dynamic stats
        const statsRes = await fetch('/api/users/stats');
        const statsData = await statsRes.json();
        if (isMounted && statsData.success && statsData.stats) {
          setDbStats({
            totalUsers: Number(statsData.stats.totalUsers || 24892).toLocaleString(),
            approvedUsers: Number(statsData.stats.approvedUsers || 21568).toLocaleString(),
            pendingApprovals: Number(statsData.stats.pendingApprovals || 2147).toLocaleString(),
            rejectedUsers: Number(statsData.stats.rejectedUsers || 178).toLocaleString(),
            totalCompanies: Number(statsData.stats.totalCompanies || 342).toLocaleString(),
          });
        }
        loadUnreadSupport();
      } catch (err) {
        console.warn('Backend API connection note:', err.message);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [loadUnreadSupport]);

  // Base Figma fallback rows (Frame 175)
  const figmaDemoUsers = [
    {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      phone: '+91 9095632210',
      type: 'Leader',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 2,
      name: 'Priya Verma',
      email: 'priya@gmail.com',
      phone: '+91 909758642',
      type: 'Business Partner',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 3,
      name: 'Amit Singh',
      email: 'amit@gmail.com',
      phone: '+91 902564324',
      type: 'Customer',
      status: 'Pending',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 4,
      name: 'Neha Gupta',
      email: 'neha@gmail.com',
      phone: '+91 90958364',
      type: 'Business Partner',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 5,
      name: 'Vikas Kumar',
      email: 'vikas@gmail.com',
      phone: '+91 909583263',
      type: 'Leader',
      status: 'Follow Up',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 6,
      name: 'Sneha Rathi',
      email: 'sneha@gmail.com',
      phone: '+91 909563263',
      type: 'Customer',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
  ];

  // Merge PostgreSQL DB users with demo users
  const allUsersList = [
    ...dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ? (u.phone.startsWith('+91') ? u.phone : `+91 ${u.phone}`) : '+91 9095832210',
      type: u.type || 'Leader',
      status: u.status || 'Approved',
      registeredOn: u.registeredOn || '06 Oct 2026, 06:12 PM',
    })),
    ...figmaDemoUsers,
  ];

  // Strictly display 6 users in the main card table
  const displayUsers = allUsersList.slice(0, 6);

  // Filtered users for popup modal
  const filteredModalUsers = allUsersList.filter((u) => {
    if (!modalSearch) return true;
    const term = modalSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.toLowerCase().includes(term) ||
      u.type.toLowerCase().includes(term) ||
      u.status.toLowerCase().includes(term)
    );
  });

  // Read stored admin
  let adminInfo = {};
  try {
    adminInfo = JSON.parse(localStorage.getItem('fortaa_admin') || '{}');
  } catch {
    adminInfo = {};
  }
  const adminName = adminInfo.name || 'Rahul sharma';
  const adminRole = adminInfo.designation || adminInfo.role || 'Silver Leader';
  const adminAvatar = adminInfo.avatarUrl || userAvatarImg;

  // Frame 151 Stat Cards
  const statCardsData = [
    {
      title: 'Total Registered Users',
      value: dbStats.totalUsers,
      trend: '+12%',
      trendUp: true,
      cardBg: '#E9E1FA',
      circleBg: '#8637EF',
      icon: <FiUsers size={24} color="#FFFFFF" />,
    },
    {
      title: 'Approved Users',
      value: dbStats.approvedUsers,
      trend: '+10%',
      trendUp: true,
      cardBg: '#DDF2FE',
      circleBg: '#0284C7',
      icon: <FiCheckCircle size={24} color="#FFFFFF" />,
    },
    {
      title: 'Pending Approvals',
      value: dbStats.pendingApprovals,
      trend: '+8%',
      trendUp: true,
      cardBg: '#FEEAD5',
      circleBg: '#EA580C',
      icon: <FiClock size={24} color="#FFFFFF" />,
    },
    {
      title: 'Rejected Users',
      value: dbStats.rejectedUsers,
      trend: '-5%',
      trendUp: false,
      cardBg: '#FDE2E4',
      circleBg: '#E11D48',
      icon: <FiXCircle size={24} color="#FFFFFF" />,
    },
    {
      title: 'Total Companies',
      value: dbStats.totalCompanies,
      trend: '+6%',
      trendUp: true,
      cardBg: '#D1F4E8',
      circleBg: '#059669',
      icon: <FiBriefcase size={24} color="#FFFFFF" />,
    },
  ];

  // Latest Posts Data (Bottom Row)
  const latestPosts = [
    {
      title: 'Business Growth Offer',
      category: 'Promotion',
      author: 'Admin',
      publishedOn: '06 Oct 2026, 06:12 PM',
      status: 'Published',
    },
    {
      title: 'Business Growth Offer',
      category: 'Promotion',
      author: 'Admin',
      publishedOn: '06 Oct 2026, 06:12 PM',
      status: 'Published',
    },
    {
      title: 'Business Growth Offer',
      category: 'Promotion',
      author: 'Admin',
      publishedOn: '06 Oct 2026, 06:12 PM',
      status: 'Published',
    },
    {
      title: 'Business Growth Offer',
      category: 'Promotion',
      author: 'Admin',
      publishedOn: '06 Oct 2026, 06:12 PM',
      status: 'Published',
    },
  ];

  // Recent Event Activities Data (Bottom Row)
  const recentEventActivities = [
    { name: 'Network Meet 2026', date: '10 Oct 2026', status: 'Upcoming' },
    { name: 'Leadership Training', date: '15 Oct 2026', status: 'Upcoming' },
    { name: 'Webinar Digital Growth', date: '20 Oct 2026', status: 'Upcoming' },
    { name: 'Product Launch Event', date: '25 Oct 2026', status: 'Upcoming' },
  ];

  return (
    <div className="adm-page">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="adm-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ───────────────── TOP HEADER (100% full width, identical to AdminDashboard) ───────────────── */}
      <header className="ud-topbar">
        {/* Brand / Logo section aligned with sidebar width */}
        <div className="ud-topbar-left">
          <button
            type="button"
            className="ud-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Admin Sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="ud-brand-logo-card">
            <Link to="/admin" className="ud-brand-logo">
              <img src={logoIconImg} alt="Fortaa" className="ud-logo-icon" />
              <div className="ud-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="ud-logo-word" />
                <span className="ud-logo-tagline" style={{ fontWeight: 700, color: '#6326AE' }}>
                  Admin Panel
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Search bar matching Figma & UserHeader */}
        <div className="ud-search-wrapper">
          <img src={searchIconPurple} alt="Search" className="ud-search-icon-img" />
          <input
            type="text"
            className="ud-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, posts, companies, products, opportunities..."
          />
        </div>

        {/* Right Action Icons & Profile Pill */}
        <div className="ud-topbar-right">
          {/* Notification Bell */}
          <button
            type="button"
            className="ud-icon-circle-btn"
            title="Notifications"
          >
            <img src={bellIconImg} alt="Notifications" className="ud-header-action-icon" />
            <span className="ud-badge-count">3</span>
          </button>

          {/* Chat / Messages Icon */}
          <button
            type="button"
            className="ud-icon-circle-btn"
            title="Support Messages"
            onClick={() => setSupportChatOpen(true)}
          >
            <img src={messageIconImg} alt="Messages" className="ud-header-action-icon" />
            {unreadSupportCount > 0 && (
              <span className="ud-badge-count">{unreadSupportCount}</span>
            )}
          </button>

          {/* Profile Pill with Dropdown */}
          <div className="ud-user-pill-wrap" ref={profileDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="ud-user-pill"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Admin Profile"
            >
              <img src={adminAvatar} alt="Admin" className="ud-user-pill-avatar" />
              <div className="ud-user-pill-info">
                <span className="ud-user-pill-name">{adminName}</span>
                <span className="ud-user-pill-role">{adminRole}</span>
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="ud-profile-dropdown">
                <div className="ud-profile-dropdown-user-block">
                  <img src={adminAvatar} alt="" className="ud-profile-dropdown-avatar" />
                  <div className="ud-profile-dropdown-meta">
                    <span className="ud-profile-dropdown-name">{adminName}</span>
                    <span className="ud-profile-dropdown-role">{adminRole}</span>
                    <span className="ud-profile-dropdown-email">{adminInfo.email || 'admin@fortaa.com'}</span>
                  </div>
                </div>
                <div className="ud-profile-dropdown-divider" />
                <button
                  type="button"
                  className="ud-profile-dropdown-btn"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    window.location.href = '/dashboard';
                  }}
                >
                  <span className="ud-dropdown-icon">🏠</span>
                  <span>User Website</span>
                </button>
                <button
                  type="button"
                  className="ud-profile-dropdown-btn logout-btn"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    localStorage.removeItem('fortaa_admin');
                    localStorage.removeItem('fortaa_admin_token');
                    window.location.href = '/admin/login';
                  }}
                >
                  <span className="ud-dropdown-icon"><FiLogOut size={16} /></span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ───────────────── MAIN WRAPPER (SIDEBAR + CONTENT) ───────────────── */}
      <div className="adm-main-wrapper">
        {/* ───────────────── LEFT SIDEBAR (Width 265px, matching AdminDashboard) ───────────────── */}
        <aside className={`adm-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="adm-nav">
            {/* 1. Dashboard */}
            <Link
              to="/admin"
              className="adm-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="adm-nav-icon"><FiHome size={18} /></span>
              <span className="adm-nav-label">Dashboard</span>
            </Link>

            {/* 2. Website Management */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('website')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiGlobe size={16} /></span>
                  <span className="adm-nav-label">Website Management</span>
                </div>
                <span className={`adm-chevron ${openSections.website ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.website && (
                <div className="adm-nav-sublist">
                  <a href="#pages" className="adm-nav-sublink"><span className="adm-sub-dot" /> Pages</a>
                  <a href="#sections" className="adm-nav-sublink"><span className="adm-sub-dot" /> Sections</a>
                  <a href="#banners" className="adm-nav-sublink"><span className="adm-sub-dot" /> Banners</a>
                  <a href="#menus" className="adm-nav-sublink"><span className="adm-sub-dot" /> Menus</a>
                </div>
              )}
            </div>

            {/* 3. Company Management */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('company')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiBriefcase size={16} /></span>
                  <span className="adm-nav-label">Company Management</span>
                </div>
                <span className={`adm-chevron ${openSections.company ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.company && (
                <div className="adm-nav-sublist">
                  <a href="#companies" className="adm-nav-sublink"><FiBriefcase size={14} className="adm-sub-icon" /> Companies</a>
                  <a href="#categories" className="adm-nav-sublink"><FiLayers size={14} className="adm-sub-icon" /> Categories</a>
                  <a href="#leaders" className="adm-nav-sublink"><FiUsers size={14} className="adm-sub-icon" /> Leaders</a>
                  <a href="#products" className="adm-nav-sublink"><FiPackage size={14} className="adm-sub-icon" /> Products</a>
                  <a href="#opportunities" className="adm-nav-sublink"><FiTrendingUp size={14} className="adm-sub-icon" /> Opportunities</a>
                </div>
              )}
            </div>

            {/* 4. Content Management */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('content')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiFileText size={16} /></span>
                  <span className="adm-nav-label">Content Management</span>
                </div>
                <span className={`adm-chevron ${openSections.content ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.content && (
                <div className="adm-nav-sublist">
                  <a href="#news" className="adm-nav-sublink"><FiFileText size={14} className="adm-sub-icon" /> News</a>
                  <a href="#events" className="adm-nav-sublink"><FiCalendar size={14} className="adm-sub-icon" /> Events</a>
                  <a href="#promotions" className="adm-nav-sublink"><FiTag size={14} className="adm-sub-icon" /> Promotions</a>
                </div>
              )}
            </div>

            {/* 5. User Management (Active Group on this page) */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('user')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiUser size={16} /></span>
                  <span className="adm-nav-label">User Management</span>
                </div>
                <span className={`adm-chevron ${openSections.user ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.user && (
                <div className="adm-nav-sublist">
                  <Link to="/admin/users" className="adm-nav-sublink active">
                    <FiUser size={14} className="adm-sub-icon" /> User
                  </Link>
                  <button
                    type="button"
                    className="adm-nav-sublink"
                    onClick={() => {
                      setAccountTypesModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <FiLayers size={14} className="adm-sub-icon" /> Account Types
                  </button>
                  <a href="#roles" className="adm-nav-sublink">
                    <FiShield size={14} className="adm-sub-icon" /> Roles &amp; Permission
                  </a>
                </div>
              )}
            </div>

            {/* 6. Marketing */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('marketing')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiTarget size={16} /></span>
                  <span className="adm-nav-label">Marketing</span>
                </div>
                <span className={`adm-chevron ${openSections.marketing ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.marketing && (
                <div className="adm-nav-sublist">
                  <a href="#leads" className="adm-nav-sublink"><FiUsers size={14} className="adm-sub-icon" /> Leads</a>
                  <a href="#campaign" className="adm-nav-sublink"><FiVolume2 size={14} className="adm-sub-icon" /> Campaign</a>
                  <a href="#templates" className="adm-nav-sublink"><FiMail size={14} className="adm-sub-icon" /> Email Templates</a>
                </div>
              )}
            </div>

            {/* 7. Settings */}
            <div className="adm-nav-group">
              <button
                type="button"
                className="adm-nav-group-header"
                onClick={() => toggleSection('settings')}
              >
                <div className="adm-nav-gh-left">
                  <span className="adm-nav-icon"><FiSettings size={16} /></span>
                  <span className="adm-nav-label">Settings</span>
                </div>
                <span className={`adm-chevron ${openSections.settings ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.settings && (
                <div className="adm-nav-sublist">
                  <a href="#gen-settings" className="adm-nav-sublink"><FiSettings size={14} className="adm-sub-icon" /> General Settings</a>
                  <a href="#seo" className="adm-nav-sublink"><FiSearch size={14} className="adm-sub-icon" /> SEO Settings</a>
                  <a href="#logs" className="adm-nav-sublink"><FiList size={14} className="adm-sub-icon" /> System Logs</a>
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Sidebar Fortaa Brand Card (Figma: 146x36px, radius 5px) */}
          <div className="adm-sidebar-bottom-card">
            <Link to="/admin" className="adm-s-bottom-link">
              <img src={logoIconImg} alt="Fortaa" className="adm-s-bottom-icon" />
              <div className="adm-s-bottom-col">
                <img src={logoTextImg} alt="FORTAA" className="adm-s-bottom-word" />
                <span className="adm-s-bottom-tagline">Discover, easy and Grow</span>
              </div>
            </Link>
          </div>
        </aside>

        {/* ── DASHBOARD BODY CONTENT ── */}
        <main className="adm-content aud-content-body">
          {/* Title & Actions Row */}
          <div className="adm-page-title-row aud-title-row">
            <div>
              <h1 className="adm-title">User Dashboard</h1>
              <p className="adm-subtitle">Welcome back, Admin! here's what's happening on your platform today.</p>
            </div>
            <div className="aud-title-actions">
              <div className="adm-date-badge aud-date-badge">
                <FiCalendar size={13} style={{ color: '#475569' }} />
                <span>October 6, 2026 &nbsp;|&nbsp; Last updated: 06:42 PM</span>
              </div>
              <Link to="/" className="aud-btn-view-website">
                View Website <FiExternalLink size={12} style={{ marginLeft: 4 }} />
              </Link>
            </div>
          </div>

          {/* ── ROW 1: 5 STAT CARDS (Figma Frame 151) ── */}
          <div className="aud-stats-5-row">
            {statCardsData.map((card, idx) => (
              <div
                key={idx}
                className="aud-stat-card-f151"
                style={{ backgroundColor: card.cardBg }}
              >
                {/* Left: Circular icon (Frame 152: 55x55, radius 50px) */}
                <div
                  className="aud-stat-icon-circle-f152"
                  style={{ backgroundColor: card.circleBg }}
                >
                  {card.icon}
                </div>

                {/* Right: Info Col */}
                <div className="aud-stat-info-f151">
                  <span className="aud-stat-title-f151">{card.title}</span>
                  <div className="aud-stat-number-f151">{card.value}</div>
                  <div className="aud-stat-trend-f151">
                    <span className={card.trendUp ? 'trend-up-green' : 'trend-down-red'}>
                      {card.trendUp ? '↑ ' : '↓ '}
                      {card.trend}
                    </span>
                  </div>
                  <span className="aud-stat-vs-f151">vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 2: USER REGISTRATION OVERVIEW (Frame 156) & USER DISTRIBUTION (Frame 130) ── */}
          <div className="aud-charts-row">
            {/* Left: User Registration Overview Area Chart (Frame 156) */}
            <div className="aud-card-f156">
              <div className="aud-f156-header">
                <h3 className="aud-f156-title">User Registration Overview</h3>
                <div className="aud-f156-dropdown-pill">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="aud-f156-select"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 3 Month">Last 3 Month</option>
                  </select>
                  <FiChevronDown size={14} color="#232356" className="aud-f156-chevron-icon" />
                </div>
              </div>

              {/* Chart Graphic Area */}
              <div className="aud-f156-chart-area">
                <div className="aud-f156-y-axis">
                  <span>2.5k</span>
                  <span>2K</span>
                  <span>1.5K</span>
                  <span>1K</span>
                  <span>500</span>
                  <span>0</span>
                </div>

                <div className="aud-f156-svg-container">
                  <svg viewBox="0 0 650 190" className="aud-f156-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="userRegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="30.92%" stopColor="#FFFFFF" stopOpacity="0.5" />
                        <stop offset="75.32%" stopColor="#C875DC" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="10" x2="650" y2="10" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="0" y1="45" x2="650" y2="45" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="0" y1="80" x2="650" y2="80" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="0" y1="115" x2="650" y2="115" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="0" y1="150" x2="650" y2="150" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="0" y1="180" x2="650" y2="180" stroke="#CBD5E1" strokeWidth="1" />

                    {/* Vertical grid lines */}
                    <line x1="25" y1="10" x2="25" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="125" y1="10" x2="125" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="225" y1="10" x2="225" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="325" y1="10" x2="325" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="425" y1="10" x2="425" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="525" y1="10" x2="525" y2="180" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="625" y1="10" x2="625" y2="180" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Area fill */}
                    <path
                      d="M 25,150 
                         C 75,130 95,120 125,115 
                         C 160,110 195,65 225,75 
                         C 260,85 295,110 325,100 
                         C 365,90 395,75 425,70 
                         C 465,60 495,45 525,40 
                         C 565,35 595,25 625,20 
                         L 625,180 L 25,180 Z"
                      fill="url(#userRegGrad)"
                    />

                    {/* Curve stroke: #9E04C3 */}
                    <path
                      d="M 25,150 
                         C 75,130 95,120 125,115 
                         C 160,110 195,65 225,75 
                         C 260,85 295,110 325,100 
                         C 365,90 395,75 425,70 
                         C 465,60 495,45 525,40 
                         C 565,35 595,25 625,20"
                      fill="none"
                      stroke="#9E04C3"
                      strokeWidth="2.5"
                    />

                    {/* Data Dots (8x8 #9E04C3) */}
                    <circle cx="25" cy="150" r="4" fill="#9E04C3" />
                    <circle cx="125" cy="115" r="4" fill="#9E04C3" />
                    <circle cx="225" cy="75" r="4" fill="#9E04C3" />
                    <circle cx="325" cy="100" r="4" fill="#9E04C3" />
                    <circle cx="425" cy="70" r="4" fill="#9E04C3" />
                    <circle cx="525" cy="40" r="4" fill="#9E04C3" />
                    <circle cx="625" cy="20" r="4" fill="#9E04C3" />
                  </svg>

                  {/* X Axis labels */}
                  <div className="aud-f156-x-axis">
                    <span>Sep 30</span>
                    <span>Oct 01</span>
                    <span>Oct 02</span>
                    <span>Oct 03</span>
                    <span>Oct 04</span>
                    <span>Oct 05</span>
                    <span>Oct 06</span>
                  </div>
                </div>
              </div>

              {/* Legend Row at bottom (Frame 29, 174, 175, 176) */}
              <div className="aud-f156-legend">
                <div className="aud-f156-leg-item">
                  <span className="aud-f156-leg-dot" style={{ backgroundColor: '#9E04C3' }}></span>
                  <span className="aud-f156-leg-text">Total Registration</span>
                </div>
                <div className="aud-f156-leg-item">
                  <span className="aud-f156-leg-dot" style={{ backgroundColor: '#03B44D' }}></span>
                  <span className="aud-f156-leg-text">Approved</span>
                </div>
                <div className="aud-f156-leg-item">
                  <span className="aud-f156-leg-dot" style={{ backgroundColor: '#F0D04F' }}></span>
                  <span className="aud-f156-leg-text">Pending</span>
                </div>
                <div className="aud-f156-leg-item">
                  <span className="aud-f156-leg-dot" style={{ backgroundColor: '#F4373A' }}></span>
                  <span className="aud-f156-leg-text">Rejected</span>
                </div>
              </div>
            </div>

            {/* Right: User Distribution Donut Chart (Frame 130) — View All button removed, spacious layout */}
            <div className="aud-card-f130">
              <div className="aud-f130-header">
                <h3 className="aud-f130-title">User Distribution</h3>
              </div>

              <div className="aud-f130-body">
                {/* SVG Donut Ring */}
                <div className="aud-f130-donut-wrap">
                  <svg viewBox="0 0 140 140" className="aud-f130-donut-svg">
                    {/* Background Ring */}
                    <circle cx="70" cy="70" r="48" fill="none" stroke="#F1F5F9" strokeWidth="18" />

                    {/* Segment 1: Blue (Business Partner 46%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#3D8AFB" strokeWidth="18"
                      strokeDasharray="138 301" strokeDashoffset="0"
                    />
                    {/* Segment 2: Green (Customers 28%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#5ACD9C" strokeWidth="18"
                      strokeDasharray="84 301" strokeDashoffset="-138"
                    />
                    {/* Segment 3: Purple (Leaders 18%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#954FF0" strokeWidth="18"
                      strokeDasharray="54 301" strokeDashoffset="-222"
                    />
                    {/* Segment 4: Orange/Yellow (Leaders 8%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#FBB840" strokeWidth="18"
                      strokeDasharray="25 301" strokeDashoffset="-276"
                    />
                  </svg>
                  <div className="aud-f130-center-text">
                    <span className="aud-f130-center-val">24,893</span>
                    <span className="aud-f130-center-sub">Total Users</span>
                  </div>
                </div>

                {/* Donut Legend (Frame 29, 36, 37, 38) */}
                <div className="aud-f130-legend">
                  <div className="aud-f130-leg-row">
                    <span className="aud-f130-leg-dot" style={{ backgroundColor: '#954FF0' }}></span>
                    <span className="aud-f130-leg-name">Leaders</span>
                    <span className="aud-f130-leg-pct">18%</span>
                    <span className="aud-f130-leg-count">4,473</span>
                  </div>
                  <div className="aud-f130-leg-row">
                    <span className="aud-f130-leg-dot" style={{ backgroundColor: '#3D8AFB' }}></span>
                    <span className="aud-f130-leg-name">Business Partner</span>
                    <span className="aud-f130-leg-pct">46%</span>
                    <span className="aud-f130-leg-count">11,445</span>
                  </div>
                  <div className="aud-f130-leg-row">
                    <span className="aud-f130-leg-dot" style={{ backgroundColor: '#5ACD9C' }}></span>
                    <span className="aud-f130-leg-name">Customers</span>
                    <span className="aud-f130-leg-pct">28%</span>
                    <span className="aud-f130-leg-count">6,955</span>
                  </div>
                  <div className="aud-f130-leg-row">
                    <span className="aud-f130-leg-dot" style={{ backgroundColor: '#FBB840' }}></span>
                    <span className="aud-f130-leg-name">Leaders</span>
                    <span className="aud-f130-leg-pct">8%</span>
                    <span className="aud-f130-leg-count">2,020</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 3: RECENT REGISTERED USERS TABLE (Strictly 6 Users, Frame 175) ── */}
          <div className="aud-card-f175">
            <div className="aud-f175-header">
              <div className="aud-f175-title-wrap">
                <h3 className="aud-f175-title">Recent Registered Users</h3>
              </div>
              <button
                type="button"
                className="aud-btn-view-all-pill"
                onClick={() => setShowAllUsersModal(true)}
              >
                View All →
              </button>
            </div>

            <div className="aud-f175-table-wrap">
              <table className="aud-f175-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Registered On</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user, idx) => {
                    const statusClass =
                      user.status === 'Approved'
                        ? 'status-approved'
                        : user.status === 'Pending'
                        ? 'status-pending'
                        : 'status-followup';

                    return (
                      <tr key={user.id || idx} className="aud-f175-row">
                        <td className="aud-td-num">{idx + 1}</td>
                        <td className="aud-td-name">
                          <span className="aud-f175-name">{user.name}</span>
                        </td>
                        <td className="aud-td-email">{user.email}</td>
                        <td className="aud-td-phone">{user.phone}</td>
                        <td className="aud-td-type">{user.type}</td>
                        <td>
                          <span className={`aud-f175-badge ${statusClass}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="aud-td-date">{user.registeredOn}</td>
                        <td className="aud-td-actions">
                          <div className="aud-action-icons-wrap">
                            <button type="button" className="aud-action-btn" title="View Details">
                              <FiEye size={16} />
                            </button>
                            <button type="button" className="aud-action-btn" title="Edit User">
                              <FiEdit size={16} />
                            </button>
                            <button type="button" className="aud-action-btn" title="More Options">
                              <FiMoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ROW 4: 3-COLUMN BOTTOM GRID (Latest Posts, Recent Activities, Platform Statistics) ── */}
          <div className="aud-row-bottom-grid">
            {/* 1. Latest Posts (Frame 176) */}
            <div className="aud-card aud-mini-grid-card aud-card-f176">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Latest Posts</h4>
                <a href="#posts" className="aud-btn-view-all-pill">View All →</a>
              </div>
              <div className="aud-table-wrap">
                <table className="aud-bottom-table aud-capsule-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Published On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestPosts.map((post, i) => (
                      <tr key={i} className="aud-b-capsule-row">
                        <td className="aud-td-title">{post.title}</td>
                        <td className="aud-td-sub">{post.category}</td>
                        <td className="aud-td-sub">{post.author}</td>
                        <td className="aud-td-sub">{post.publishedOn}</td>
                        <td>
                          <span className="aud-badge-published">Published</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Recent Activities (Frame 177) */}
            <div className="aud-card aud-mini-grid-card aud-card-f177">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Recent Activities</h4>
                <a href="#events" className="aud-btn-view-all-pill">View All →</a>
              </div>
              <div className="aud-table-wrap">
                <table className="aud-bottom-table aud-capsule-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEventActivities.map((ev, i) => (
                      <tr key={i} className="aud-b-capsule-row">
                        <td className="aud-td-title">{ev.name}</td>
                        <td className="aud-td-sub">{ev.date}</td>
                        <td>
                          <span className="aud-badge-upcoming">Upcoming</span>
                        </td>
                        <td className="aud-td-actions">
                          <div className="aud-action-icons-wrap">
                            <button type="button" className="aud-action-btn" title="View">
                              <FiEye size={14} color="#232356" />
                            </button>
                            <button type="button" className="aud-action-btn" title="Edit">
                              <FiEdit size={14} color="#232356" />
                            </button>
                            <button type="button" className="aud-action-btn" title="More">
                              <FiMoreVertical size={14} color="#232356" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Platform Statistics (Frame 163) */}
            <div className="aud-card aud-platform-stats-bottom-card aud-card-f163">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Platform Statistics</h4>
              </div>
              <div className="aud-ps-bottom-grid">
                {/* Website Visitors */}
                <div className="aud-ps-b-item">
                  <div className="aud-ps-b-icon-wrap" style={{ background: '#F2F0F7' }}>
                    <FiUsers size={18} color="#6326AE" />
                  </div>
                  <div className="aud-ps-b-meta">
                    <span className="aud-ps-b-label">Website Visitors</span>
                    <div className="aud-ps-b-val-row">
                      <span className="aud-ps-b-val">48,762</span>
                      <span className="aud-ps-b-trend">↑ +18%</span>
                    </div>
                  </div>
                </div>

                {/* Total Page Views */}
                <div className="aud-ps-b-item">
                  <div className="aud-ps-b-icon-wrap" style={{ background: '#D8EFFD' }}>
                    <FiEye size={18} color="#00A6F4" />
                  </div>
                  <div className="aud-ps-b-meta">
                    <span className="aud-ps-b-label">Total Page Views</span>
                    <div className="aud-ps-b-val-row">
                      <span className="aud-ps-b-val">2, 36, 842</span>
                      <span className="aud-ps-b-trend">↑ +22%</span>
                    </div>
                  </div>
                </div>

                {/* Active Campaign */}
                <div className="aud-ps-b-item">
                  <div className="aud-ps-b-icon-wrap" style={{ background: '#FCEFD9' }}>
                    <FiTarget size={18} color="#F59E0B" />
                  </div>
                  <div className="aud-ps-b-meta">
                    <span className="aud-ps-b-label">Active Campaign</span>
                    <div className="aud-ps-b-val-row">
                      <span className="aud-ps-b-val">12</span>
                      <span className="aud-ps-b-trend">↑ +2%</span>
                    </div>
                  </div>
                </div>

                {/* Storage Used */}
                <div className="aud-ps-b-item">
                  <div className="aud-ps-b-icon-wrap" style={{ background: '#F3EEF3' }}>
                    <FiLayers size={18} color="#8637EF" />
                  </div>
                  <div className="aud-ps-b-meta">
                    <span className="aud-ps-b-label">Storage Used</span>
                    <div className="aud-ps-b-val-row">
                      <span className="aud-ps-b-val">48,762</span>
                      <span className="aud-ps-b-trend">↑ +18%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ───────────────── ALL USERS POPUP MODAL ───────────────── */}
      {showAllUsersModal && (
        <div className="aud-modal-overlay" onClick={() => setShowAllUsersModal(false)}>
          <div className="aud-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="aud-modal-header">
              <div className="aud-modal-header-left">
                <h3 className="aud-modal-title">All Registered Users</h3>
                <span className="aud-modal-count-badge">{allUsersList.length} Total Users</span>
              </div>
              <div className="aud-modal-header-right">
                <div className="aud-modal-search-wrap">
                  <FiSearch size={14} color="#64748B" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search user name, email, phone..."
                    className="aud-modal-search-input"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  className="aud-modal-close-btn"
                  onClick={() => setShowAllUsersModal(false)}
                  title="Close Modal"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="aud-modal-body">
              <table className="aud-f175-table aud-modal-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Registered On</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModalUsers.length > 0 ? (
                    filteredModalUsers.map((user, idx) => {
                      const statusClass =
                        user.status === 'Approved'
                          ? 'status-approved'
                          : user.status === 'Pending'
                          ? 'status-pending'
                          : 'status-followup';

                      return (
                        <tr key={user.id || idx} className="aud-f175-row">
                          <td className="aud-td-num">{idx + 1}</td>
                          <td className="aud-td-name">
                            <span className="aud-f175-name">{user.name}</span>
                          </td>
                          <td className="aud-td-email">{user.email}</td>
                          <td className="aud-td-phone">{user.phone}</td>
                          <td className="aud-td-type">{user.type}</td>
                          <td>
                            <span className={`aud-f175-badge ${statusClass}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="aud-td-date">{user.registeredOn}</td>
                          <td className="aud-td-actions">
                            <div className="aud-action-icons-wrap">
                              <button type="button" className="aud-action-btn" title="View Details">
                                <FiEye size={16} />
                              </button>
                              <button type="button" className="aud-action-btn" title="Edit User">
                                <FiEdit size={16} />
                              </button>
                              <button type="button" className="aud-action-btn" title="More Options">
                                <FiMoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                        No users match "{modalSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Support & Messages Chat Modal */}
      <AdminSupportChatModal
        isOpen={supportChatOpen}
        onClose={() => setSupportChatOpen(false)}
        onUpdated={loadUnreadSupport}
      />

      {/* Admin Signup Account Types Manager Modal */}
      <AdminAccountTypesModal
        isOpen={accountTypesModalOpen}
        onClose={() => setAccountTypesModalOpen(false)}
      />
    </div>
  );
}
