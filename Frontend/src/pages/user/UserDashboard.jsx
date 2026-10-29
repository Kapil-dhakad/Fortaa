import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCheck, FaUsers, FaUserFriends, FaRegAddressCard, FaShieldAlt } from 'react-icons/fa';
import './UserDashboard.css';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';

// Dashboard uploaded assets
import postMeshImg from '../../assets/dashboard/post_abstract_mesh.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import sidebarMegaphoneImg from '../../assets/dashboard/sidebar_megaphone_3d.png';
import oppDigitalImg from '../../assets/dashboard/opp_digital_marketing.png';
import oppLeadershipImg from '../../assets/dashboard/opp_leadership.png';
import oppWellnessImg from '../../assets/dashboard/opp_wellness.png';
import whatsappIconImg from '../../assets/dashboard/whatsaap-icon.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';
import unlockPotentialBg from '../../assets/dashboard/unlock_potential_bg.png';
import qaCreatePostImg from '../../assets/dashboard/quick_action_create_post.png';
import qaAddPhotoImg from '../../assets/dashboard/quick_action_add_photo.png';
import qaMarketplaceImg from '../../assets/dashboard/quick_action_marketplace.png';
import qaInviteTeamImg from '../../assets/dashboard/quick_action_invite_team.png';
import qaJoinGroupImg from '../../assets/dashboard/quick_action_join_group.svg';
import qaGoLiveImg from '../../assets/dashboard/quick_action_go_live.svg';

// Sidebar Navigation Icons (25x25)
import navHomeIcon from '../../assets/sidebar/nav_home.png';
import navProfileIcon from '../../assets/sidebar/nav_profile.png';
import navServicesIcon from '../../assets/sidebar/nav_services.png';
import navTeamIcon from '../../assets/sidebar/nav_team.png';
import navFollowingIcon from '../../assets/sidebar/nav_following.png';
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

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');
  const [postText, setPostText] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock logged in user (or fetch from localStorage)
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  const userName = storedUser.name || 'Rahul sharma';
  const userRole = 'Silver Leader';
  const userMemberId = storedUser.memberId || 'NS381517';

  const handleLogout = () => {
    localStorage.removeItem('fortaa_token');
    localStorage.removeItem('fortaa_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Navigation Items
  const navItems = [
    { label: 'Home', icon: navHomeIcon },
    { label: 'My Profile', icon: navProfileIcon },
    { label: 'Services', icon: navServicesIcon },
    { label: 'My Team', icon: navTeamIcon },
    { label: 'Following', icon: navFollowingIcon },
    { label: 'Market Place', icon: navMarketplaceIcon },
    { label: 'Companies', icon: navCompaniesIcon },
    { label: 'Products', icon: navProductsIcon },
    { label: 'Leaders', icon: navLeadersIcon },
    { label: 'Promotions', icon: navPromotionsIcon },
    { label: 'Events', icon: navEventsIcon },
    { label: 'News & Updates', icon: navNewsIcon },
    { label: 'Messages', icon: navMessagesIcon },
    { label: 'Groups', icon: navGroupsIcon },
    { label: 'Resources', icon: navResourcesIcon },
    { label: 'Settings', icon: navSettingsIcon },
  ];

  // Quick Action Buttons
  const quickActions = [
    { label: 'Create Post', icon: qaCreatePostImg, bgColor: '#FCE7F3' },
    { label: 'Add Photo', icon: qaAddPhotoImg, bgColor: '#FAF5FF' },
    { label: 'Share Market Place', icon: qaMarketplaceImg, bgColor: '#ECFDF5' },
    { label: 'Invite Team', icon: qaInviteTeamImg, bgColor: '#EDE9FE' },
    { label: 'Join Group', icon: qaJoinGroupImg, bgColor: '#FAE8FF' },
    { label: 'Go Live', icon: qaGoLiveImg, bgColor: '#FFE4E6' },
  ];

  // Trainers
  const trainers = [
    { name: 'Neha Gupta', role: 'Diamond Leader', network: '1.2 Network', followers: '2K Followers' },
    { name: 'Amit Verma', role: 'Diamond Leader', network: '1.2 Network', followers: '5K Followers' },
    { name: 'Vikas Kumar', role: 'Diamond Leader', network: '1.2K Network', followers: '1.1K Followers' },
  ];

  // Leaders
  const leaders = [
    { name: 'Neha Verma', role: 'Business Leader' },
    { name: 'Anjali Singh', role: 'Silver Leader' },
    { name: 'Vikram Yadav', role: 'Team Leader' },
    { name: 'Pooja Verma', role: 'Business Leader' },
    { name: 'Anjali Singh', role: 'Silver Leader' },
    { name: 'Vikram Yadav', role: 'Team Leader' },
    { name: 'Pooja Verma', role: 'Business Leader' },
  ];

  // Services & Market Place
  const services = [
    {
      title: 'Digital Marketing Specialist',
      desc: 'Digital Marketing | Graphic Designer | Video Editor | Software Engineer',
      location: 'Indore, Madhya Pradesh, India',
      thumb: oppDigitalImg,
    },
    {
      title: 'Team Leader',
      desc: 'Team Management | Marketing / Training | Reporting | Compose Target',
      location: 'Rewa, Madhya Pradesh, India',
      thumb: userAvatarImg,
    },
    {
      title: 'Franchise Partner',
      desc: 'Franchise Opportunity | Business Set up Support | Marketing Support | Brand Licensing',
      location: 'France, Paris',
      thumb: oppLeadershipImg,
    },
    {
      title: 'Wellness Products',
      desc: 'Health Supplements | Personal Care Products | Herbal Products | Nutrition Products',
      location: 'Indore, Madhya Pradesh, India',
      thumb: oppWellnessImg,
    },
    {
      title: 'E - Commerce Business',
      desc: 'Online Store Setup | Product Listing | Order Management | Payment Integration',
      location: 'Pune, Maharashtra India',
      thumb: oppDigitalImg,
    },
    {
      title: 'Training & Development',
      desc: 'Professional Skills | Leadership | Sales Training | Career Development',
      location: 'Singapore',
      thumb: oppLeadershipImg,
    },
  ];

  // Upcoming Events
  const upcomingEvents = [
    { date: '20', month: 'NOV', title: 'Leadership Summit', type: 'Online' },
    { date: '20', month: 'NOV', title: 'Industry Networking Meet', type: 'New Delhi' },
    { date: '20', month: 'NOV', title: 'Business Growth Workshop', type: 'Online' },
  ];

  // Popular Groups
  const popularGroups = [
    { name: 'Success Mindset & Moti...', members: '12.4K members', sub: '3.8K mindset' },
    { name: 'Network Marketing Tips', members: '5.7K member', sub: '8.6 mindset' },
    { name: 'Health & Wellness Products', members: '8.2k member', sub: '6.2K mindset' },
  ];

  // Scroll Opportunities
  const opportunities = [
    {
      title: 'Digital Marketing Specialist',
      tags: ['Work from Home', 'High Earning'],
      price: '₹ 25k - 75k / month',
      image: oppDigitalImg,
    },
    {
      title: 'Leadership Program',
      isNew: true,
      tags: ['Build Team', 'Bonus'],
      price: '₹ 50k - 2L / month',
      image: oppLeadershipImg,
    },
    {
      title: 'Health & Wellness Specialist',
      tags: ['High Demand'],
      price: '₹ 10k - 50k / month',
      image: oppWellnessImg,
    },
  ];


  return (
    <div className="ud-page">
      {/* ───────────────── TOP NAVBAR ───────────────── */}
      <header className="ud-topbar">
        <div className="ud-topbar-left">
          <button
            type="button"
            className="ud-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Sidebar Navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="ud-brand-logo-card">
            <Link to="/" className="ud-brand-logo">
              <img src={logoIconImg} alt="Fortaa" className="ud-logo-icon" />
              <div className="ud-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="ud-logo-word" />
                <span className="ud-logo-tagline">Discover, easy and Grow</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Global Search Bar (Figma Frame: 741x35px, radius 10px, padding 10px, gap 10px) */}
        <div className="ud-search-wrapper">
          <img src={searchIconPurple} alt="" className="ud-search-icon-img" />
          <input
            type="text"
            className="ud-search-input"
            placeholder="Search people, posts, companies, products, opportunities..."
          />
        </div>

        {/* Topbar Actions & Profile */}
        <div className="ud-topbar-right">
          <button className="ud-icon-circle-btn ud-wa-btn" title="WhatsApp" onClick={() => toast.success('WhatsApp connected!')}>
            <img src={whatsappIconImg} alt="WhatsApp" className="ud-wa-img-icon" />
          </button>
          <button className="ud-icon-circle-btn ud-notif-btn" title="Notifications" onClick={() => toast('No new notifications', { icon: '🔔' })}>
            <img src={bellIconImg} alt="Notifications" className="ud-header-action-icon" />
            <span className="ud-badge-count">4</span>
          </button>
          <button className="ud-icon-circle-btn ud-msg-btn" title="Messages" onClick={() => toast('No new messages', { icon: '✉️' })}>
            <img src={messageIconImg} alt="Messages" className="ud-header-action-icon" />
            <span className="ud-badge-count">3</span>
          </button>

          {/* User Profile Mini Capsule */}
          <div className="ud-user-pill" title="Current User" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src={userAvatarImg} alt="Profile" className="ud-user-pill-avatar" />
            <div className="ud-user-pill-info">
              <span className="ud-user-pill-name">{userName}</span>
              <span className="ud-user-pill-role">{userRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="ud-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ───────────────── MAIN WRAPPER: PINNED SIDEBAR + SCROLLABLE RIGHT CONTENT ───────────────── */}
      <div className="ud-main-wrapper">
        {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PINNED) ── */}
        <aside className={`ud-sidebar-left ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="ud-nav-list">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`ud-nav-link ${activeTab === item.label ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.label);
                  setMobileMenuOpen(false);
                  if (item.label === 'My Profile') navigate('/profile');
                }}
              >
                <span className="ud-nav-icon">
                  <img src={item.icon} alt={item.label} className="ud-nav-icon-img" />
                </span>
                <span className="ud-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Promo Card: Grow Together */}
          <div className="ud-sidebar-promo-card">
            <div className="ud-promo-img-wrap">
              <img src={sidebarMegaphoneImg} alt="Grow Together" className="ud-promo-megaphone" />
            </div>
            <p className="ud-promo-title">Grow Together</p>
            <p className="ud-promo-desc">
              Connect with like-minded professionals, build your team and achieve bigger goals.
            </p>
            <button className="ud-promo-btn">Invite People &gt;</button>
          </div>

          {/* Sidebar Bottom Brand (Exact same size as top logo: 152px × 42px) */}
          <div className="ud-brand-logo-card ud-brand-logo-card-bottom">
            <div className="ud-brand-logo">
              <img src={logoIconImg} alt="Fortaa" className="ud-logo-icon" />
              <div className="ud-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="ud-logo-word" />
                <span className="ud-logo-tagline">Discover, easy and Grow</span>
              </div>
            </div>
          </div>

          {/* Sidebar Social Icons (Figma: 20x20px circles, gradient #9E04C3 -> #5A2CE4, 10px icons, 10px gap) */}
          <div className="ud-sidebar-socials">
            <a href="#facebook" className="ud-social-circle-btn" title="Facebook" aria-label="Facebook">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#instagram" className="ud-social-circle-btn" title="Instagram" aria-label="Instagram">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.441-1.44z"/>
              </svg>
            </a>
            <a href="#youtube" className="ud-social-circle-btn" title="YouTube" aria-label="YouTube">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="#linkedin" className="ud-social-circle-btn" title="LinkedIn" aria-label="LinkedIn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </aside>

        {/* ── SCROLLABLE RIGHT CONTAINER ── */}
        <div className="ud-content-scroll-container" id="ud-content-scroll-container">
          <div className="ud-content-columns">
            {/* ── PANEL 2: MAIN FEED & DISCOVERY ── */}
            <main className="ud-feed-main">
          {/* User Hero Identity Banner */}
          <div className="ud-hero-banner">
            <div className="ud-hero-content">
              {/* Top Row: Avatar + User Details Column (Name, Index Tech badge, View My Profile) */}
              <div className="ud-hero-top-row">
                <div className="ud-hero-avatar-wrap">
                  <img src={userAvatarImg} alt={userName} className="ud-hero-avatar" />
                  <span className="ud-hero-verified-badge" title="Verified Member">
                    <FaCheck />
                  </span>
                </div>

                <div className="ud-hero-user-details">
                  <h2 className="ud-hero-name">{userName}</h2>
                  <div className="ud-hero-badge-capsule">
                    <span className="ud-badge-shield-icon">
                      <FaShieldAlt />
                    </span>
                    <span className="ud-badge-tech">Index Technology</span>
                    <span className="ud-badge-sep">|</span>
                    <span className="ud-badge-role">{userRole}</span>
                  </div>
                  <button className="ud-btn-view-profile" onClick={() => navigate('/profile')}>
                    View My Profile
                  </button>
                </div>
              </div>

              {/* Bottom Row: Horizontal Stats Row with react-icons */}
              <div className="ud-hero-stats-row">
                <div className="ud-stat-item ud-stat-frame">
                  <div className="ud-stat-icon-wrap">
                    <FaUsers />
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Network</span>
                    <span className="ud-stat-val">248</span>
                  </div>
                </div>

                <div className="ud-stat-item ud-stat-frame">
                  <div className="ud-stat-icon-wrap">
                    <FaUserFriends />
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Followers</span>
                    <span className="ud-stat-val">12</span>
                  </div>
                </div>

                <div className="ud-stat-item ud-stat-frame ud-stat-following">
                  <div className="ud-stat-icon-wrap">
                    <FaRegAddressCard />
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Following</span>
                    <span className="ud-stat-val">1,25,450</span>
                  </div>
                </div>

                <div className="ud-stat-item ud-stat-frame">
                  <div className="ud-stat-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.8" />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="url(#udDonutGrad)"
                        strokeWidth="2.8"
                        strokeDasharray="56.5"
                        strokeDashoffset="8.5"
                        strokeLinecap="round"
                        transform="rotate(-90 12 12)"
                      />
                      <defs>
                        <linearGradient id="udDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00E5FF" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Total Post</span>
                    <span className="ud-stat-val">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Capsules */}
          <div className="ud-quick-actions-bar">
            {quickActions.map((qa, i) => (
              <button key={i} className="ud-quick-btn">
                <div className="ud-quick-icon-circle" style={{ backgroundColor: qa.bgColor }}>
                  <img src={qa.icon} alt={qa.label} className="ud-quick-action-img" />
                </div>
                <span className="ud-quick-text">{qa.label}</span>
              </button>
            ))}
          </div>

          {/* Center 2-Column Split: Feed vs Trainers/Leaders */}
          <div className="ud-center-split-grid">
            {/* Feed Column (Left) */}
            <div className="ud-feed-column">
              {/* Create a Post Box */}
              <div className="ud-create-post-card">
                <div className="ud-cp-header">
                  <span className="ud-cp-title">✍️ Create a Post</span>
                </div>
                <div className="ud-cp-input-row">
                  <img src={userAvatarImg} alt="" className="ud-cp-avatar" />
                  <input
                    type="text"
                    className="ud-cp-input"
                    placeholder="Share your thoughts, business, opportunity or updates..."
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />
                </div>
                <div className="ud-cp-actions-row">
                  <div className="ud-cp-tags">
                    <button className="ud-cp-tag">📷 Photo</button>
                    <button className="ud-cp-tag">🎥 Video</button>
                    <button className="ud-cp-tag">📊 Poll</button>
                    <button className="ud-cp-tag">🛍️ Market Place</button>
                  </div>
                  <button className="ud-cp-btn-post">Post</button>
                </div>
              </div>

              {/* Sample Feed Post 1 (Figma: 401x390px) */}
              <div className="ud-post-card ud-post-1">
                <div className="ud-post-header">
                  <img src={userAvatarImg} alt="" className="ud-post-avatar" />
                  <div className="ud-post-author-meta">
                    <div className="ud-post-author-name-row">
                      <span className="ud-post-author-name">{userName}</span>
                      <span className="ud-post-badge">Gold Leader</span>
                      <span className="ud-post-time">• 2hr ago • 🌐</span>
                    </div>
                  </div>
                  <button className="ud-btn-follow-post">Follow</button>
                  <button className="ud-btn-post-menu">⋮</button>
                </div>

                <div className="ud-post-body">
                  <p className="ud-post-text">
                    Grateful to be part of an amazing team! Fortaa has given me the right platform to grow, learn and achieve my goals. Together we grow bigger!
                  </p>
                  <p className="ud-post-tags">#FortaaMarketing #Teamwork #Success #Fortaa</p>

                  {/* Post Image Mesh Banner */}
                  <div className="ud-post-image-box">
                    <img src={postMeshImg} alt="Dream Connect Achieve" className="ud-post-img" />
                    <div className="ud-post-img-overlay">
                      <span className="ud-post-mesh-logo">FORTAA</span>
                      <h3 className="ud-post-mesh-title">Dream Connect Achieve</h3>
                    </div>
                  </div>
                </div>

                {/* Post Footer Reactions */}
                <div className="ud-post-reactions-row">
                  <div className="ud-post-reaction-icons">
                    <span>👍 ❤️ 👏 124</span>
                  </div>
                  <div className="ud-post-comment-counts">
                    <span>28 comments</span>
                    <span>12 shares</span>
                  </div>
                </div>

                <div className="ud-post-interact-bar">
                  <button className="ud-interact-btn">👍 Like</button>
                  <button className="ud-interact-btn">💬 Comment</button>
                  <button className="ud-interact-btn">↗️ Share</button>
                </div>

                {/* Sub comment preview */}
                <div className="ud-post-comments-preview">
                  <div className="ud-comment-item">
                    <span className="ud-commenter-name">Amit Verma</span>
                    <span className="ud-commenter-text">Great sharing keep inspiring!</span>
                  </div>
                  <div className="ud-comment-input-box">
                    <input type="text" placeholder="Write a comment..." className="ud-comment-input" />
                    <button className="ud-comment-submit">➤</button>
                  </div>
                </div>
              </div>

              {/* Sample Feed Post 2 (Figma: 401x201px) */}
              <div className="ud-post-card ud-post-2">
                <div className="ud-post-header">
                  <div className="ud-post-avatar-placeholder" style={{ background: '#E91E8C' }}>SP</div>
                  <div className="ud-post-author-meta">
                    <div className="ud-post-author-name-row">
                      <span className="ud-post-author-name">Sneha Patel</span>
                      <span className="ud-post-badge">Platinum Leader</span>
                      <span className="ud-post-time">• 4hr ago • 🌐</span>
                    </div>
                  </div>
                  <button className="ud-btn-follow-post">Follow</button>
                </div>
                <div className="ud-post-body">
                  <p className="ud-post-text">
                    Looking for motivated people who want to build their own business and create financial freedom. DM me for more details.
                  </p>
                  <p className="ud-post-tags">#Opportunity #FinancialFreedom #JoinNow</p>

                  {/* Business Opportunity Attached Mini Cards */}
                  <div className="ud-attached-opps-list">
                    <div className="ud-attached-opp-card">
                      <div className="ud-attached-opp-left">
                        <img src={userAvatarImg} alt="" className="ud-attached-opp-icon" />
                        <div>
                          <h5 className="ud-attached-opp-title">Business Opportunity</h5>
                          <span className="ud-attached-opp-sub">Direct Selling | Team Support | Commissions</span>
                        </div>
                      </div>
                      <button className="ud-btn-learn-more">Learn More</button>
                    </div>

                    <div className="ud-attached-opp-card">
                      <div className="ud-attached-opp-left">
                        <img src={userAvatarImg} alt="" className="ud-attached-opp-icon" />
                        <div>
                          <h5 className="ud-attached-opp-title">Business Opportunity</h5>
                          <span className="ud-attached-opp-sub">Flexible Working | High Growth | Mentorship</span>
                        </div>
                      </div>
                      <button className="ud-btn-learn-more">Learn More</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* View All Button below Post 2 (Figma level with Leaders View All) */}
              <button className="ud-btn-view-all-wide ud-feed-view-all">View All →</button>
            </div>


            {/* Trainers & Leaders Column (Middle Column: 423px) */}
            <div className="ud-trainers-column">
              {/* Trainers Box (Figma Frame 230: 423x275px) */}
              <div className="ud-side-card ud-trainers-card">
                <div className="ud-side-card-header">
                  <h3 className="ud-side-card-title">Trainers</h3>
                  <a href="#trainers" className="ud-side-card-view-all">View All →</a>
                </div>
                <div className="ud-trainers-grid">
                  {trainers.map((t, idx) => (
                    <div key={idx} className="ud-trainer-card">
                      <div className="ud-trainer-avatar-wrap">
                        <img src={userAvatarImg} alt={t.name} />
                      </div>
                      <h4 className="ud-trainer-name">{t.name}</h4>
                      <span className="ud-trainer-role">{t.role}</span>
                      <span className="ud-trainer-stat">{t.network}</span>
                      <span className="ud-trainer-stat">{t.followers}</span>
                      <button className="ud-btn-trainer-follow">Follow</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaders Box (Figma Frame 231: 423x510px) */}
              <div className="ud-side-card ud-leaders-card">
                <div className="ud-side-card-header">
                  <h3 className="ud-side-card-title"># Leaders</h3>
                  <a href="#leaders" className="ud-side-card-view-all">View All →</a>
                </div>
                <div className="ud-leaders-list">
                  {leaders.map((lead, idx) => (
                    <div key={idx} className="ud-leader-item">
                      <div className="ud-leader-avatar">
                        <img src={userAvatarImg} alt={lead.name} />
                      </div>
                      <div className="ud-leader-info">
                        <span className="ud-leader-name">{lead.name}</span>
                        <span className="ud-leader-role">{lead.role}</span>
                      </div>
                      <div className="ud-leader-actions">
                        <button className="ud-btn-lead-msg">Message</button>
                        <button className="ud-btn-lead-conn">Connect</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── PANEL 3: RIGHT PANEL (SERVICES, EVENTS & GROUPS) ── */}
        <aside className="ud-sidebar-right">
          {/* Services & Market place (Figma Frame 138: 403x605px) */}
          <div className="ud-right-box ud-services-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title">✨ Services &amp; Market place</h3>
              <a href="#services" className="ud-side-card-view-all">View All →</a>
            </div>
            <div className="ud-services-list">
              {services.map((srv, idx) => (
                <div key={idx} className="ud-service-item">
                  <img src={srv.thumb} alt={srv.title} className="ud-service-thumb" />
                  <div className="ud-service-content">
                    <h4 className="ud-service-name">{srv.title}</h4>
                    <p className="ud-service-desc">{srv.desc}</p>
                    <div className="ud-service-meta-row">
                      <span className="ud-service-loc">📍 {srv.location}</span>
                      <div className="ud-service-socials">
                        <span>💬</span>
                        <span>📷</span>
                        <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <button className="ud-btn-view-details">View Details →</button>
                </div>
              ))}
            </div>
            <button className="ud-btn-view-all-wide">View All →</button>
          </div>

          {/* Upcoming Events (Figma Frame 44) */}
          <div className="ud-right-box ud-events-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title">Upcoming Events</h3>
              <a href="#events" className="ud-side-card-view-all">View All →</a>
            </div>
            <div className="ud-events-mini-list">
              {upcomingEvents.map((ev, idx) => (
                <div key={idx} className="ud-event-mini-item">
                  <div className="ud-event-mini-date">
                    <span className="ev-date-num">{ev.date}</span>
                    <span className="ev-date-mo">{ev.month}</span>
                  </div>
                  <div className="ud-event-mini-info">
                    <h5 className="ev-mini-name">{ev.title}</h5>
                    <span className="ev-mini-meta">📍 {ev.type} • Join Now →</span>
                  </div>
                  <button className="ud-btn-view-all-pill">View All →</button>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Groups (Figma Frame 136: 403x227px) */}
          <div className="ud-right-box ud-groups-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title">👥 Popular Groups</h3>
              <a href="#groups" className="ud-side-card-view-all">View All →</a>
            </div>
            <div className="ud-groups-list">
              {popularGroups.map((grp, idx) => (
                <div key={idx} className="ud-group-item">
                  <div className="ud-group-avatar">👥</div>
                  <div className="ud-group-info">
                    <h5 className="ud-group-name">{grp.name}</h5>
                    <span className="ud-group-stats">{grp.members}</span>
                  </div>
                  <button className="ud-btn-join-group">Join</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
          </div>

          {/* ───────────────── BOTTOM HORIZONTAL CAROUSEL: SCROLL OPPORTUNITIES ───────────────── */}
          <section className="ud-bottom-opportunities-section">
            <div className="ud-opp-header">
              <h2 className="ud-opp-title">Scroll Opportunities</h2>
              <p className="ud-opp-subtitle">Discover the best opportunities for your growth</p>
            </div>

            <div className="ud-opp-cards-row">
              {/* Card 1: Digital Marketing */}
              <div className="ud-opp-card">
                <div className="ud-opp-img-wrap">
                  <img src={oppDigitalImg} alt="Digital Marketing" className="ud-opp-img" />
                </div>
                <div className="ud-opp-card-body">
                  <h3 className="ud-opp-card-title">Digital Marketing Specialist</h3>
                  <div className="ud-opp-pill-row">
                    <span className="ud-opp-pill">Work from Home</span>
                    <span className="ud-opp-pill">High Earning</span>
                  </div>
                  <div className="ud-opp-footer">
                    <span className="ud-opp-price">₹ 25k - 75k / month</span>
                    <button className="ud-btn-apply">Apply Now →</button>
                  </div>
                </div>
              </div>

              {/* Card 2: Leadership Program */}
              <div className="ud-opp-card">
                <div className="ud-opp-img-wrap">
                  <img src={oppLeadershipImg} alt="Leadership Program" className="ud-opp-img" />
                  <span className="ud-opp-badge-new">New</span>
                </div>
                <div className="ud-opp-card-body">
                  <h3 className="ud-opp-card-title">Leadership Program</h3>
                  <div className="ud-opp-pill-row">
                    <span className="ud-opp-pill">Build Team</span>
                    <span className="ud-opp-pill">Bonus</span>
                  </div>
                  <div className="ud-opp-footer">
                    <span className="ud-opp-price">₹ 50k - 2L / month</span>
                    <button className="ud-btn-apply">Apply Now →</button>
                  </div>
                </div>
              </div>

              {/* Card 3: Health & Wellness */}
              <div className="ud-opp-card ud-opp-card-with-nav">
                <div className="ud-opp-img-wrap">
                  <img src={oppWellnessImg} alt="Health &amp; Wellness" className="ud-opp-img" />
                </div>
                <div className="ud-opp-card-body">
                  <h3 className="ud-opp-card-title">Health &amp; Wellness Specialist</h3>
                  <div className="ud-opp-pill-row">
                    <span className="ud-opp-pill">High Demand</span>
                  </div>
                  <div className="ud-opp-footer">
                    <span className="ud-opp-price">₹ 10k - 50k / month</span>
                    <button className="ud-btn-apply">Apply Now →</button>
                  </div>
                </div>
                <button className="ud-opp-carousel-arrow" title="Next">›</button>
              </div>

              {/* Unlock Your Full Potential Card (White frame base + inner dark banner) */}
              <div className="ud-potential-frame">
                <div
                  className="ud-opp-card ud-potential-card"
                  style={{ backgroundImage: `url(${unlockPotentialBg})` }}
                >
                  <h3 className="ud-potential-title">
                    Unlock Your<br />Full Potential
                  </h3>
                  <p className="ud-potential-desc">
                    Join the Fortaa community and start your journey to success.
                  </p>
                  <button className="ud-btn-join-now">Join Now →</button>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────────── FOOTER ───────────────── */}
          <footer className="ud-footer">
            <div className="ud-footer-inner">
              <div className="ud-footer-links">
                <a href="#about">About Us</a>
                <span>|</span>
                <a href="#contact">Contact Us</a>
                <span>|</span>
                <a href="#privacy">Privacy Policy</a>
                <span>|</span>
                <a href="#terms">Terms &amp; Conditions</a>
                <span>|</span>
                <a href="#help">Help Center</a>
              </div>
              <div className="ud-footer-copy">
                © 2026 Fortaa. All rights reserved.
              </div>
              <button
                className="ud-btn-scroll-top"
                onClick={() => {
                  const el = document.getElementById('ud-content-scroll-container');
                  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Scroll to Up ↑
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
