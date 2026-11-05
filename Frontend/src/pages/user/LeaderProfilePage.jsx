import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import { fetchUserProfile } from '../../services/user.service';
import {
  sendFollowRequest,
  unfollowUser,
} from '../../services/follow.service';

// React Icons
import {
  FaCrown,
  FaCamera,
  FaMedal,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaUserCheck,
  FaBriefcase,
  FaStar,
  FaGlobe,
  FaQuoteLeft,
  FaGlobeAmericas,
  FaHeadset,
  FaRegCommentDots,
} from 'react-icons/fa';
import {
  HiChatAlt2,
  HiEye,
  HiUserGroup,
  HiShare,
  HiCurrencyDollar,
  HiOutlineClock,
  HiArrowRight,
  HiLightBulb,
  HiTrendingUp,
  HiSpeakerphone,
  HiRefresh,
  HiUserAdd,
  HiCalendar,
  HiSparkles,
} from 'react-icons/hi';
import { MdLanguage, MdCampaign } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiShare2 } from 'react-icons/fi';

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

            {/* TOP ROW: Hero Profile Banner (left) + Let's Grow Together (right, Frame 320: 316x179px) */}
            <div className="lp-top-row-banner">
              
              {/* HERO PROFILE BANNER (Matching Figma 2nd image exactly) */}
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
                      <FaCrown className="lp-crown-icon" />
                      <span>Top Leader</span>
                    </div>
                    {/* Camera Icon Pill at Bottom Right */}
                    <div className="lp-avatar-camera-btn" title="Profile Photo">
                      <FaCamera size={13} color="#1E0241" />
                    </div>
                  </div>

                  {/* Hero Details */}
                  <div className="lp-hero-details">
                    {/* Name & Rank Pill */}
                    <div className="lp-hero-title-row">
                      <h1 className="lp-hero-name">{leader.name}</h1>
                      <div className="lp-hero-rank-pill">
                        <FaMedal className="lp-rank-medal" />
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
                        <FaMapMarkerAlt className="lp-meta-icon" /> {leader.location}
                      </span>
                      <span className="lp-hero-meta-item">
                        <FaCalendarAlt className="lp-meta-icon" /> {leader.joinedDate || 'Joined Jan 2013'}
                      </span>
                      <span className="lp-hero-meta-item">
                        <FaUsers className="lp-meta-icon" /> Followers
                      </span>
                      <span className="lp-hero-meta-item">
                        <FaUserCheck className="lp-meta-icon" /> Following
                      </span>
                    </div>

                    {/* Quote */}
                    <p className="lp-hero-quote">
                      “{leader.quote}”
                    </p>

                    {/* Action Buttons Row */}
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
                        <FaRegCommentDots size={16} />
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        className="lp-btn-share"
                        onClick={handleShareProfile}
                      >
                        <FiShare2 size={16} />
                        <span>Share Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* LET'S GROW TOGETHER BANNER (Frame 320: 316px x 179px, linear-gradient(90deg, #563E8B 0%, #8518F1 100%)) */}
              <div
                className="lp-promo-banner"
                style={{
                  backgroundImage: `url(${leaderPromoBg})`,
                }}
              >
                <h3 className="lp-promo-title">Let’s Grow Together</h3>
                <p className="lp-promo-text">
                  Connect, collaborate and create new opportunities together.
                </p>
                {/* Frame 105: 163px x 30px white button, text #9E04C3 */}
                <button
                  type="button"
                  className="lp-promo-btn"
                  onClick={() => {
                    handleFollowToggle();
                    toast.success('Connection request sent!');
                  }}
                >
                  <span className="lp-promo-btn-text">Connect Now</span>
                  <HiArrowRight className="lp-promo-btn-arrow" />
                </button>
              </div>

            </div>

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
                      <FaMapMarkerAlt className="lp-about-icon text-red" />
                      <div className="lp-about-info">
                        <span className="lp-about-subval">{leader.location}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <FaBriefcase className="lp-about-icon text-amber" />
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Experience</span>
                        <span className="lp-about-val">{leader.experience}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <FaStar className="lp-about-icon text-gold" />
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Specialization</span>
                        <span className="lp-about-val">{leader.specialization}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <MdLanguage className="lp-about-icon text-indigo" />
                      <div className="lp-about-info">
                        <span className="lp-about-lbl">Language</span>
                        <span className="lp-about-val">{leader.language}</span>
                      </div>
                    </div>

                    <div className="lp-about-row">
                      <FaGlobe className="lp-about-icon text-blue" />
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
                    <FaQuoteLeft className="lp-quote-icon" />
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
                          <HiCurrencyDollar size={16} color="#059669" />
                          <div>
                            <span className="lp-metric-val">$500 - $10,000</span>
                            <span className="lp-metric-lbl">Investment</span>
                          </div>
                        </div>
                        <div className="lp-opp-metric">
                          <HiOutlineClock size={16} color="#4F46E5" />
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
                        <MdCampaign size={24} color="#7C3AED" />
                      </div>
                      <span className="lp-skill-name">Digital Marketing</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle magenta">
                        <FaHeadset size={20} color="#DB2777" />
                      </div>
                      <span className="lp-skill-name">Customer Services</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle amber">
                        <HiLightBulb size={24} color="#D97706" />
                      </div>
                      <span className="lp-skill-name">Project Management</span>
                    </div>

                    <div className="lp-skill-item">
                      <div className="lp-skill-circle cyan">
                        <HiTrendingUp size={24} color="#0284C7" />
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
                        <FaCrown size={20} color="#2563EB" />
                      </div>
                      <span className="lp-achieve-title">Top Leader</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge orange">
                        <HiTrendingUp size={20} color="#EA580C" />
                      </div>
                      <span className="lp-achieve-title">Growth Mentor</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge teal">
                        <FaGlobeAmericas size={20} color="#059669" />
                      </div>
                      <span className="lp-achieve-title">Community</span>
                      <span className="lp-achieve-tier">Diamond</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge gold">
                        <FaUsers size={20} color="#CA8A04" />
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
                        <HiSpeakerphone size={18} color="#7C3AED" />
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
                      <button type="button" className="lp-act-dots" title="More options">
                        <BsThreeDotsVertical size={14} />
                      </button>
                    </div>

                    {/* Activity 2 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <HiRefresh size={18} color="#7C3AED" />
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
                      <button type="button" className="lp-act-dots" title="More options">
                        <BsThreeDotsVertical size={14} />
                      </button>
                    </div>

                    {/* Activity 3 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <HiUserAdd size={18} color="#7C3AED" />
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
                      <button type="button" className="lp-act-dots" title="More options">
                        <BsThreeDotsVertical size={14} />
                      </button>
                    </div>

                    {/* Activity 4 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <HiRefresh size={18} color="#7C3AED" />
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
                      <button type="button" className="lp-act-dots" title="More options">
                        <BsThreeDotsVertical size={14} />
                      </button>
                    </div>

                    {/* Activity 5 */}
                    <div className="lp-activity-item">
                      <div className="lp-act-icon-wrap">
                        <HiCalendar size={18} color="#7C3AED" />
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
                      <button type="button" className="lp-act-dots" title="More options">
                        <BsThreeDotsVertical size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Top Network, Top Leaders, Quick Actions (Frame 325x144px) */}
              <div className="lp-col-right">

                {/* Card 1: Top Network */}
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

                {/* Card 2: Top Leaders List */}
                <div className="lp-card lp-top-leaders-card">
                  <div className="lp-card-head-row">
                    <div className="lp-top-title-wrap">
                      <HiSparkles className="lp-top-icon" />
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

                {/* Card 3: Quick Actions (Frame 325px x 144px, border #D9D9D9, bg #F5FDFF) */}
                <div className="lp-card lp-quick-actions-card">
                  <h3 className="lp-card-title">Quick Actions</h3>

                  {/* 4 horizontal action items matching Figma */}
                  <div className="lp-quick-horizontal-row">
                    <button
                      type="button"
                      className="lp-quick-action-btn"
                      onClick={handleMessageClick}
                    >
                      <div className="lp-quick-action-icon-wrap">
                        <HiChatAlt2 size={24} color="#7C3AED" />
                      </div>
                      <span className="lp-quick-action-label">Send Message</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-action-btn"
                      onClick={() => {
                        setActiveTab('Network');
                        toast.success('Navigated to Network view');
                      }}
                    >
                      <div className="lp-quick-action-icon-wrap">
                        <HiEye size={24} color="#7C3AED" />
                      </div>
                      <span className="lp-quick-action-label">View Network</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-action-btn"
                      onClick={() => {
                        toast.success(`Request sent to join ${leader.name}'s team!`);
                      }}
                    >
                      <div className="lp-quick-action-icon-wrap">
                        <HiUserGroup size={24} color="#7C3AED" />
                      </div>
                      <span className="lp-quick-action-label">Join Team</span>
                    </button>

                    <button
                      type="button"
                      className="lp-quick-action-btn"
                      onClick={handleShareProfile}
                    >
                      <div className="lp-quick-action-icon-wrap">
                        <HiShare size={24} color="#7C3AED" />
                      </div>
                      <span className="lp-quick-action-label">Share Profile</span>
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
