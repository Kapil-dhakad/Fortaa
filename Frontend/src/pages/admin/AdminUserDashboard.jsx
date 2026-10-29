import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminUserDashboard.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';

export default function AdminUserDashboard() {
  const [activeSubItem, setActiveSubItem] = useState('Registered Users');
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStats, setDbStats] = useState({
    totalUsers: '24,892',
    approvedUsers: '21,568',
    pendingApprovals: '2,147',
    rejectedUsers: '178',
    totalCompanies: '342',
  });

  // Collapsible sidebar accordion states
  const [openSections, setOpenSections] = useState({
    userManagement: true,
    registerData: false,
    postManagement: false,
    promotion: false,
    eventManagement: false,
    messageManagement: false,
    groupManagement: false,
    resourceManagement: false,
    setting: false,
    reports: false,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // Fetch real users from PostgreSQL database on component mount
  useEffect(() => {
    fetchUsersFromDatabase();
  }, []);

  const fetchUsersFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/all');
      const data = await response.json();

      if (data.success && Array.isArray(data.users)) {
        setDbUsers(data.users);
      }

      // Also fetch dynamic stats
      const statsRes = await fetch('/api/users/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setDbStats({
          totalUsers: Number(statsData.stats.totalUsers).toLocaleString(),
          approvedUsers: Number(statsData.stats.approvedUsers).toLocaleString(),
          pendingApprovals: Number(statsData.stats.pendingApprovals).toLocaleString(),
          rejectedUsers: Number(statsData.stats.rejectedUsers).toLocaleString(),
          totalCompanies: Number(statsData.stats.totalCompanies).toLocaleString(),
        });
      }
    } catch (err) {
      console.warn('Backend API connection note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Base Figma fallback rows
  const figmaDemoUsers = [
    {
      id: 101,
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      phone: '+91 9095832210',
      type: 'Leader',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 102,
      name: 'Priya Verma',
      email: 'priya@gmail.com',
      phone: '+91 909758642',
      type: 'Business Partner',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 103,
      name: 'Amit Singh',
      email: 'amit@gmail.com',
      phone: '+91 902564324',
      type: 'Customer',
      status: 'Pending',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 104,
      name: 'Neha Gupta',
      email: 'neha@gmail.com',
      phone: '+91 90958364',
      type: 'Business Partner',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 105,
      name: 'Vikas Kumar',
      email: 'vikas@gmail.com',
      phone: '+91 909583263',
      type: 'Leader',
      status: 'Follow Up',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
    {
      id: 106,
      name: 'Sneha Rathi',
      email: 'sneha@gmail.com',
      phone: '+91 909583263',
      type: 'Customer',
      status: 'Approved',
      registeredOn: '06 Oct 2026, 06:12 PM',
    },
  ];

  // Merge PostgreSQL database users (e.g. shubham, niluuu, kapil) at the TOP, followed by figma demos
  const displayUsers = [
    ...dbUsers.map((u, idx) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone.startsWith('+91') ? u.phone : `+91 ${u.phone}`,
      type: u.type || 'Leader',
      status: u.status || 'Approved',
      registeredOn: u.registeredOn,
      isRealDb: true,
    })),
    ...figmaDemoUsers,
  ].slice(0, 8); // Display clean top rows

  // Latest Posts Data
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

  // Recent Activities Events Data
  const recentEventActivities = [
    { name: 'Network Meet 2026', date: '10 Oct 2026', status: 'Upcoming' },
    { name: 'Leadership Training', date: '15 Oct 2026', status: 'Upcoming' },
    { name: 'Webinar Digital Growth', date: '20 Oct 2026', status: 'Upcoming' },
    { name: 'Product Launch Event', date: '25 Oct 2026', status: 'Upcoming' },
  ];

  return (
    <div className="aud-page">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="aud-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <aside className={`aud-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="aud-sidebar-brand">
          <Link to="/admin" className="aud-brand-link">
            <img src={logoIconImg} alt="Fortaa" className="aud-brand-icon" />
            <div className="aud-brand-text-col">
              <img src={logoTextImg} alt="FORTAA" className="aud-brand-logo" />
              <span className="aud-brand-badge">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav */}
        <nav className="aud-nav">
          {/* Main Dashboard item */}
          <Link to="/admin" className="aud-nav-item">
            <span className="aud-nav-icon">🏠</span>
            <span className="aud-nav-label">Dashboard</span>
            <span className="aud-chevron">▾</span>
          </Link>

          {/* User Management (ACTIVE GROUP) */}
          <div className="aud-nav-group active-group">
            <button
              className="aud-nav-group-header active"
              onClick={() => toggleSection('userManagement')}
            >
              <div className="aud-nav-gh-left">
                <span className="aud-nav-icon">👤</span>
                <span className="aud-nav-label">User Management</span>
              </div>
              <span className={`aud-chevron ${openSections.userManagement ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.userManagement && (
              <div className="aud-nav-sublist">
                <button
                  className={`aud-nav-sublink ${activeSubItem === 'Registered Users' ? 'active' : ''}`}
                  onClick={() => setActiveSubItem('Registered Users')}
                >
                  <span className="sublink-arrow">‹</span> Registered Users
                </button>
                <button
                  className={`aud-nav-sublink ${activeSubItem === 'User Approvals' ? 'active' : ''}`}
                  onClick={() => setActiveSubItem('User Approvals')}
                >
                  <span className="sublink-arrow">›</span> User Approvals
                </button>
                <button
                  className={`aud-nav-sublink ${activeSubItem === 'User Verification' ? 'active' : ''}`}
                  onClick={() => setActiveSubItem('User Verification')}
                >
                  <span className="sublink-arrow">›</span> User Verification
                </button>
                <button
                  className={`aud-nav-sublink ${activeSubItem === 'User Levels' ? 'active' : ''}`}
                  onClick={() => setActiveSubItem('User Levels')}
                >
                  <span className="sublink-arrow">›</span> User Levels
                </button>
              </div>
            )}
          </div>

          {/* Register Data */}
          <div className="aud-nav-group">
            <button
              className="aud-nav-group-header"
              onClick={() => toggleSection('registerData')}
            >
              <div className="aud-nav-gh-left">
                <span className="aud-nav-icon">🛡️</span>
                <span className="aud-nav-label">Register Data</span>
              </div>
              <span className={`aud-chevron ${openSections.registerData ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.registerData && (
              <div className="aud-nav-sublist">
                <span className="aud-nav-sublink"><span className="sublink-arrow">›</span> New Registrations</span>
                <span className="aud-nav-sublink"><span className="sublink-arrow">›</span> Pending Approvals</span>
                <span className="aud-nav-sublink"><span className="sublink-arrow">›</span> Approved Users</span>
                <span className="aud-nav-sublink"><span className="sublink-arrow">›</span> Rejected Users</span>
                <span className="aud-nav-sublink"><span className="sublink-arrow">›</span> Bulk Upload</span>
              </div>
            )}
          </div>

          {/* Post Management */}
          <button className="aud-nav-item" onClick={() => toggleSection('postManagement')}>
            <span className="aud-nav-icon">💬</span>
            <span className="aud-nav-label">Post Management</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Promotion */}
          <button className="aud-nav-item" onClick={() => toggleSection('promotion')}>
            <span className="aud-nav-icon">📢</span>
            <span className="aud-nav-label">Promotion</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Event Management */}
          <button className="aud-nav-item" onClick={() => toggleSection('eventManagement')}>
            <span className="aud-nav-icon">📅</span>
            <span className="aud-nav-label">Event Management</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Message Management */}
          <button className="aud-nav-item" onClick={() => toggleSection('messageManagement')}>
            <span className="aud-nav-icon">💬</span>
            <span className="aud-nav-label">Message Management</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Group Management */}
          <button className="aud-nav-item" onClick={() => toggleSection('groupManagement')}>
            <span className="aud-nav-icon">👥</span>
            <span className="aud-nav-label">Group Management</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Resource Management */}
          <button className="aud-nav-item" onClick={() => toggleSection('resourceManagement')}>
            <span className="aud-nav-icon">⚡</span>
            <span className="aud-nav-label">Resource Management</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Setting */}
          <button className="aud-nav-item" onClick={() => toggleSection('setting')}>
            <span className="aud-nav-icon">⚙️</span>
            <span className="aud-nav-label">Setting</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* Reports & Analytics */}
          <button className="aud-nav-item" onClick={() => toggleSection('reports')}>
            <span className="aud-nav-icon">📊</span>
            <span className="aud-nav-label">Reports &amp; Analytics</span>
            <span className="aud-chevron">▾</span>
          </button>

          {/* System Logs */}
          <button className="aud-nav-item">
            <span className="aud-nav-icon">📋</span>
            <span className="aud-nav-label">System Logs</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="aud-sidebar-footer">
          <div className="aud-footer-brand-box">
            <span className="aud-fb-title">FORTAA</span>
            <span className="aud-fb-sub">Discover, easy and Grow</span>
          </div>
        </div>
      </aside>

      {/* ───────────────── MAIN WRAPPER ───────────────── */}
      <div className="aud-main-wrap">
        {/* Top Navbar */}
        <header className="aud-topbar">
          <button
            type="button"
            className="aud-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Admin Sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="aud-search-wrap">
            <span className="aud-search-icon">🔍</span>
            <input
              type="text"
              className="aud-search-input"
              placeholder="Search people, posts, companies, products, opportunities..."
            />
          </div>

          <div className="aud-topbar-right">
            <button className="aud-circle-btn aud-wa-btn" title="WhatsApp">💬</button>
            <button className="aud-circle-btn" title="Notifications">
              🔔
              <span className="aud-badge">3</span>
            </button>
            <button className="aud-circle-btn" title="Messages">
              💬
              <span className="aud-badge">3</span>
            </button>
            <div className="aud-profile-pill">
              <img src={userAvatarImg} alt="Rahul Sharma" className="aud-profile-img" />
              <div className="aud-profile-info">
                <span className="aud-profile-name">Rahul sharma</span>
                <span className="aud-profile-role">Silver Leader</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="aud-content">
          {/* Header Row */}
          <div className="aud-page-title-row">
            <div>
              <h1 className="aud-title">User Dashboard</h1>
              <p className="aud-subtitle">Welcome back, Admin! here's what's happening on your platform today.</p>
            </div>
            <div className="aud-title-actions">
              <div className="aud-date-badge">
                <span className="aud-date-icon">📅</span>
                <div className="aud-date-meta">
                  <span className="aud-date-day">October 6,2026</span>
                  <span className="aud-date-sub">Last updated: 06:42 PM</span>
                </div>
              </div>
              <button className="aud-btn-view-website">
                View Website ↗
              </button>
            </div>
          </div>

          {/* ── ROW 1: 5 STAT CARDS ── */}
          <div className="aud-stats-5-row">
            {/* Card 1: Total Registered Users */}
            <div className="aud-stat-card">
              <div className="aud-stat-top">
                <div className="aud-stat-icon-wrap bg-purple-light">
                  <span className="aud-stat-icon text-purple">👥</span>
                </div>
                <div className="aud-stat-label-col">
                  <span className="aud-stat-title-small">Total Registered Users</span>
                  <div className="aud-stat-num">{dbStats.totalUsers}</div>
                  <div className="aud-stat-trend">
                    <span className="trend-green">↑ +12%</span>
                    <span className="trend-sub">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Approved Users */}
            <div className="aud-stat-card">
              <div className="aud-stat-top">
                <div className="aud-stat-icon-wrap bg-blue-light">
                  <span className="aud-stat-icon text-blue">✓</span>
                </div>
                <div className="aud-stat-label-col">
                  <span className="aud-stat-title-small">Approved Users</span>
                  <div className="aud-stat-num">{dbStats.approvedUsers}</div>
                  <div className="aud-stat-trend">
                    <span className="trend-green">↑ +10%</span>
                    <span className="trend-sub">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pending Approvals */}
            <div className="aud-stat-card">
              <div className="aud-stat-top">
                <div className="aud-stat-icon-wrap bg-orange-light">
                  <span className="aud-stat-icon text-orange">⏱️</span>
                </div>
                <div className="aud-stat-label-col">
                  <span className="aud-stat-title-small">Pending Approvals</span>
                  <div className="aud-stat-num">{dbStats.pendingApprovals}</div>
                  <div className="aud-stat-trend">
                    <span className="trend-green">↑ +8%</span>
                    <span className="trend-sub">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Rejected Users */}
            <div className="aud-stat-card">
              <div className="aud-stat-top">
                <div className="aud-stat-icon-wrap bg-pink-light">
                  <span className="aud-stat-icon text-pink">✕</span>
                </div>
                <div className="aud-stat-label-col">
                  <span className="aud-stat-title-small">Rejected Users</span>
                  <div className="aud-stat-num">{dbStats.rejectedUsers}</div>
                  <div className="aud-stat-trend">
                    <span className="trend-red">↓ -5%</span>
                    <span className="trend-sub">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Total Companies */}
            <div className="aud-stat-card">
              <div className="aud-stat-top">
                <div className="aud-stat-icon-wrap bg-green-light">
                  <span className="aud-stat-icon text-green">👥</span>
                </div>
                <div className="aud-stat-label-col">
                  <span className="aud-stat-title-small">Total Companies</span>
                  <div className="aud-stat-num">{dbStats.totalCompanies}</div>
                  <div className="aud-stat-trend">
                    <span className="trend-green">↑ +6%</span>
                    <span className="trend-sub">vs last month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: USER REGISTRATION OVERVIEW & USER DISTRIBUTION ── */}
          <div className="aud-row-charts">
            {/* Left: User Registration Overview Area Chart */}
            <div className="aud-card aud-chart-card">
              <div className="aud-card-header">
                <h3 className="aud-card-title">User Registration Overview</h3>
                <div className="aud-chart-dropdown">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="aud-select"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 3 Month">Last 3 Month</option>
                  </select>
                </div>
              </div>

              {/* Chart Graphic Area */}
              <div className="aud-chart-body">
                <div className="aud-chart-y">
                  <span>2.5K</span>
                  <span>2K</span>
                  <span>1.5K</span>
                  <span>1K</span>
                  <span>500</span>
                  <span>0</span>
                </div>
                <div className="aud-chart-svg-wrap">
                  <svg viewBox="0 0 600 170" className="aud-svg-graph" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="regAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9F21FE" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="10" x2="600" y2="10" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="42" x2="600" y2="42" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="74" x2="600" y2="74" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="106" x2="600" y2="106" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="138" x2="600" y2="138" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="165" x2="600" y2="165" stroke="#E2E8F0" strokeWidth="1" />

                    {/* Area Fill */}
                    <path
                      d="M 20,135 
                         C 60,115 80,105 105,95 
                         C 130,85 150,60 185,55 
                         C 220,50 240,75 270,80 
                         C 310,85 340,65 375,55 
                         C 410,45 450,40 480,30 
                         C 510,20 540,15 565,10 
                         L 565,165 L 20,165 Z"
                      fill="url(#regAreaGrad)"
                    />

                    {/* Smooth Line */}
                    <path
                      d="M 20,135 
                         C 60,115 80,105 105,95 
                         C 130,85 150,60 185,55 
                         C 220,50 240,75 270,80 
                         C 310,85 340,65 375,55 
                         C 410,45 450,40 480,30 
                         C 510,20 540,15 565,10"
                      fill="none"
                      stroke="#8B21E0"
                      strokeWidth="2.5"
                    />

                    {/* Points */}
                    <circle cx="20" cy="135" r="3.5" fill="#8B21E0" />
                    <circle cx="105" cy="95" r="3.5" fill="#8B21E0" />
                    <circle cx="185" cy="55" r="3.5" fill="#8B21E0" />
                    <circle cx="270" cy="80" r="3.5" fill="#8B21E0" />
                    <circle cx="375" cy="55" r="3.5" fill="#8B21E0" />
                    <circle cx="480" cy="30" r="3.5" fill="#8B21E0" />
                    <circle cx="565" cy="10" r="3.5" fill="#8B21E0" />
                  </svg>

                  <div className="aud-chart-x">
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

              {/* Legend Row */}
              <div className="aud-chart-legend">
                <span className="legend-item"><span className="legend-dot dot-purple"></span> Total Registration</span>
                <span className="legend-item"><span className="legend-dot dot-green"></span> Approved</span>
                <span className="legend-item"><span className="legend-dot dot-yellow"></span> Pending</span>
                <span className="legend-item"><span className="legend-dot dot-red"></span> Rejected</span>
              </div>
            </div>

            {/* Right: User Distribution Donut Chart */}
            <div className="aud-card aud-donut-card">
              <div className="aud-card-header">
                <h3 className="aud-card-title">User Distribution</h3>
              </div>
              <div className="aud-donut-body">
                {/* SVG Donut Ring */}
                <div className="aud-donut-svg-wrap">
                  <svg viewBox="0 0 140 140" className="aud-donut-svg">
                    {/* Background Circle */}
                    <circle cx="70" cy="70" r="48" fill="none" stroke="#F1F5F9" strokeWidth="18" />

                    {/* Segment 1: Blue (Business Partner 46%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#3B82F6" strokeWidth="18"
                      strokeDasharray="138 301" strokeDashoffset="0"
                    />
                    {/* Segment 2: Green (Customers 28%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#10B981" strokeWidth="18"
                      strokeDasharray="84 301" strokeDashoffset="-138"
                    />
                    {/* Segment 3: Purple (Leaders 18%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#8B21E0" strokeWidth="18"
                      strokeDasharray="54 301" strokeDashoffset="-222"
                    />
                    {/* Segment 4: Orange (Members 8%) */}
                    <circle
                      cx="70" cy="70" r="48" fill="none" stroke="#F59E0B" strokeWidth="18"
                      strokeDasharray="25 301" strokeDashoffset="-276"
                    />
                  </svg>
                  <div className="aud-donut-center-label">
                    <span className="center-val">24,893</span>
                    <span className="center-sub">Total Users</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="aud-donut-legend">
                  <div className="aud-dl-item">
                    <span className="dl-dot dot-purple"></span>
                    <span className="dl-name">Leaders</span>
                    <span className="dl-pct">18%</span>
                    <span className="dl-val">4,473</span>
                  </div>
                  <div className="aud-dl-item">
                    <span className="dl-dot dot-blue"></span>
                    <span className="dl-name">Business Partner</span>
                    <span className="dl-pct">46%</span>
                    <span className="dl-val">11,445</span>
                  </div>
                  <div className="aud-dl-item">
                    <span className="dl-dot dot-green"></span>
                    <span className="dl-name">Customers</span>
                    <span className="dl-pct">28%</span>
                    <span className="dl-val">6,955</span>
                  </div>
                  <div className="aud-dl-item">
                    <span className="dl-dot dot-yellow"></span>
                    <span className="dl-name">Leaders</span>
                    <span className="dl-pct">8%</span>
                    <span className="dl-val">2,020</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 3: RECENT REGISTERED USERS TABLE (FROM POSTGRESQL DATABASE) ── */}
          <div className="aud-card aud-table-card">
            <div className="aud-card-header">
              <div className="aud-ch-left">
                <h3 className="aud-card-title">Recent Registered Users</h3>
                {dbUsers.length > 0 && (
                  <span className="aud-db-live-badge">🟢 {dbUsers.length} Live from Database</span>
                )}
              </div>
              <a href="#all-users" className="aud-card-view-all">View All →</a>
            </div>

            <div className="aud-table-wrap">
              <table className="aud-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Registered On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user, idx) => (
                    <tr key={user.id || idx} className={user.isRealDb ? 'aud-tr-db' : ''}>
                      <td className="aud-td-num">{idx + 1}</td>
                      <td className="aud-td-name">
                        <span className="aud-user-avatar-circle">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="aud-name-meta">
                          <span className="aud-user-name-text">{user.name}</span>
                          {user.isRealDb && <span className="aud-real-tag">PostgreSQL</span>}
                        </div>
                      </td>
                      <td className="aud-td-email">{user.email}</td>
                      <td className="aud-td-phone">{user.phone}</td>
                      <td className="aud-td-type">{user.type}</td>
                      <td>
                        <span
                          className={`aud-status-badge ${
                            user.status === 'Approved'
                              ? 'status-approved'
                              : user.status === 'Pending'
                              ? 'status-pending'
                              : 'status-followup'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="aud-td-date">{user.registeredOn}</td>
                      <td className="aud-td-actions">
                        <button className="aud-action-btn" title="View details">👁️</button>
                        <button className="aud-action-btn" title="Edit">✏️</button>
                        <button className="aud-action-btn" title="Options">⋮</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ROW 4: 3-COLUMN BOTTOM GRID (LATEST POSTS, RECENT ACTIVITIES, PLATFORM STATS) ── */}
          <div className="aud-row-bottom-grid">
            {/* 1. Latest Posts */}
            <div className="aud-card aud-mini-grid-card">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Latest Posts</h4>
                <a href="#posts" className="aud-card-view-all">View All →</a>
              </div>
              <div className="aud-table-wrap">
                <table className="aud-bottom-table">
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
                      <tr key={i}>
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

            {/* 2. Recent Activities Events */}
            <div className="aud-card aud-mini-grid-card">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Recent Activities</h4>
                <a href="#events" className="aud-card-view-all">View All →</a>
              </div>
              <div className="aud-table-wrap">
                <table className="aud-bottom-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEventActivities.map((ev, i) => (
                      <tr key={i}>
                        <td className="aud-td-title">{ev.name}</td>
                        <td className="aud-td-sub">{ev.date}</td>
                        <td>
                          <span className="aud-badge-upcoming">Upcoming</span>
                        </td>
                        <td className="aud-td-actions">
                          <button className="aud-action-btn">👁️</button>
                          <button className="aud-action-btn">✏️</button>
                          <button className="aud-action-btn">⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Platform Statistics */}
            <div className="aud-card aud-platform-stats-card">
              <div className="aud-card-header">
                <h4 className="aud-mini-title">Platform Statistics</h4>
              </div>
              <div className="aud-ps-grid">
                {/* Website Visitors */}
                <div className="aud-ps-item">
                  <div className="aud-ps-icon-wrap bg-purple-light">
                    <span>👥</span>
                  </div>
                  <div className="aud-ps-meta">
                    <span className="aud-ps-label">Website Visitors</span>
                    <span className="aud-ps-val">48,762</span>
                    <span className="aud-ps-trend">↑ +18%</span>
                  </div>
                </div>

                {/* Total Page Views */}
                <div className="aud-ps-item">
                  <div className="aud-ps-icon-wrap bg-blue-light">
                    <span>👁️</span>
                  </div>
                  <div className="aud-ps-meta">
                    <span className="aud-ps-label">Total Page Views</span>
                    <span className="aud-ps-val">2, 36, 842</span>
                    <span className="aud-ps-trend">↑ +22%</span>
                  </div>
                </div>

                {/* Active Campaign */}
                <div className="aud-ps-item">
                  <div className="aud-ps-icon-wrap bg-orange-light">
                    <span>📢</span>
                  </div>
                  <div className="aud-ps-meta">
                    <span className="aud-ps-label">Active Campaign</span>
                    <span className="aud-ps-val">12</span>
                    <span className="aud-ps-trend">↑ +2%</span>
                  </div>
                </div>

                {/* Storage Used */}
                <div className="aud-ps-item">
                  <div className="aud-ps-icon-wrap bg-pink-light">
                    <span>💾</span>
                  </div>
                  <div className="aud-ps-meta">
                    <span className="aud-ps-label">Storage Used</span>
                    <span className="aud-ps-val">48,762</span>
                    <span className="aud-ps-trend">↑ +18%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
