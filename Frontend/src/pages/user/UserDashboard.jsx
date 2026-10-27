import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import unlockPotentialBg from '../../assets/dashboard/unlock_potential_bg.png';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');
  const [postText, setPostText] = useState('');

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
    { label: 'Home', icon: '🏠' },
    { label: 'My Profile', icon: '👤' },
    { label: 'Services', icon: '⚡' },
    { label: 'My Team', icon: '👥' },
    { label: 'Following', icon: '🌐' },
    { label: 'Market Place', icon: '🛒' },
    { label: 'Companies', icon: '🏢' },
    { label: 'Products', icon: '📦' },
    { label: 'Leaders', icon: '👔' },
    { label: 'Promotions', icon: '🏷️' },
    { label: 'Events', icon: '📅' },
    { label: 'News & Updates', icon: '🔄' },
    { label: 'Messages', icon: '💬' },
    { label: 'Groups', icon: '👥' },
    { label: 'Resources', icon: '📚' },
    { label: 'Settings', icon: '⚙️' },
  ];

  // Quick Action Buttons
  const quickActions = [
    { label: 'Create Post', icon: '✍️', color: '#E91E8C' },
    { label: 'Add Photo', icon: '📷', color: '#D51CFD' },
    { label: 'Share Market Place', icon: '🛍️', color: '#10B981' },
    { label: 'Invite Team', icon: '👥', color: '#3B82F6' },
    { label: 'Join Group', icon: '🤝', color: '#8B5CF6' },
    { label: 'Go Live', icon: '📡', color: '#EF4444' },
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

        {/* Global Search Bar */}
        <div className="ud-search-wrapper">
          <span className="ud-search-icon">🔍</span>
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
          {/* <button
            className="ud-icon-circle-btn"
            title="Log Out"
            onClick={handleLogout}
            style={{ fontSize: '14px', background: '#FEE2E2', borderColor: '#FECACA' }}
          > */}
            {/* 🚪 */}
          {/* </button> */}

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

      {/* ───────────────── MAIN WRAPPER: PINNED SIDEBAR + SCROLLABLE RIGHT CONTENT ───────────────── */}
      <div className="ud-main-wrapper">
        {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PINNED) ── */}
        <aside className="ud-sidebar-left">
          <nav className="ud-nav-list">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`ud-nav-link ${activeTab === item.label ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.label);
                  if (item.label === 'My Profile') navigate('/profile');
                }}
              >
                <span className="ud-nav-icon">{item.icon}</span>
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
            <span className="ud-promo-dim">104 × 62</span>
          </div>

          {/* Sidebar Mini Brand Footer */}
          <div className="ud-sidebar-bottom-brand">
            <img src={logoIconImg} alt="" className="ud-sbb-icon" />
            <span className="ud-sbb-name">FORTAA</span>
          </div>
        </aside>

        {/* ── SCROLLABLE RIGHT CONTAINER ── */}
        <div className="ud-content-scroll-container" id="ud-content-scroll-container">
          <div className="ud-content-columns">
            {/* ── PANEL 2: MAIN FEED & DISCOVERY ── */}
            <main className="ud-feed-main">
          {/* User Hero Identity Banner */}
          <div className="ud-hero-banner">
            <div className="ud-hero-left">
              <div className="ud-hero-avatar-wrap">
                <img src={userAvatarImg} alt={userName} className="ud-hero-avatar" />
              </div>
              <div className="ud-hero-meta">
                <div className="ud-hero-name-row">
                  <h2 className="ud-hero-name">{userName}</h2>
                  <span className="ud-badge-pill ud-badge-gold">Index Technology</span>
                  <span className="ud-badge-pill ud-badge-silver">{userRole}</span>
                </div>
                <button className="ud-btn-view-profile" onClick={() => navigate('/profile')}>View My Profile</button>
                <div className="ud-hero-stats-row">
                  <div className="ud-stat-item">
                    <span className="ud-stat-icon">👥</span>
                    <div>
                      <span className="ud-stat-val">248</span>
                      <span className="ud-stat-label">Network</span>
                    </div>
                  </div>
                  <div className="ud-stat-item">
                    <span className="ud-stat-icon">👤</span>
                    <div>
                      <span className="ud-stat-val">12</span>
                      <span className="ud-stat-label">Followers</span>
                    </div>
                  </div>
                  <div className="ud-stat-item">
                    <span className="ud-stat-icon">🌐</span>
                    <div>
                      <span className="ud-stat-val">1,25,450</span>
                      <span className="ud-stat-label">Following</span>
                    </div>
                  </div>
                  <div className="ud-stat-item">
                    <span className="ud-stat-icon">📊</span>
                    <div>
                      <span className="ud-stat-val">85%</span>
                      <span className="ud-stat-label">Total Post</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Capsules */}
          <div className="ud-quick-actions-bar">
            {quickActions.map((qa, i) => (
              <button key={i} className="ud-quick-btn">
                <span className="ud-quick-icon">{qa.icon}</span>
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

              {/* Sample Feed Post 1 */}
              <div className="ud-post-card">
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

              {/* Sample Feed Post 2 */}
              <div className="ud-post-card">
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
                <button className="ud-btn-view-all-wide">View All →</button>
              </div>
            </div>


            {/* Trainers & Leaders Column (Right of center) */}
            <div className="ud-trainers-column">
              {/* Trainers Box */}
              <div className="ud-side-card">
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

              {/* Leaders Box */}
              <div className="ud-side-card" style={{ marginTop: 14 }}>
                <div className="ud-side-card-header">
                  <h3 className="ud-side-card-title">⚡ Leaders</h3>
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
                <button className="ud-btn-view-all-wide">View All →</button>
              </div>
            </div>
          </div>
        </main>

        {/* ── PANEL 3: RIGHT PANEL (SERVICES, EVENTS & GROUPS) ── */}
        <aside className="ud-sidebar-right">
          {/* Services & Market place */}
          <div className="ud-right-box">
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

          {/* Upcoming Events */}
          <div className="ud-right-box" style={{ marginTop: 14 }}>
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

          {/* Popular Groups */}
          <div className="ud-right-box" style={{ marginTop: 14 }}>
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
