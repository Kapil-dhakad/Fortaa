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
  FiBarChart2,
  FiTarget,
  FiVolume2,
  FiMail,
  FiSearch,
  FiList,
  FiEye,
  FiMousePointer,
  FiPercent,
  FiHelpCircle,
  FiExternalLink,
  FiLayers,
  FiActivity,
} from 'react-icons/fi';
import '../../components/layout/UserNavigation.css';
import './AdminDashboard.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';

// Uploaded Assets
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import adminPromoMegaphone from '../../assets/dashboard/admin_promo_megaphone.png';
import adminPromoBars from '../../assets/dashboard/admin_promo_bars.png';
import companyAmway from '../../assets/figma/company_amway.png';
import companyHerbalife from '../../assets/figma/company_herbalife.png';
import companyOriflame from '../../assets/figma/company_oriflame.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';

// Admin Service
import {
  fetchAdminStats,
  fetchAdminRecentActivities,
  fetchAdminLatestUsers,
  fetchAdminTopCategories,
  fetchAdminLatestCompanies,
  fetchAdminRecentEvents,
  fetchAdminPlatformStats,
} from '../../services/admin.service';
import AdminSupportChatModal from '../../components/admin/AdminSupportChatModal';
import AdminAccountTypesModal from '../../components/admin/AdminAccountTypesModal';
import { fetchUnreadSupportCount } from '../../services/support.service';

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [trafficTimeframe, setTrafficTimeframe] = useState('Last 7 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real Database States
  const [_loading, setLoading] = useState(true);
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

  const [dbStats, setDbStats] = useState({
    totalUsers: 24892,
    totalCompanies: 156,
    totalProducts: 482,
    totalEvents: 38,
    newUsersThisMonth: 12,
  });
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [latestUsers, setLatestUsers] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalPageViews: '1,24,568',
    totalClicks: '1,24,568',
    conversionRate: '4.8%',
    activeUsers: '18,642',
  });

  // Collapsible sidebar accordion states
  const [openSections, setOpenSections] = useState({
    website: true,
    company: true,
    content: true,
    user: true,
    marketing: true,
    settings: true,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Load real data from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAllAdminData() {
      try {
        setLoading(true);
        const [
          statsRes,
          actRes,
          usersRes,
          catsRes,
          compsRes,
          evtsRes,
          platRes,
        ] = await Promise.all([
          fetchAdminStats(),
          fetchAdminRecentActivities(),
          fetchAdminLatestUsers(),
          fetchAdminTopCategories(),
          fetchAdminLatestCompanies(),
          fetchAdminRecentEvents(),
          fetchAdminPlatformStats(),
        ]);

        loadUnreadSupport();

        if (!isMounted) return;

        // 1. Dashboard Stats
        if (statsRes?.success && statsRes?.stats) {
          setDbStats((prev) => ({
            ...prev,
            ...statsRes.stats,
          }));
        }

        // 2. Activities
        if (actRes?.success && Array.isArray(actRes.activities) && actRes.activities.length > 0) {
          setActivities(actRes.activities);
        } else {
          // Default fallback activities if brand new db
          setActivities([
            {
              icon: '👤',
              title: 'New user registered',
              desc: 'Rahul Sharma joined as Member',
              timeAgo: '2 min ago',
              color: '#8B5CF6',
            },
            {
              icon: '🏢',
              title: 'New company added',
              desc: 'Digital Marketing Solutions',
              timeAgo: '12 min ago',
              color: '#EC4899',
            },
            {
              icon: '📅',
              title: 'Event updated',
              desc: 'Business Growth Workshop',
              timeAgo: '26 min ago',
              color: '#10B981',
            },
            {
              icon: '📦',
              title: 'New product added',
              desc: 'Leadership program',
              timeAgo: '45 min ago',
              color: '#F59E0B',
            },
            {
              icon: '🖼️',
              title: 'Banner updated',
              desc: 'Homepage Banner #3',
              timeAgo: '1 hour ago',
              color: '#EF4444',
            },
            {
              icon: '📰',
              title: 'News published',
              desc: 'Industry Growth News',
              timeAgo: '2 hour ago',
              color: '#3B82F6',
            },
            {
              icon: '👤',
              title: 'New lead received',
              desc: 'Priya Verma',
              timeAgo: '3 hour ago',
              color: '#10B981',
            },
          ]);
        }

        // 3. Categories
        if (catsRes?.success && Array.isArray(catsRes.categories) && catsRes.categories.length > 0) {
          setCategories(catsRes.categories);
        } else {
          setCategories([
            { id: 1, name: 'Herbal & wellness', icon: '💖', count: 48, status: 'Active' },
            { id: 2, name: 'Business Opportunity', icon: '💼', count: 72, status: 'Active' },
            { id: 3, name: 'Leadership', icon: '👔', count: 36, status: 'Active' },
            { id: 4, name: 'Product Training', icon: '📦', count: 28, status: 'Active' },
            { id: 5, name: 'Marketing Tools', icon: '📢', count: 42, status: 'Active' },
            { id: 6, name: 'Lifestyle', icon: '⭐', count: 18, status: 'Active' },
          ]);
        }

        // 4. Latest Companies
        if (compsRes?.success && Array.isArray(compsRes.companies) && compsRes.companies.length > 0) {
          setCompanies(compsRes.companies);
        } else {
          setCompanies([
            { id: 1, name: 'Fortaa Wellness', category: 'Health & Wellness', status: 'Active', logo: logoIconImg },
            { id: 2, name: 'Amway Lifestyle', category: 'Lifestyle', status: 'Active', logo: companyAmway },
            { id: 3, name: 'Oriflame Personal...', category: 'Beauty & Care', status: 'Active', logo: companyOriflame },
            { id: 4, name: 'Herbalife Nutrition', category: 'Nutrition', status: 'Active', logo: companyHerbalife },
            { id: 5, name: 'Digital Marketing Pro', category: 'Marketing Tools', status: 'Active', logo: logoIconImg },
            { id: 6, name: 'Tata Business', category: 'Business Opportunity', status: 'Active', logo: logoIconImg },
          ]);
        }

        // 5. Recent Events
        if (evtsRes?.success && Array.isArray(evtsRes.events) && evtsRes.events.length > 0) {
          setEvents(evtsRes.events);
        } else {
          setEvents([
            { id: 1, name: 'Business Growth Workshop', date: '28 May 2025', status: 'Live', type: 'live' },
            { id: 2, name: 'Leadership Seminar', date: '02 jun 2025', status: 'Upcoming', type: 'upcoming' },
            { id: 3, name: 'Network Marketing Seminar', date: '15 jun 2025', status: 'Upcoming', type: 'upcoming' },
            { id: 4, name: 'Product Training Webinar', date: '22 jun 2025', status: 'Upcoming', type: 'upcoming' },
            { id: 5, name: 'Success Stories Meeting', date: '30 jun 2025', status: 'Upcoming', type: 'upcoming' },
          ]);
        }

        // 6. Latest Users / Leads
        if (usersRes?.success && Array.isArray(usersRes.users) && usersRes.users.length > 0) {
          setLatestUsers(usersRes.users);
        } else {
          setLatestUsers([
            {
              id: 1,
              name: 'Neha Verma',
              email: 'neha@gmail.com',
              mobile_number: '+91 9095832210',
              source: 'Website',
              status: 'New',
              statusClass: 'status-new',
              date: '28 May 2025',
            },
            {
              id: 2,
              name: 'Amit Kumar',
              email: 'amit@gmail.com',
              mobile_number: '+91 909758642',
              source: 'Facebook',
              status: 'Connected',
              statusClass: 'status-connected',
              date: '28 May 2025',
            },
            {
              id: 3,
              name: 'Sneha Patel',
              email: 'sneha@gmail.com',
              mobile_number: '+91 902564324',
              source: 'Instagram',
              status: 'New',
              statusClass: 'status-new',
              date: '28 May 2025',
            },
            {
              id: 4,
              name: 'Rohit Singh',
              email: 'rohit@gmail.com',
              mobile_number: '+91 90958364',
              source: 'Referral',
              status: 'Follow Up',
              statusClass: 'status-followup',
              date: '28 May 2025',
            },
            {
              id: 5,
              name: 'Pooja Sharma',
              email: 'pooja@gmail.com',
              mobile_number: '+91 909583263',
              source: 'Website',
              status: 'Connected',
              statusClass: 'status-connected',
              date: '28 May 2025',
            },
          ]);
        }

        // 7. Platform Statistics
        if (platRes?.success && platRes?.platformStats) {
          setPlatformStats((prev) => ({
            ...prev,
            ...platRes.platformStats,
          }));
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllAdminData();
    return () => {
      isMounted = false;
    };
  }, [loadUnreadSupport]);

  // Format numbers nicely
  const formatNum = (n) => {
    if (n === undefined || n === null) return '0';
    return Number(n).toLocaleString('en-IN');
  };

  // Top 4 Stat Cards from DB
  const statsCards = [
    {
      label: 'Total Users',
      value: formatNum(dbStats.totalUsers || 24892),
      trend: '↑ +12%',
      trendLabel: 'vs last month',
      icon: <FiUsers size={18} />,
    },
    {
      label: 'Total Companies',
      value: formatNum(dbStats.totalCompanies || 156),
      trend: '↑ +3%',
      trendLabel: 'vs last month',
      icon: <FiBriefcase size={18} />,
    },
    {
      label: 'Total Products',
      value: formatNum(dbStats.totalProducts || 482),
      trend: '↑ +6.1%',
      trendLabel: 'vs last month',
      icon: <FiPackage size={18} />,
    },
    {
      label: 'Total Events',
      value: formatNum(dbStats.totalEvents || 38),
      trend: '↑ +10.7%',
      trendLabel: 'vs last month',
      icon: <FiCalendar size={18} />,
    },
  ];

  // Profile Dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fortaa_admin');
    localStorage.removeItem('fortaa_admin_token');
    window.location.href = '/admin/login';
  };

  const renderActivityIcon = (icon) => {
    if (typeof icon !== 'string') return icon;
    if (icon.includes('user') || icon === '👤') return <FiUser size={15} />;
    if (icon.includes('comp') || icon === '🏢') return <FiBriefcase size={15} />;
    if (icon.includes('event') || icon === '📅') return <FiCalendar size={15} />;
    if (icon.includes('prod') || icon === '📦') return <FiPackage size={15} />;
    if (icon.includes('banner') || icon === '🖼️') return <FiLayers size={15} />;
    if (icon.includes('news') || icon === '📰') return <FiFileText size={15} />;
    if (icon.includes('lead') || icon === '🎯') return <FiTarget size={15} />;
    return <FiActivity size={15} />;
  };

  // Current formatted date
  const [currentDateTime] = useState(() => {
    const now = new Date();
    return {
      dateFormatted: now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      timeFormatted: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  });
  const { dateFormatted, timeFormatted } = currentDateTime;

  return (
    <div className="adm-page">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="ud-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ───────────────── TOP HEADER / NAVBAR (Exact UserHeader design, 100% width) ───────────────── */}
      <header className="ud-topbar">
        {/* Left Brand Capsule */}
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
                  className="ud-profile-dropdown-btn ud-dropdown-logout-btn"
                  onClick={handleLogout}
                >
                  <span className="ud-dropdown-logout-icon">
                    <FiLogOut size={14} />
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ───────────────── MAIN WRAPPER (SIDEBAR + CONTENT) ───────────────── */}
      <div className="adm-main-wrapper">
        {/* ───────────────── LEFT SIDEBAR (Matching UserSidebar style, with Admin naming & list) ───────────────── */}
        <aside className={`adm-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="adm-nav">
            {/* 1. Dashboard */}
            <button
              type="button"
              className={`adm-nav-item ${activeMenu === 'Dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('Dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <span className="adm-nav-icon"><FiHome size={18} /></span>
              <span className="adm-nav-label">Dashboard</span>
            </button>

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

            {/* 5. User Management */}
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
                  <Link to="/admin/users" className="adm-nav-sublink"><FiUser size={14} className="adm-sub-icon" /> User</Link>
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
                  <a href="#roles" className="adm-nav-sublink"><FiShield size={14} className="adm-sub-icon" /> Roles &amp; Permission</a>
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
                  <span className="adm-nav-icon"><FiBarChart2 size={16} /></span>
                  <span className="adm-nav-label">Marketing</span>
                </div>
                <span className={`adm-chevron ${openSections.marketing ? 'open' : ''}`}>
                  <FiChevronDown size={13} />
                </span>
              </button>
              {openSections.marketing && (
                <div className="adm-nav-sublist">
                  <a href="#leads" className="adm-nav-sublink"><FiTarget size={14} className="adm-sub-icon" /> Leads</a>
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
        <main className="adm-content">
          {/* Title & Live Date Row */}
          <div className="adm-page-title-row">
            <div>
              <h1 className="adm-title">Dashboard</h1>
              <p className="adm-subtitle">Welcome back, Admin! here's what's happening on your platform today.</p>
            </div>
            <div className="adm-date-badge">
              <FiCalendar size={13} style={{ color: '#475569' }} />
              <span className="adm-date-text">{dateFormatted} &nbsp; {timeFormatted}</span>
            </div>
          </div>

          {/* ── 2-COLUMN MAIN DASHBOARD GRID ── */}
          <div className="adm-dashboard-grid">
            {/* ═════════ LEFT / CENTER MAJOR COLUMN ═════════ */}
            <div className="adm-col-main">
              {/* Row 1: 4 Stat Cards (Figma Frame 151 layout) */}
              <div className="adm-stats-row">
                {statsCards.map((st, i) => (
                  <div key={i} className="adm-stat-card">
                    {/* Left: Big circular icon */}
                    <div className="adm-stat-icon-circle">
                      <span className="adm-stat-icon">{st.icon}</span>
                    </div>
                    {/* Right: label, value, trend, vs last month */}
                    <div className="adm-stat-body">
                      <span className="adm-stat-label">{st.label}</span>
                      <div className="adm-stat-number">{st.value}</div>
                      <div className="adm-stat-trend">
                        <span className="trend-arrow">↑</span>
                        <span className="trend-up">{st.trend.replace('↑ ', '')}</span>
                      </div>
                      <span className="adm-stat-vs">{st.trendLabel}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Website Traffic Overview Chart */}
              <div className="adm-card adm-traffic-card">
                <div className="adm-card-header">
                  <h3 className="adm-card-title">Website Traffic Overview</h3>
                  <div className="adm-pill-filters">
                    {['Last 7 Days', 'Last 30 Days', 'Last 3 Month'].map((tf) => (
                      <button
                        key={tf}
                        className={`adm-filter-btn ${trafficTimeframe === tf ? 'active' : ''}`}
                        onClick={() => setTrafficTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Traffic Area Chart */}
                <div className="adm-chart-wrap">
                  <div className="adm-chart-y-axis">
                    <span>10K</span>
                    <span>8K</span>
                    <span>6K</span>
                    <span>4K</span>
                    <span>2K</span>
                    <span>0</span>
                  </div>

                  <div className="adm-chart-svg-area">
                    {/* Tooltip over May 26 */}
                    <div className="adm-chart-tooltip" style={{ left: '55%', top: '22%' }}>
                      <span className="tooltip-date">May 26</span>
                      <span className="tooltip-val">Total Visitors: <strong>6,482</strong></span>
                    </div>

                    <svg viewBox="0 0 650 200" className="adm-svg-chart" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trafficGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#9F21FE" stopOpacity="0.35" />
                          <stop offset="50%" stopColor="#D51CFD" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="10" x2="650" y2="10" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="650" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="90" x2="650" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="130" x2="650" y2="130" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="170" x2="650" y2="170" stroke="#F1F5F9" strokeWidth="1" />

                      {/* Vertical grid lines */}
                      <line x1="30" y1="0" x2="30" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="130" y1="0" x2="130" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="230" y1="0" x2="230" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="330" y1="0" x2="330" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="430" y1="0" x2="430" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="530" y1="0" x2="530" y2="190" stroke="#F8FAFC" strokeWidth="1" />
                      <line x1="620" y1="0" x2="620" y2="190" stroke="#F8FAFC" strokeWidth="1" />

                      {/* Area Fill */}
                      <path
                        d="M 30,150 
                           C 80,140 100,120 130,125 
                           C 160,130 180,145 230,135 
                           C 280,125 300,70 330,65 
                           C 360,60 400,110 430,95 
                           C 480,80 500,60 530,55 
                           C 580,50 600,65 620,70 
                           L 620,190 L 30,190 Z"
                        fill="url(#trafficGrad)"
                      />

                      {/* Purple Curve Stroke */}
                      <path
                        d="M 30,150 
                           C 80,140 100,120 130,125 
                           C 160,130 180,145 230,135 
                           C 280,125 300,70 330,65 
                           C 360,60 400,110 430,95 
                           C 480,80 500,60 530,55 
                           C 580,50 600,65 620,70"
                        fill="none"
                        stroke="#8B21E0"
                        strokeWidth="2.5"
                      />

                      {/* Data Dots */}
                      <circle cx="30" cy="150" r="3.5" fill="#8B21E0" />
                      <circle cx="130" cy="125" r="3.5" fill="#8B21E0" />
                      <circle cx="230" cy="135" r="3.5" fill="#8B21E0" />
                      <circle cx="330" cy="65" r="4.5" fill="#8B21E0" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="430" cy="95" r="3.5" fill="#8B21E0" />
                      <circle cx="530" cy="55" r="3.5" fill="#8B21E0" />
                      <circle cx="620" cy="70" r="3.5" fill="#8B21E0" />
                    </svg>

                    {/* X-Axis Dates */}
                    <div className="adm-chart-x-axis">
                      <span>May 22</span>
                      <span>May 23</span>
                      <span>May 24</span>
                      <span>May 25</span>
                      <span>May 26</span>
                      <span>May 27</span>
                      <span>May 28</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: 3 Mini Tables Side-by-Side (Real Data from DB) */}
              <div className="adm-tables-tri-grid">
                {/* 1. Top Categories Table */}
                <div className="adm-card adm-mini-table-card">
                  <div className="adm-card-header">
                    <h4 className="adm-mini-title">Top Categories</h4>
                    <a href="#all-cats" className="adm-card-view-all">View All →</a>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-mini-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Category</th>
                          <th>Products</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c, idx) => (
                          <tr key={c.id || idx}>
                            <td className="adm-col-num">{idx + 1}</td>
                            <td className="adm-col-name">
                              <span className="adm-cat-icon">{c.icon || '🏷️'}</span>
                              <span className="adm-text-ellipsis">{c.name}</span>
                            </td>
                            <td className="adm-col-count">{c.count || 0}</td>
                            <td>
                              <span className="adm-badge-active">{c.status || 'Active'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Latest Companies Table */}
                <div className="adm-card adm-mini-table-card">
                  <div className="adm-card-header">
                    <h4 className="adm-mini-title">Latest Companies</h4>
                    <a href="#all-companies" className="adm-card-view-all">View All →</a>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-mini-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Category</th>
                          <th>Category</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.map((comp, idx) => (
                          <tr key={comp.id || idx}>
                            <td className="adm-col-num">{idx + 1}</td>
                            <td className="adm-col-name">
                              <img
                                src={comp.icon_url || comp.logo || logoIconImg}
                                alt=""
                                className="adm-mini-logo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = logoIconImg;
                                }}
                              />
                              <span className="adm-text-ellipsis">{comp.name}</span>
                            </td>
                            <td className="adm-col-sub">{comp.category || 'General'}</td>
                            <td>
                              <span className="adm-badge-active">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Recent Events Table */}
                <div className="adm-card adm-mini-table-card">
                  <div className="adm-card-header">
                    <h4 className="adm-mini-title">Recent Events</h4>
                    <a href="#all-events" className="adm-card-view-all">View All →</a>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-mini-table">
                      <thead>
                        <tr>
                          <th>Recent Events</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((ev, idx) => {
                          const evDate = ev.date && ev.month ? `${ev.date} ${ev.month}` : (ev.date || 'Upcoming');
                          const isLive = ev.type === 'Online' || ev.type === 'live' || ev.status === 'Live';
                          return (
                            <tr key={ev.id || idx}>
                              <td className="adm-col-name">
                                <span className="adm-event-thumb">📅</span>
                                <span className="adm-text-ellipsis">{ev.title || ev.name}</span>
                              </td>
                              <td className="adm-col-sub">{evDate}</td>
                              <td>
                                <span className={isLive ? 'adm-badge-live' : 'adm-badge-upcoming'}>
                                  {isLive ? 'Live' : 'Upcoming'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 4: Latest Companies / Registrations Detailed Table (Real Users from DB) */}
              <div className="adm-card adm-large-table-card">
                <div className="adm-card-header">
                  <h4 className="adm-card-title">Latest Companies</h4>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-full-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestUsers.map((row, idx) => {
                        const statusClass = row.statusClass || (idx % 2 === 0 ? 'status-connected' : 'status-new');
                        const statusText = row.status || (idx % 2 === 0 ? 'Connected' : 'New');
                        const userDate = row.created_at
                          ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : (row.date || '28 May 2025');

                        return (
                          <tr key={row.id || idx}>
                            <td className="adm-col-num">{idx + 1}</td>
                            <td className="adm-col-name">
                              <img
                                src={row.avatar_url || userAvatarImg}
                                alt=""
                                className="adm-table-avatar"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = userAvatarImg;
                                }}
                              />
                              <span className="adm-lead-name">{row.name}</span>
                            </td>
                            <td className="adm-col-email">{row.email}</td>
                            <td className="adm-col-phone">{row.mobile_number || '+91 9095832210'}</td>
                            <td className="adm-col-source">{row.source || 'Website'}</td>
                            <td>
                              <span className={`adm-pill-status ${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="adm-col-date">{userDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ═════════ RIGHT COLUMN (PROMO, ACTIVITIES, STATS, HELP) ═════════ */}
            <div className="adm-col-side">
              {/* Card 1: Build your Business Promo Banner */}
              <div className="adm-promo-banner">
                <div className="adm-promo-content">
                  <h3 className="adm-promo-title">Build your Business<br />Grow Together</h3>
                  <p className="adm-promo-desc">
                    Manage,promote and expand your network marketing platform with ease.
                  </p>
                  <Link to="/" className="adm-btn-view-website">
                    View Website <FiExternalLink size={12} style={{ marginLeft: 4 }} />
                  </Link>
                </div>
                <div className="adm-promo-art">
                  <img src={adminPromoBars} alt="" className="adm-promo-bars-img" />
                  <img src={adminPromoMegaphone} alt="" className="adm-promo-megaphone-img" />
                </div>
              </div>

              {/* Card 2: Recent Activities (Real from DB) */}
              <div className="adm-card adm-activities-card">
                <div className="adm-card-header">
                  <h3 className="adm-card-title">Recent Activities</h3>
                  <a href="#activities" className="adm-card-view-all">View All →</a>
                </div>
                <div className="adm-activities-list">
                  {activities.map((act, i) => (
                    <div key={i} className="adm-activity-item">
                      <div className="adm-activity-icon" style={{ color: act.color || '#8B5CF6' }}>
                        {renderActivityIcon(act.icon)}
                      </div>
                      <div className="adm-activity-details">
                        <span className="adm-activity-title">{act.title}</span>
                        <span className="adm-activity-sub">{act.desc}</span>
                      </div>
                      <span className="adm-activity-time">{act.timeAgo || act.time || 'recently'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Platform Statistics — Figma Frame 163 (purple outer, 2x2 white inner) */}
              <div className="adm-platform-stats-card">
                <div className="adm-platform-stats-header">
                  <h4 className="adm-platform-stats-title">Platform Statistics</h4>
                </div>
                <div className="adm-ps-grid">
                  {/* Total Page Views */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap"><FiEye size={18} /></div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Total Page Views</span>
                      <span className="adm-ps-val">{formatNum(platformStats.totalPageViews)}</span>
                      <span className="adm-ps-trend">↑ +15.2%</span>
                    </div>
                  </div>

                  {/* Total Clicks */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap"><FiMousePointer size={18} /></div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Total Clicks</span>
                      <span className="adm-ps-val">{formatNum(platformStats.totalClicks)}</span>
                      <span className="adm-ps-trend">↑ +15.2%</span>
                    </div>
                  </div>

                  {/* Common / Conversion Rate */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap"><FiPercent size={18} /></div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Common Rate</span>
                      <span className="adm-ps-val">{platformStats.conversionRate}</span>
                      <span className="adm-ps-trend">↑ +2.3%</span>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap"><FiUsers size={18} /></div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Active Users</span>
                      <span className="adm-ps-val">{formatNum(platformStats.activeUsers)}</span>
                      <span className="adm-ps-trend">↑ +9.7%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Need Help? */}
              <div className="adm-card adm-help-card">
                <div className="adm-help-top">
                  <FiHelpCircle size={24} className="adm-help-icon" style={{ color: '#2E0362' }} />
                  <div className="adm-help-info">
                    <h5 className="adm-help-title">Need Help?</h5>
                    <p className="adm-help-desc">Our support team is here to assist you 24/7.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="adm-btn-contact-support"
                  onClick={() => setSupportChatOpen(true)}
                >
                  Open Support Messages Desk
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

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
