import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import { fetchUserProfile } from '../../services/user.service';
import {
  sendFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  fetchUserSocialCounts,
} from '../../services/follow.service';

// Assets
import leaderHeroBg from '../../assets/leader_hero_wave_bg.png';
import leaderPromoBg from '../../assets/leader_promo_neon_bg.png';
import leaderOppFlower from '../../assets/leader_opp_flower.png';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';

import './LeaderProfilePage.css';

// Preset Leaders catalog for fast fallback lookup matching Figma
const PRESET_LEADERS = {
  '1': {
    id: 1,
    name: 'Vikram Yadav',
    username: 'vikramyadav',
    level: 'Diamond Leader',
    company: 'Index Technology',
    location: 'Hyderabad, India',
    joinedDate: 'Joined Mar 2018',
    followers: '3.9k',
    following: '2.1k',
    posts: '45',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    quote: 'Success is not a destination, it’s a journey of continuous growth.',
    bio: 'Motivated and passionate networker with a vision to create financial freedom and help others grow.',
    experience: '6+ years in Digital Networking',
    specialization: 'Leadership Development, Team Building, Growth Strategy',
    language: 'Hindi, English, Telugu',
    website: 'www.vikramyadav.io',
  },
  '2': {
    id: 2,
    name: 'Kristin Watson',
    username: 'kristinwatson',
    level: 'Silver Leader',
    company: 'Index Technology',
    location: 'Delhi, India',
    joinedDate: 'Joined Sep 2019',
    followers: '9k',
    following: '1.4k',
    posts: '62',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    quote: 'Small steps every day lead to big results.',
    bio: 'Business consultant and mentor committed to empowering teams and building robust network funnels.',
    experience: '5+ years in Network Marketing',
    specialization: 'Digital Marketing, Team Coaching, E-commerce',
    language: 'Hindi, English',
    website: 'www.kristinwatson.com',
  },
  '3': {
    id: 3,
    name: 'Arlene McCoy',
    username: 'arlenemccoy',
    level: 'Diamond Leader',
    company: 'Fortaa Global',
    location: 'Bangalore, India',
    joinedDate: 'Joined Feb 2017',
    followers: '12k',
    following: '3.2k',
    posts: '110',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    quote: 'Empowering individuals to achieve their greatest financial milestones.',
    bio: 'Senior network leader helping over 1,000 entrepreneurs launch sustainable online ventures.',
    experience: '7+ years in Team Leadership',
    specialization: 'Mentorship, High-Ticket Sales, Direct Marketing',
    language: 'English, Kannada, Hindi',
    website: 'www.arlenemccoy.org',
  },
  'default': {
    id: 'rahul',
    name: 'Rahul sharma',
    username: 'rahulsharma',
    level: 'Silver Leader',
    company: 'Index Technology',
    location: 'Mumbai, India',
    joinedDate: 'Joined Jan 2013',
    followers: '3.9k',
    following: '2.1k',
    posts: '45',
    avatar: userAvatarRahul,
    quote: 'Success is not a destination, it’s a journey of continuous growth.',
    bio: 'Motivated and passionate networker with a vision to create financial freedom and help others grow.',
    experience: '5+ years in Network Marketing',
    specialization: 'Leadership Development, Team Building, Digital Marketing',
    language: 'Hindi, English, Marathi',
    website: 'ww.youtubecom',
  },
};

const TOP_LEADERS_WIDGET = [
  { id: 101, name: 'Arlene', role: 'Diamond Leader', followers: '3.8k Followers', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
  { id: 102, name: 'Kyle', role: 'Silver Leader', followers: '4k Followers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { id: 103, name: 'Kristin', role: 'Gold Leader', followers: '1.2k Followers', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
  { id: 104, name: 'Cameron', role: 'Platinum Leader', followers: '2k Followers', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
  { id: 105, name: 'Angel', role: 'Gold Leader', followers: '1.2k Followers', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' },
  { id: 106, name: 'Ann', role: 'Platinum Leader', followers: '2k Followers', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80' },
];

export default function LeaderProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [topFollowMap, setTopFollowMap] = useState({});
  const [leader, setLeader] = useState(() => {
    // Check if leader passed in route state
    if (location.state?.leader) {
      const l = location.state.leader;
      return {
        ...PRESET_LEADERS['default'],
        id: l.id || id,
        name: l.name || 'Rahul sharma',
        username: (l.name || 'rahulsharma').toLowerCase().replace(/\s+/g, ''),
        level: l.levelTitle || `${l.level || 'Silver'} Leader`,
        location: l.location || 'Mumbai, India',
        followers: l.followers || '3.9k',
        following: l.following || '2.1k',
        posts: l.posts || '45',
        avatar: l.avatar || userAvatarRahul,
        quote: l.quote || PRESET_LEADERS['default'].quote,
      };
    }
    // Check preset map
    if (id && PRESET_LEADERS[id]) {
      return PRESET_LEADERS[id];
    }
    return PRESET_LEADERS['default'];
  });

  // Load dynamic profile if numeric id and not fully populated from state
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (!id || id === 'rahul') return;
      try {
        const fetched = await fetchUserProfile(id);
        if (fetched && isMounted) {
          setLeader((prev) => ({
            ...prev,
            id: fetched.id,
            name: fetched.name || prev.name,
            username: fetched.username || prev.username,
            location: fetched.location || prev.location,
            bio: fetched.bio || prev.bio,
            experience: fetched.experience || prev.experience,
            specialization: fetched.skills || prev.specialization,
            avatar: fetched.avatar_url || fetched.avatarUrl || prev.avatar,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch server profile for leader id:', id, err);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle follow / unfollow
  const handleFollowToggle = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (nextState) {
      toast.success(`You are now following ${leader.name}`);
      try {
        if (typeof leader.id === 'number') {
          await sendFollowRequest(leader.id);
        }
      } catch {
        // Optimistic UI
      }
    } else {
      toast.success(`Unfollowed ${leader.name}`);
      try {
        if (typeof leader.id === 'number') {
          await unfollowUser(leader.id);
        }
      } catch {
        // Optimistic UI
      }
    }
  };

  const handleTopFollowToggle = (topId, topName) => {
    setTopFollowMap((prev) => {
      const next = !prev[topId];
      if (next) {
        toast.success(`Following ${topName}`);
      } else {
        toast.success(`Unfollowed ${topName}`);
      }
      return { ...prev, [topId]: next };
    });
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Leader profile URL copied to clipboard!');
    } else {
      toast.success('Leader profile URL copied!');
    }
  };

  const handleMessageClick = () => {
    navigate(`/messages?user=${leader.id}&name=${encodeURIComponent(leader.name)}`);
  };

  return (
    <div className="lp-root-container">
      {/* Global Unified Header */}
      <UserHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="lp-main-wrapper">
        {/* Pinned Left Sidebar */}
        <UserSidebar
          activeTab="Leaders"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Scrollable Main Area */}
        <div className="lp-scroll-container">
          <div className="lp-content-body">

            {/* Back Button / Navigation link */}
            <div className="lp-breadcrumb-row">
              <button
                type="button"
                className="lp-back-btn"
                onClick={() => navigate('/leaders')}
                title="Back to Leaders"
              >
                ‹ Back to Leaders
              </button>
            </div>

            {/* HERO PROFILE BANNER (936px x 232px) */}
            <section
              className="lp-hero-banner"
              style={{
                backgroundImage: `url(${leaderHeroBg})`,
              }}
            >
              <div className="lp-hero-inner">
                {/* Avatar with Badge & Camera */}
                <div className="lp-hero-avatar-wrap">
                  <div className="lp-hero-avatar-box">
                    <img
                      src={leader.avatar}
                      alt={leader.name}
                      className="lp-hero-avatar-img"
                      onError={(e) => {
                        e.currentTarget.src = userAvatarRahul;
                      }}
                    />
                  </div>
                  {/* Top Leader Gold Pill */}
                  <div className="lp-avatar-crown-pill">
                    <span className="lp-crown-icon">👑</span>
                    <span>Top Leader</span>
                  </div>
                  {/* Camera Icon Pill at Bottom Right */}
                  <div className="lp-avatar-camera-btn" title="Profile Photo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E0241">
                      <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
                      <path fillRule="evenodd" d="M2 7a2 2 0 012-2h3.172a2 2 0 001.414-.586l.828-.828A2 2 0 0110.828 3h2.344a2 2 0 011.414.586l.828.828A2 2 0 0016.828 5H20a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm10 10a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Hero Details */}
                <div className="lp-hero-details">
                  {/* Name & Title */}
                  <div className="lp-hero-title-row">
                    <h1 className="lp-hero-name">{leader.name}</h1>
                    <div className="lp-hero-rank-pill">
                      <span className="lp-rank-medal">🏅</span>
                      <span className="lp-rank-company">{leader.company || 'Index Technology'}</span>
                      <span className="lp-rank-divider">|</span>
                      <span className="lp-rank-level">{leader.level || 'Silver Leader'}</span>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="lp-hero-username">
                    User Name: {leader.username}
                  </div>

                  {/* Meta Row: Location, Joined, Followers, Following */}
                  <div className="lp-hero-meta-row">
                    <span className="lp-hero-meta-item">
                      <span className="lp-meta-icon">📍</span> {leader.location}
                    </span>
                    <span className="lp-hero-meta-item">
                      <span className="lp-meta-icon">👥</span> {leader.joinedDate || 'Joined Jan 2013'}
                    </span>
                    <span className="lp-hero-meta-item">
                      <span className="lp-meta-icon">⭕</span> <strong>{leader.followers}</strong> Followers
                    </span>
                    <span className="lp-hero-meta-item">
                      <span className="lp-meta-icon">👤</span> <strong>{leader.following}</strong> Following
                    </span>
                  </div>

                  {/* Quote */}
                  <p className="lp-hero-quote">
                    “{leader.quote}”
                  </p>

                  {/* Buttons Row */}
                  <div className="lp-hero-actions-row">
                    <button
                      type="button"
                      className={`lp-btn-follow ${isFollowing ? 'following' : ''}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Following ✓' : 'Follow'}
                    </button>

                    <button
                      type="button"
                      className="lp-btn-message"
                      onClick={handleMessageClick}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                      Message
                    </button>

                    <button
                      type="button"
                      className="lp-btn-share"
                      onClick={handleShareProfile}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share Profile
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* TABS BAR (802px x 35px) */}
            <div className="lp-tabs-bar">
              {[
                { id: 'Overview', label: 'Overview' },
                { id: 'About Us', label: 'About Us' },
                { id: 'Network', label: `Network (${leader.followers || '2.6k'})` },
                { id: 'Post', label: `Post (${leader.posts || '45'})` },
                { id: 'Opportunity', label: 'Opportunity (45)' },
                { id: 'Gallery', label: 'Gallery (24)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`lp-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* THREE COLUMNS GRID */}
            <div className="lp-columns-grid">

              {/* LEFT COLUMN: About Leader & Featured Opportunities */}
              <div className="lp-col-left">

                {/* Card 1: About [Leader Name] */}
                <div className="lp-card lp-about-card">
                  <h3 className="lp-card-title">About {leader.name}</h3>
                  <p className="lp-about-bio">
                    {leader.bio}
                  </p>

                  <div className="lp-about-details-list">
                    <div className="lp-about-row">
                      <span className="lp-about-icon">📍</span>
                      <div className="lp-about-info">
                        <span className="lp-about-subval">{leader.location}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <span className="lp-about-icon">💼</span>
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Experience</span>
                        <span className="lp-about-val">{leader.experience}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <span className="lp-about-icon">⭐</span>
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Specialization</span>
                        <span className="lp-about-val">{leader.specialization}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <span className="lp-about-icon">🔤</span>
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Language</span>
                        <span className="lp-about-val">{leader.language}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <span className="lp-about-icon">🌐</span>
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Website</span>
                        <a
                          href={`https://${leader.website.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="lp-about-link"
                        >
                          {leader.website}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Motivational Quote Box */}
                  <div className="lp-about-quote-box">
                    <span className="lp-quote-icon">“</span>
                    <p className="lp-quote-text">
                      “Small steps every day lead to big result.”
                    </p>
                    <span className="lp-quote-author">-{leader.name}</span>
                  </div>
                </div>

                {/* Card 2: Featured Opportunities */}
                <div className="lp-card lp-opp-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Featured Opportunities</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => toast.success('Viewing all opportunities')}
                    >
                      View All →
                    </button>
                  </div>

                  {/* Opportunity Thumbnail (Flower image) */}
                  <div className="lp-opp-image-wrap">
                    <img
                      src={leaderOppFlower}
                      alt="Featured Opportunity"
                      className="lp-opp-img"
                    />
                  </div>

                  {/* Content */}
                  <div className="lp-opp-content">
                    <h4 className="lp-opp-heading">Global Business Expansion</h4>

                    {/* Tags */}
                    <div className="lp-opp-tags-row">
                      <span className="lp-opp-tag lp-tag-biz">Business</span>
                      <span className="lp-opp-tag lp-tag-earn">High Earning</span>
                    </div>

                    <p className="lp-opp-desc">
                      Join our growing network and be part of an international business opportunity.
                    </p>

                    {/* Meta stats & CTA */}
                    <div className="lp-opp-footer">
                      <div className="lp-opp-metrics">
                        <div className="lp-opp-metric">
                          <span className="lp-metric-icon">💰</span>
                          <div>
                            <span className="lp-metric-val">$500 - $10,000</span>
                            <span className="lp-metric-lbl">Investment</span>
                          </div>
                        </div>
                        <div className="lp-opp-metric">
                          <span className="lp-metric-icon">⏱️</span>
                          <div>
                            <span className="lp-metric-val">6-24</span>
                            <span className="lp-metric-lbl">Duration</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="lp-opp-btn"
                        onClick={() => toast.success('Opportunity details opened')}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* MIDDLE COLUMN: Skills, Achievements, Recent Activities */}
              <div className="lp-col-center">

                {/* Card 1: Skills (4 circular icons) */}
                <div className="lp-card lp-skills-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Skills</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => toast.success('All skills')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-skills-row">
                    <div className="lp-skill-item">
                      <div className="lp-skill-circle purple">
                        <span className="lp-skill-ico">📱</span>
                      </div>
                      <span className="lp-skill-name">Digital Marketing</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle magenta">
                        <span className="lp-skill-ico">🎧</span>
                      </div>
                      <span className="lp-skill-name">Customer Services</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle amber">
                        <span className="lp-skill-ico">💡</span>
                      </div>
                      <span className="lp-skill-name">Project Management</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle cyan">
                        <span className="lp-skill-ico">📊</span>
                      </div>
                      <span className="lp-skill-name">Business Development</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Achievements (4 badges) */}
                <div className="lp-card lp-achieve-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Achievements</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => toast.success('All achievements')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-achieve-row">
                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge blue">
                        <span className="lp-achieve-ico">👑</span>
                      </div>
                      <span className="lp-achieve-title">Top Leader</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge orange">
                        <span className="lp-achieve-ico">📈</span>
                      </div>
                      <span className="lp-achieve-title">Growth Mentor</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge teal">
                        <span className="lp-achieve-ico">🌐</span>
                      </div>
                      <span className="lp-achieve-title">Community</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge gold">
                        <span className="lp-achieve-ico">👥</span>
                      </div>
                      <span className="lp-achieve-title">Team Builder</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Recent Activities */}
                <div className="lp-card lp-activity-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Recent Activities</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => toast.success('All activities')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-activity-list">
                    {/* Activity 1 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <span className="lp-act-icon">📢</span>
                      </div>
                      <div className="lp-act-content">
                        <div className="lp-act-title-row">
                          <h5 className="lp-act-title">{leader.name} shared a new Opportunity</h5>
                          <span className="lp-act-time">2hr ago</span>
                        </div>
                        <p className="lp-act-desc">
                          Global Business Expansion - Join now & grow together!
                        </p>
                      </div>
                      <button type="button" className="lp-act-dots" title="More options">⋮</button>
                    </div>

                    {/* Activity 2 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <span className="lp-act-icon">🔄</span>
                      </div>
                      <div className="lp-act-content">
                        <div className="lp-act-title-row">
                          <h5 className="lp-act-title">{leader.name} posted a new update</h5>
                          <span className="lp-act-time">5hr ago</span>
                        </div>
                        <p className="lp-act-desc">
                          Success isn’t destination, it’s journey of continuous growth!
                        </p>
                      </div>
                      <button type="button" className="lp-act-dots" title="More options">⋮</button>
                    </div>

                    {/* Activity 3 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <span className="lp-act-icon">👥</span>
                      </div>
                      <div className="lp-act-content">
                        <div className="lp-act-title-row">
                          <h5 className="lp-act-title">{leader.name} added 5 new member to his team</h5>
                          <span className="lp-act-time">1day ago</span>
                        </div>
                        <p className="lp-act-desc">
                          Welcome to our growing family!
                        </p>
                      </div>
                      <button type="button" className="lp-act-dots" title="More options">⋮</button>
                    </div>

                    {/* Activity 4 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <span className="lp-act-icon">🔄</span>
                      </div>
                      <div className="lp-act-content">
                        <div className="lp-act-title-row">
                          <h5 className="lp-act-title">{leader.name} posted a new update</h5>
                          <span className="lp-act-time">5hr ago</span>
                        </div>
                        <p className="lp-act-desc">
                          Success isn’t destination, it’s journey of continuous growth!
                        </p>
                      </div>
                      <button type="button" className="lp-act-dots" title="More options">⋮</button>
                    </div>

                    {/* Activity 5 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <span className="lp-act-icon">📝</span>
                      </div>
                      <div className="lp-act-content">
                        <div className="lp-act-title-row">
                          <h5 className="lp-act-title">{leader.name} created a new event</h5>
                          <span className="lp-act-time">2days ago</span>
                        </div>
                        <p className="lp-act-desc">
                          Leadership summit 2026 - Register Now!
                        </p>
                      </div>
                      <button type="button" className="lp-act-dots" title="More options">⋮</button>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Let's Grow Together, Top Network, Top Leaders, Quick Actions */}
              <div className="lp-col-right">

                {/* Card 1: Let's Grow Together Promo Card */}
                <div
                  className="lp-promo-banner"
                  style={{
                    backgroundImage: `url(${leaderPromoBg})`,
                  }}
                >
                  <h3 className="lp-promo-title">Let's Grow Together</h3>
                  <p className="lp-promo-text">
                    Connect, collaborate and create new opportunities together.
                  </p>
                  <button
                    type="button"
                    className="lp-promo-btn"
                    onClick={() => {
                      handleFollowToggle();
                      toast.success('Connection request sent!');
                    }}
                  >
                    Connect Now →
                  </button>
                </div>

                {/* Card 2: Top Network */}
                <div className="lp-card lp-network-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Top Network ({leader.followers || '2.4k'})</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => toast.success('Network members')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-network-avatars-row">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      alt="member 1"
                      className="lp-net-avatar"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                      alt="member 2"
                      className="lp-net-avatar"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                      alt="member 3"
                      className="lp-net-avatar"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                      alt="member 4"
                      className="lp-net-avatar"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80"
                      alt="member 5"
                      className="lp-net-avatar"
                    />
                    <div className="lp-net-avatar lp-net-more">
                      +2.3k
                    </div>
                  </div>

                  <p className="lp-network-subtext">
                    Your network is growing everyday!
                  </p>
                </div>

                {/* Card 3: Top Leaders List */}
                <div className="lp-card lp-top-leaders-card">
                  <div className="lp-card-head-row">
                    <div className="lp-top-title-wrap">
                      <span className="lp-top-icon">✨</span>
                      <h3 className="lp-card-title">Top Leaders</h3>
                    </div>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => navigate('/leaders')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-top-list">
                    {TOP_LEADERS_WIDGET.map((topLdr) => {
                      const following = !!topFollowMap[topLdr.id];

                      return (
                        <div key={topLdr.id} className="lp-top-row">
                          <img
                            src={topLdr.avatar}
                            alt={topLdr.name}
                            className="lp-top-avatar"
                          />
                          <div className="lp-top-info">
                            <span className="lp-top-name">{topLdr.name}</span>
                            <span className="lp-top-sub">{topLdr.role}</span>
                            <span className="lp-top-followers">{topLdr.followers}</span>
                          </div>
                          <button
                            type="button"
                            className={`lp-top-follow-btn ${following ? 'following' : ''}`}
                            onClick={() => handleTopFollowToggle(topLdr.id, topLdr.name)}
                          >
                            {following ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 4: Quick Actions */}
                <div className="lp-card lp-quick-actions-card">
                  <h3 className="lp-card-title">Quick Actions</h3>

                  <div className="lp-quick-grid">
                    <button
                      type="button"
                      className="lp-quick-item"
                      onClick={handleMessageClick}
                    >
                      <span className="lp-quick-ico">💬</span>
                      <span className="lp-quick-lbl">Send Message</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-item"
                      onClick={() => {
                        setActiveTab('Network');
                        toast.success('Navigated to Network view');
                      }}
                    >
                      <span className="lp-quick-ico">👁️</span>
                      <span className="lp-quick-lbl">View Network</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-item"
                      onClick={() => {
                        toast.success(`Request sent to join ${leader.name}'s team!`);
                      }}
                    >
                      <span className="lp-quick-ico">👥</span>
                      <span className="lp-quick-lbl">Join Team</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-item"
                      onClick={handleShareProfile}
                    >
                      <span className="lp-quick-ico">🔗</span>
                      <span className="lp-quick-lbl">Share Profile</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
