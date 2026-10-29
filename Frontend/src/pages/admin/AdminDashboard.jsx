import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';

// Uploaded Assets
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import sidebarMegaphoneImg from '../../assets/dashboard/sidebar_megaphone_3d.png';
import companyAmway from '../../assets/figma/company_amway.png';
import companyHerbalife from '../../assets/figma/company_herbalife.png';
import companyOriflame from '../../assets/figma/company_oriflame.png';
import whatsappIconImg from '../../assets/dashboard/whatsaap-icon.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [trafficTimeframe, setTrafficTimeframe] = useState('Last 7 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Top 4 Stat Cards
  const stats = [
    {
      label: 'Total Users',
      value: '24,892',
      trend: '↑ +12%',
      trendLabel: 'vs last month',
      icon: '👥',
    },
    {
      label: 'Total Companies',
      value: '156',
      trend: '↑ +3%',
      trendLabel: 'vs last month',
      icon: '🏢',
    },
    {
      label: 'Total Products',
      value: '482',
      trend: '↑ +6.1%',
      trendLabel: 'vs last month',
      icon: '📦',
    },
    {
      label: 'Total Events',
      value: '38',
      trend: '↑ +10.7%',
      trendLabel: 'vs last month',
      icon: '📅',
    },
  ];

  // Recent Activities
  const recentActivities = [
    {
      icon: '👤',
      title: 'New user registered',
      desc: 'Rahul Sharma joined as Member',
      time: '2 min ago',
      color: '#8B5CF6',
    },
    {
      icon: '🏢',
      title: 'New company added',
      desc: 'Digital Marketing Solutions',
      time: '12 min ago',
      color: '#EC4899',
    },
    {
      icon: '📅',
      title: 'Event updated',
      desc: 'Business Growth Workshop',
      time: '26 min ago',
      color: '#10B981',
    },
    {
      icon: '📦',
      title: 'New product added',
      desc: 'Leadership program',
      time: '45 min ago',
      color: '#F59E0B',
    },
    {
      icon: '🖼️',
      title: 'Banner updated',
      desc: 'Homepage Banner #3',
      time: '1 hour ago',
      color: '#EF4444',
    },
    {
      icon: '📰',
      title: 'News published',
      desc: 'Industry Growth News',
      time: '2 hour ago',
      color: '#3B82F6',
    },
    {
      icon: '👤',
      title: 'New lead received',
      desc: 'Priya Verma',
      time: '2 hour ago',
      color: '#10B981',
    },
  ];

  // Top Categories Table
  const topCategories = [
    { id: 1, name: 'Herbal & wellness', icon: '💖', count: 48, status: 'Active' },
    { id: 2, name: 'Business Opportunity', icon: '💼', count: 72, status: 'Active' },
    { id: 3, name: 'Leadership', icon: '👔', count: 36, status: 'Active' },
    { id: 4, name: 'Product Training', icon: '📦', count: 28, status: 'Active' },
    { id: 5, name: 'Marketing Tools', icon: '📢', count: 42, status: 'Active' },
    { id: 6, name: 'Lifestyle', icon: '⭐', count: 18, status: 'Active' },
  ];

  // Latest Companies Table
  const latestCompanies = [
    { id: 1, name: 'Fortaa Wellness', category: 'Health & Wellness', status: 'Active', logo: logoIconImg },
    { id: 2, name: 'Amway Lifestyle', category: 'Lifestyle', status: 'Active', logo: companyAmway },
    { id: 3, name: 'Oriflame Personal...', category: 'Beauty & Care', status: 'Active', logo: companyOriflame },
    { id: 4, name: 'Herbalife Nutrition', category: 'Nutrition', status: 'Active', logo: companyHerbalife },
    { id: 5, name: 'Digital Marketing Pro', category: 'Marketing Tools', status: 'Active', logo: logoIconImg },
    { id: 6, name: 'Tata Business', category: 'Business Opportunity', status: 'Active', logo: logoIconImg },
  ];

  // Recent Events Table
  const recentEvents = [
    { id: 1, name: 'Business Growth Workshop', date: '28 May 2025', status: 'Live', type: 'live' },
    { id: 2, name: 'Leadership Seminar', date: '02 jun 2025', status: 'Upcoming', type: 'upcoming' },
    { id: 3, name: 'Network Marketing Seminar', date: '15 jun 2025', status: 'Upcoming', type: 'upcoming' },
    { id: 4, name: 'Product Training Webinar', date: '22 jun 2025', status: 'Upcoming', type: 'upcoming' },
    { id: 5, name: 'Success Stories Meeting', date: '30 jun 2025', status: 'Upcoming', type: 'upcoming' },
  ];

  // Latest Companies Detailed Table (Row 4)
  const detailedCompanies = [
    {
      id: 1,
      name: 'Neha Verma',
      email: 'neha@gmail.com',
      phone: '+91 9095832210',
      source: 'Website',
      status: 'New',
      statusClass: 'status-new',
      date: '28 May 2025',
    },
    {
      id: 2,
      name: 'Amit Kumar',
      email: 'amit@gmail.com',
      phone: '+91 909758642',
      source: 'Facebook',
      status: 'Connected',
      statusClass: 'status-connected',
      date: '28 May 2025',
    },
    {
      id: 3,
      name: 'Sneha Patel',
      email: 'sneha@gmail.com',
      phone: '+91 902564324',
      source: 'Instagram',
      status: 'New',
      statusClass: 'status-new',
      date: '28 May 2025',
    },
    {
      id: 4,
      name: 'Rohit Singh',
      email: 'rohit@gmail.com',
      phone: '+91 90958364',
      source: 'Referral',
      status: 'Follow Up',
      statusClass: 'status-followup',
      date: '28 May 2025',
    },
    {
      id: 5,
      name: 'Pooja Sharma',
      email: 'pooja@gmail.com',
      phone: '+91 909583263',
      source: 'Website',
      status: 'Connected',
      statusClass: 'status-connected',
      date: '28 May 2025',
    },
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

      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <aside className={`adm-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="adm-sidebar-brand">
          <Link to="/" className="adm-brand-link">
            <img src={logoIconImg} alt="Fortaa" className="adm-brand-icon" />
            <div className="adm-brand-text-col">
              <img src={logoTextImg} alt="FORTAA" className="adm-brand-logo" />
              <span className="adm-brand-badge">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation Accordion Menu */}
        <nav className="adm-nav">
          {/* Dashboard item */}
          <button
            className={`adm-nav-item ${activeMenu === 'Dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('Dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <span className="adm-nav-icon">🏠</span>
            <span className="adm-nav-label">Dashboard</span>
          </button>

          {/* Website Management */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('website')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">🌐</span>
                <span className="adm-nav-label">Website Management</span>
              </div>
              <span className={`adm-chevron ${openSections.website ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.website && (
              <div className="adm-nav-sublist">
                <a href="#pages" className="adm-nav-sublink">● Pages</a>
                <a href="#sections" className="adm-nav-sublink">● Sections</a>
                <a href="#banners" className="adm-nav-sublink">● Banners</a>
                <a href="#menus" className="adm-nav-sublink">● Menus</a>
              </div>
            )}
          </div>

          {/* Company Management */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('company')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">🏢</span>
                <span className="adm-nav-label">Company Management</span>
              </div>
              <span className={`adm-chevron ${openSections.company ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.company && (
              <div className="adm-nav-sublist">
                <a href="#companies" className="adm-nav-sublink">🏢 Companies</a>
                <a href="#categories" className="adm-nav-sublink">📑 Categories</a>
                <a href="#leaders" className="adm-nav-sublink">👥 Leaders</a>
                <a href="#products" className="adm-nav-sublink">📦 Products</a>
                <a href="#opportunities" className="adm-nav-sublink">💼 Opportunities</a>
              </div>
            )}
          </div>

          {/* Content Management */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('content')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">📰</span>
                <span className="adm-nav-label">Content Management</span>
              </div>
              <span className={`adm-chevron ${openSections.content ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.content && (
              <div className="adm-nav-sublist">
                <a href="#news" className="adm-nav-sublink">📰 News</a>
                <a href="#events" className="adm-nav-sublink">📅 Events</a>
                <a href="#promotions" className="adm-nav-sublink">🏷️ Promotions</a>
              </div>
            )}
          </div>

          {/* User Management */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('user')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">👤</span>
                <span className="adm-nav-label">User Management</span>
              </div>
              <span className={`adm-chevron ${openSections.user ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.user && (
              <div className="adm-nav-sublist">
                <Link to="/admin/users" className="adm-nav-sublink">👤 User (User Dashboard)</Link>
                <a href="#roles" className="adm-nav-sublink">🛡️ Roles &amp; Permission</a>
              </div>
            )}
          </div>

          {/* Marketing */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('marketing')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">📈</span>
                <span className="adm-nav-label">Marketing</span>
              </div>
              <span className={`adm-chevron ${openSections.marketing ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.marketing && (
              <div className="adm-nav-sublist">
                <a href="#leads" className="adm-nav-sublink">🎯 Leads</a>
                <a href="#campaign" className="adm-nav-sublink">📢 Campaign</a>
                <a href="#templates" className="adm-nav-sublink">✉️ Email Templates</a>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="adm-nav-group">
            <button
              className="adm-nav-group-header"
              onClick={() => toggleSection('settings')}
            >
              <div className="adm-nav-gh-left">
                <span className="adm-nav-icon">⚙️</span>
                <span className="adm-nav-label">Settings</span>
              </div>
              <span className={`adm-chevron ${openSections.settings ? 'open' : ''}`}>▾</span>
            </button>
            {openSections.settings && (
              <div className="adm-nav-sublist">
                <a href="#gen-settings" className="adm-nav-sublink">⚙️ General Settings</a>
                <a href="#seo" className="adm-nav-sublink">🔍 SEO Settings</a>
                <a href="#logs" className="adm-nav-sublink">📋 System Logs</a>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Sidebar Fortaa Branding Box */}
        <div className="adm-sidebar-footer">
          <div className="adm-footer-brand-box">
            <span className="adm-fb-title">FORTAA</span>
            <span className="adm-fb-sub">Discover, easy and Grow</span>
          </div>
        </div>
      </aside>

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <div className="adm-main-wrap">
        {/* ── TOP HEADER / NAVBAR ── */}
        <header className="adm-topbar">
          <button
            type="button"
            className="adm-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Admin Sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="adm-search-wrap">
            <span className="adm-search-icon">🔍</span>
            <input
              type="text"
              className="adm-search-input"
              placeholder="Search people, posts, companies, products, opportunities..."
            />
          </div>

          <div className="adm-topbar-right">
            {/* WhatsApp Icon */}
            <button className="adm-circle-btn adm-wa-btn" title="WhatsApp Support">
              <img src={whatsappIconImg} alt="WhatsApp" className="adm-header-action-icon" />
            </button>

            {/* Notification Bell */}
            <button className="adm-circle-btn" title="Notifications">
              <img src={bellIconImg} alt="Notifications" className="adm-header-action-icon" />
              <span className="adm-badge">3</span>
            </button>

            {/* Chat Icon */}
            <button className="adm-circle-btn" title="Messages">
              <img src={messageIconImg} alt="Messages" className="adm-header-action-icon" />
              <span className="adm-badge">3</span>
            </button>

            {/* Admin Profile Pill */}
            <div className="adm-profile-pill">
              <img src={userAvatarImg} alt="Rahul Sharma" className="adm-profile-img" />
              <div className="adm-profile-info">
                <span className="adm-profile-name">Rahul sharma</span>
                <span className="adm-profile-role">Silver Leader</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── DASHBOARD BODY CONTENT ── */}
        <main className="adm-content">
          {/* Title & Live Date Row */}
          <div className="adm-page-title-row">
            <div>
              <h1 className="adm-title">Dashboard</h1>
              <p className="adm-subtitle">Welcome back, Admin! here's what's happening on your platform today.</p>
            </div>
            <div className="adm-date-badge">
              <span className="adm-date-icon">📅</span>
              <span className="adm-date-text">Tue, 28 May 2025 &nbsp; 10:24 AM</span>
            </div>
          </div>

          {/* ── 2-COLUMN MAIN DASHBOARD GRID ── */}
          <div className="adm-dashboard-grid">
            {/* ═════════ LEFT / CENTER MAJOR COLUMN ═════════ */}
            <div className="adm-col-main">
              {/* Row 1: 4 Stat Cards */}
              <div className="adm-stats-row">
                {stats.map((st, i) => (
                  <div key={i} className="adm-stat-card">
                    <div className="adm-stat-top">
                      <div className="adm-stat-icon-wrap">
                        <span className="adm-stat-icon">{st.icon}</span>
                      </div>
                      <span className="adm-stat-label">{st.label}</span>
                    </div>
                    <div className="adm-stat-number">{st.value}</div>
                    <div className="adm-stat-trend">
                      <span className="trend-up">{st.trend}</span>
                      <span className="trend-label">{st.trendLabel}</span>
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

              {/* Row 3: 3 Mini Tables Side-by-Side */}
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
                        {topCategories.map((c) => (
                          <tr key={c.id}>
                            <td className="adm-col-num">{c.id}</td>
                            <td className="adm-col-name">
                              <span className="adm-cat-icon">{c.icon}</span>
                              <span className="adm-text-ellipsis">{c.name}</span>
                            </td>
                            <td className="adm-col-count">{c.count}</td>
                            <td>
                              <span className="adm-badge-active">Active</span>
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
                        {latestCompanies.map((comp) => (
                          <tr key={comp.id}>
                            <td className="adm-col-num">{comp.id}</td>
                            <td className="adm-col-name">
                              <img src={comp.logo} alt="" className="adm-mini-logo" />
                              <span className="adm-text-ellipsis">{comp.name}</span>
                            </td>
                            <td className="adm-col-sub">{comp.category}</td>
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
                        {recentEvents.map((ev) => (
                          <tr key={ev.id}>
                            <td className="adm-col-name">
                              <span className="adm-event-thumb">📅</span>
                              <span className="adm-text-ellipsis">{ev.name}</span>
                            </td>
                            <td className="adm-col-sub">{ev.date}</td>
                            <td>
                              <span className={ev.type === 'live' ? 'adm-badge-live' : 'adm-badge-upcoming'}>
                                {ev.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 4: Latest Companies / Registrations Detailed Table */}
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
                      {detailedCompanies.map((row) => (
                        <tr key={row.id}>
                          <td className="adm-col-num">{row.id}</td>
                          <td className="adm-col-name">
                            <img src={userAvatarImg} alt="" className="adm-table-avatar" />
                            <span className="adm-lead-name">{row.name}</span>
                          </td>
                          <td className="adm-col-email">{row.email}</td>
                          <td className="adm-col-phone">{row.phone}</td>
                          <td className="adm-col-source">{row.source}</td>
                          <td>
                            <span className={`adm-pill-status ${row.statusClass}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="adm-col-date">{row.date}</td>
                        </tr>
                      ))}
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
                  <button className="adm-btn-view-website">
                    View Website ↗
                  </button>
                </div>
                <img src={sidebarMegaphoneImg} alt="" className="adm-promo-megaphone" />
              </div>

              {/* Card 2: Recent Activities */}
              <div className="adm-card adm-activities-card">
                <div className="adm-card-header">
                  <h3 className="adm-card-title">Recent Activities</h3>
                  <a href="#activities" className="adm-card-view-all">View All →</a>
                </div>
                <div className="adm-activities-list">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="adm-activity-item">
                      <div className="adm-activity-icon" style={{ color: act.color }}>
                        {act.icon}
                      </div>
                      <div className="adm-activity-details">
                        <span className="adm-activity-title">{act.title}</span>
                        <span className="adm-activity-sub">{act.desc}</span>
                      </div>
                      <span className="adm-activity-time">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Platform Statistics */}
              <div className="adm-card adm-platform-stats-card">
                <div className="adm-platform-stats-header">
                  <h4 className="adm-platform-stats-title">Platform Statistics</h4>
                </div>
                <div className="adm-ps-grid">
                  {/* Total Page Views */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap">👥</div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Total Page Views</span>
                      <span className="adm-ps-val">1,24,568</span>
                      <span className="adm-ps-trend">↑ +15.2%</span>
                    </div>
                  </div>

                  {/* Total Clicks */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap">👆</div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Total Clicks</span>
                      <span className="adm-ps-val">1,24,568</span>
                      <span className="adm-ps-trend">↑ +15.2%</span>
                    </div>
                  </div>

                  {/* Common Rate */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap">👍</div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Common Rate</span>
                      <span className="adm-ps-val">4.8%</span>
                      <span className="adm-ps-trend">↑ +2.3%</span>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className="adm-ps-item">
                    <div className="adm-ps-icon-wrap">👥</div>
                    <div className="adm-ps-meta">
                      <span className="adm-ps-label">Active Users</span>
                      <span className="adm-ps-val">18,642</span>
                      <span className="adm-ps-trend">↑ +9.7%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Need Help? */}
              <div className="adm-card adm-help-card">
                <div className="adm-help-top">
                  <span className="adm-help-icon">💬</span>
                  <div className="adm-help-info">
                    <h5 className="adm-help-title">Need Help?</h5>
                    <p className="adm-help-desc">Our support team is here to assist you 24/7.</p>
                  </div>
                </div>
                <button className="adm-btn-contact-support">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
