import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import { fetchUserProfile } from '../../services/user.service';
import {
  sendFollowRequest,
  unfollowUser,
  cancelFollowRequest,
  fetchFollowingIds,
  fetchUserSocialCounts,
} from '../../services/follow.service';
import { fetchPosts, fetchLeaders } from '../../services/dashboard.service';
import { joinChat, subscribeToFollowEvents } from '../../services/socket.service';

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
  FaGem,
  FaChevronLeft,
  FaThumbsUp,
  FaShare,
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
import { BsThreeDotsVertical, BsGrid3X3Gap } from 'react-icons/bs';
import { FiShare2 } from 'react-icons/fi';

// Assets
import leaderHeroBg from '../../assets/leader_hero_wave_bg.png';
import leaderPromoBg from '../../assets/leader_promo_neon_bg.png';
import leaderOppFlower from '../../assets/leader_opp_flower.png';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import profileCoverPurple from '../../assets/dashboard/profile_cover_purple.png';

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
];

export default function LeaderProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Current user resolution
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {}
  const currentUserId = storedUser.id || storedUser._id || 1;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileActiveTab, setMobileActiveTab] = useState('Posts');
  const [topFollowMap, setTopFollowMap] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [topLeaders, setTopLeaders] = useState([]);

  // Follow status: 'none' | 'pending' | 'accepted'
  const [followStatus, setFollowStatus] = useState(() => {
    if (location.state?.leader?.follow_status) {
      return location.state.leader.follow_status;
    }
    try {
      const saved = sessionStorage.getItem('fortaa_follow_status_map');
      if (saved) {
        const map = JSON.parse(saved);
        const st = map[id] || map[Number(id)] || map[String(id)];
        if (st) return st;
      }
    } catch {}
    return 'none';
  });

  const updateCachedFollowStatus = (targetId, newStatus) => {
    setFollowStatus(newStatus);
    try {
      const saved = sessionStorage.getItem('fortaa_follow_status_map');
      const map = saved ? JSON.parse(saved) : {};
      map[targetId] = newStatus;
      map[Number(targetId)] = newStatus;
      map[String(targetId)] = newStatus;
      sessionStorage.setItem('fortaa_follow_status_map', JSON.stringify(map));
    } catch {}
  };

  const [leader, setLeader] = useState(() => {
    // Check if leader passed in route state
    if (location.state?.leader) {
      const l = location.state.leader;
      return {
        id: l.id || id,
        name: l.name || 'Leader',
        username: (l.name || 'leader').toLowerCase().replace(/\s+/g, ''),
        level: l.levelTitle || (l.level ? `${l.level} Leader` : 'Leader'),
        levelTitle: l.levelTitle || (l.level ? `${l.level} Leader` : 'Leader'),
        company: l.company_brand || l.company || 'Fortaa',
        location: l.location || 'India',
        followers: l.followers || '0',
        followersCount: l.followersCount || 0,
        following: l.following || '0',
        followingCount: l.followingCount || 0,
        posts: l.posts || '0',
        avatar: l.avatar || userAvatarRahul,
        quote: l.quote || l.bio || '',
        bio: l.bio || '',
        experience: l.experience || '',
        specialization: l.skills || l.specialization || '',
        language: l.language || '',
        website: l.website || l.website_social || '',
        joinedDate: l.created_at ? 'Joined ' + new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
      };
    }
    // Check preset map
    if (id && PRESET_LEADERS[id]) {
      return PRESET_LEADERS[id];
    }
    return PRESET_LEADERS['default'];
  });

  const cleanQuote = (leader.quote || leader.bio || '')
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .trim();

  // Load dynamic profile, actual user posts, social counts, and top leaders
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (!id || id === 'rahul') return;
      try {
        setLoadingPosts(true);
        const [fetched, counts, postsRes, leadersRes] = await Promise.all([
          fetchUserProfile(id),
          fetchUserSocialCounts(id),
          fetchPosts(id, 'mine'),
          fetchLeaders(currentUserId).catch(() => []),
        ]);
        if (isMounted) {
          if (fetched) {
            const joined = fetched.created_at
              ? 'Joined ' + new Date(fetched.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '';
            setLeader((prev) => ({
              ...prev,
              id: fetched.id,
              name: fetched.name || prev.name,
              username: fetched.username || prev.username || (fetched.name || '').toLowerCase().replace(/\s+/g, ''),
              location: fetched.location || (fetched.company_brand ? `${fetched.company_brand}, India` : prev.location),
              bio: fetched.bio || prev.bio,
              experience: fetched.experience || prev.experience,
              specialization: fetched.skills || prev.specialization,
              company: fetched.company_brand || fetched.business_name || prev.company || 'Fortaa',
              avatar: fetched.avatar_url || fetched.avatarUrl || prev.avatar,
              quote: fetched.bio || prev.quote,
              level: fetched.designation || prev.level || 'Leader',
              levelTitle: fetched.designation || prev.levelTitle || 'Leader',
              website: fetched.website_social || prev.website || '',
              joinedDate: joined || prev.joinedDate,
            }));
          }
          if (postsRes) {
            setUserPosts(Array.isArray(postsRes) ? postsRes : []);
          }
          if (leadersRes && Array.isArray(leadersRes) && leadersRes.length > 0) {
            setTopLeaders(leadersRes.slice(0, 6));
          }
          const fCount = counts?.followersCount || 0;
          const fgCount = counts?.followingCount || 0;
          const pCount = counts?.postsCount !== undefined ? counts.postsCount : (postsRes ? postsRes.length : 0);
          setLeader((prev) => ({
            ...prev,
            followers: fCount >= 1000 ? `${(fCount / 1000).toFixed(1)}k` : `${fCount}`,
            followersCount: fCount,
            following: fgCount >= 1000 ? `${(fgCount / 1000).toFixed(1)}k` : `${fgCount}`,
            followingCount: fgCount,
            posts: String(pCount),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch server profile for leader id:', id, err);
      } finally {
        if (isMounted) setLoadingPosts(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [id, currentUserId]);

  // Synchronize follow status from backend & sockets
  useEffect(() => {
    let isMounted = true;
    const targetLeaderId = leader.id || id;
    if (!targetLeaderId) return;

    fetchFollowingIds(currentUserId)
      .then(({ followingIds = [], pendingIds = [] }) => {
        if (!isMounted) return;
        const numTarget = Number(targetLeaderId);
        const isPending = pendingIds.map(Number).includes(numTarget);
        const isFollowing = followingIds.map(Number).includes(numTarget);

        let serverStatus = 'none';
        if (isPending) serverStatus = 'pending';
        else if (isFollowing) serverStatus = 'accepted';

        if (serverStatus !== 'none') {
          updateCachedFollowStatus(targetLeaderId, serverStatus);
        }
      })
      .catch((err) => console.warn('fetchFollowingIds error:', err));

    try {
      joinChat(currentUserId);
      const unsub = subscribeToFollowEvents({
        onFollowAccepted: ({ targetUserId }) => {
          if (String(targetUserId) === String(targetLeaderId)) {
            updateCachedFollowStatus(targetLeaderId, 'accepted');
            toast.success(`${leader.name} accepted your follow request!`);
          }
        },
        onFollowUpdated: (data) => {
          if (data?.targetUserId && String(data.targetUserId) === String(targetLeaderId) && data.status) {
            updateCachedFollowStatus(targetLeaderId, data.status);
          }
        },
      });
      return () => {
        isMounted = false;
        unsub?.();
      };
    } catch {}

    return () => {
      isMounted = false;
    };
  }, [id, leader.id, currentUserId]);

  // Handle follow / unfollow / cancel request
  const handleFollowToggle = async () => {
    const targetId = leader.id || id;
    const targetName = leader.name || 'Leader';

    if (followStatus === 'accepted') {
      const confirm = window.confirm(`Are you sure you want to unfollow ${targetName}?`);
      if (!confirm) return;
      updateCachedFollowStatus(targetId, 'none');
      toast(`Unfollowed ${targetName}`);
      try {
        if (!isNaN(Number(targetId))) {
          await unfollowUser(Number(targetId), currentUserId);
        }
      } catch (err) {
        console.error('unfollowUser error:', err);
      }
    } else if (followStatus === 'pending') {
      const confirm = window.confirm(`Cancel follow request to ${targetName}?`);
      if (!confirm) return;
      updateCachedFollowStatus(targetId, 'none');
      toast('Follow request cancelled', { icon: '✖' });
      try {
        if (!isNaN(Number(targetId))) {
          await cancelFollowRequest(Number(targetId), currentUserId);
        }
      } catch (err) {
        console.error('cancelFollowRequest error:', err);
      }
    } else {
      updateCachedFollowStatus(targetId, 'pending');
      toast.success(`Follow request sent to ${targetName}! 🎉`);
      try {
        if (!isNaN(Number(targetId))) {
          const res = await sendFollowRequest(Number(targetId), currentUserId);
          if (res?.status) {
            updateCachedFollowStatus(targetId, res.status);
          }
        }
      } catch (err) {
        console.error('sendFollowRequest error:', err);
      }
    }
  };

  const renderFollowBtnContent = (isMobileAction = false) => {
    if (followStatus === 'pending') {
      return (
        <>
          <HiOutlineClock className="lp-btn-icon spin-subtle" />
          <span>{isMobileAction ? 'Request Pending' : 'Pending ⏳'}</span>
        </>
      );
    }
    if (followStatus === 'accepted') {
      return (
        <>
          <FaUserCheck className="lp-btn-icon" />
          <span>Following ✓</span>
        </>
      );
    }
    return (
      <>
        <HiUserAdd className="lp-btn-icon" />
        <span>Follow</span>
      </>
    );
  };

  const getFollowBtnClass = (baseClass) => {
    if (followStatus === 'pending') return `${baseClass} pending`;
    if (followStatus === 'accepted') return `${baseClass} following`;
    return baseClass;
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
      {/* ====================================================================
          DESKTOP VIEW (Screen width > 768px)
          ==================================================================== */}
      <div className="lp-desktop-view">
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
                        <FaCalendarAlt className="lp-meta-icon" /> {leader.joinedDate || 'Joined Jan 2024'}
                      </span>
                      <span className="lp-hero-meta-item">
                        <FaUsers className="lp-meta-icon" /> <strong>{leader.followers || '0'}</strong> Followers
                      </span>
                      <span className="lp-hero-meta-item">
                        <FaUserCheck className="lp-meta-icon" /> <strong>{leader.following || '0'}</strong> Following
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
                        className={getFollowBtnClass('lp-btn-follow')}
                        onClick={handleFollowToggle}
                      >
                        {renderFollowBtnContent(false)}
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
                { id: 'Network', label: `Network (${leader.followers || '0'})` },
                { id: 'Post', label: `Post (${leader.posts || '0'})` },
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
                    {leader.bio || 'Network marketing leader and entrepreneur dedicated to team growth and collaboration.'}
                  </p>

                  <div className="lp-about-details-list">
                    {leader.location && (
                      <div className="lp-about-row">
                        <FaMapMarkerAlt className="lp-about-icon text-red" />
                        <div className="lp-about-info">
                          <span className="lp-about-subval">{leader.location}</span>
                        </div>
                      </div>
                    )}

                    {leader.experience && (
                      <div className="lp-about-row">
                        <FaBriefcase className="lp-about-icon text-amber" />
                        <div className="lp-about-info">
                          <span className="lp-about-lbl">Experience</span>
                          <span className="lp-about-val">{leader.experience}</span>
                        </div>
                      </div>
                    )}

                    {leader.specialization && (
                      <div className="lp-about-row">
                        <FaStar className="lp-about-icon text-gold" />
                        <div className="lp-about-info">
                          <span className="lp-about-lbl">Specialization</span>
                          <span className="lp-about-val">{leader.specialization}</span>
                        </div>
                      </div>
                    )}

                    {leader.language && (
                      <div className="lp-about-row">
                        <MdLanguage className="lp-about-icon text-indigo" />
                        <div className="lp-about-info">
                          <span className="lp-about-lbl">Language</span>
                          <span className="lp-about-val">{leader.language}</span>
                        </div>
                      </div>
                    )}

                    {leader.website && (
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
                    )}
                  </div>

                  {/* Motivational Quote Box */}
                  {cleanQuote && (
                    <div className="lp-about-quote-box">
                      <FaQuoteLeft className="lp-quote-icon" />
                      <p className="lp-quote-text">
                        “{cleanQuote}”
                      </p>
                      <span className="lp-quote-author">-{leader.name}</span>
                    </div>
                  )}
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
                    <h3 className="lp-card-title">Recent Posts & Activities</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => setActiveTab('Post')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="lp-activity-list">
                    {userPosts && userPosts.length > 0 ? (
                      userPosts.slice(0, 5).map((p) => (
                        <div key={p.id} className="lp-activity-item">
                          <div className="lp-act-icon-wrap">
                            <HiSpeakerphone size={18} color="#7C3AED" />
                          </div>
                          <div className="lp-act-content">
                            <div className="lp-act-title-row">
                              <h5 className="lp-act-title">{leader.name} published a post</h5>
                              <span className="lp-act-time">
                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <p className="lp-act-desc">
                              {p.content || 'Photo update'}
                            </p>
                          </div>
                          <button type="button" className="lp-act-dots" title="More options">
                            <BsThreeDotsVertical size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="lp-act-empty-box" style={{ padding: '24px 16px', textAlign: 'center' }}>
                        <p className="lp-network-subtext">
                          No recent posts published yet by {leader.name}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Top Network, Top Leaders, Quick Actions (Frame 325x144px) */}
              <div className="lp-col-right">

                {/* Card 1: Top Network */}
                <div className="lp-card lp-network-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Network ({leader.followers || '0'})</h3>
                    <button
                      type="button"
                      className="lp-view-all-link"
                      onClick={() => setActiveTab('Network')}
                    >
                      View All →
                    </button>
                  </div>

                  <p className="lp-network-subtext" style={{ margin: '12px 0' }}>
                    {leader.name} has <strong>{leader.followers || '0'}</strong> followers and is following <strong>{leader.following || '0'}</strong> members in their network.
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
                    {(topLeaders.length > 0 ? topLeaders : TOP_LEADERS_WIDGET).map((topLdr) => {
                      const following = !!topFollowMap[topLdr.id];

                      return (
                        <div
                          key={topLdr.id}
                          className="lp-top-row"
                          onClick={() => navigate(`/leader/${topLdr.id}`, { state: { leader: topLdr } })}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={topLdr.avatar || userAvatarRahul}
                            alt={topLdr.name}
                            className="lp-top-avatar"
                          />
                          <div className="lp-top-info">
                            <span className="lp-top-name">{topLdr.name}</span>
                            <span className="lp-top-sub">{topLdr.levelTitle || topLdr.role || 'Leader'}</span>
                            <span className="lp-top-followers">{topLdr.followers ? `${topLdr.followers} Followers` : ''}</span>
                          </div>
                          <button
                            type="button"
                            className={`lp-top-follow-btn ${following ? 'following' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTopFollowToggle(topLdr.id, topLdr.name);
                            }}
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
      {/* End Desktop View */}

      {/* ====================================================================
          INSTAGRAM-STYLE DEDICATED MOBILE VIEW
          ==================================================================== */}
      <div className="lp-mobile-view">
        {/* Cover Section with Silhouette & Sky */}
        <div
          className="lp-mob-cover-banner"
          style={{
            backgroundImage: `url(${profileCoverPurple})`,
          }}
        >
          {/* Top Floating Nav: Back Arrow (left) & Share/Dots Pill (right) */}
          <div className="lp-mob-top-nav-bar">
            <button
              type="button"
              className="lp-mob-circle-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <FaChevronLeft size={16} color="#1E293B" />
            </button>

            <div className="lp-mob-top-actions-pill">
              <button
                type="button"
                className="lp-mob-pill-btn"
                onClick={handleShareProfile}
                title="Share Profile"
              >
                <FiShare2 size={16} color="#1E293B" />
              </button>
              <div className="lp-mob-pill-divider" />
              <button
                type="button"
                className="lp-mob-pill-btn"
                onClick={() => toast('Profile Options: Share, Copy URL, Report', { icon: 'ℹ️' })}
                title="More"
              >
                <BsThreeDotsVertical size={16} color="#1E293B" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Floating Instagram Profile Card */}
        <div className="lp-mob-profile-card">
          {/* Center Avatar (Bigger + Instagram Story Gradient Ring) */}
          <div className="lp-mob-avatar-center-wrap">
            <div className="lp-mob-avatar-story-ring">
              <img
                src={leader.avatar || userAvatarRahul}
                alt={leader.name}
                className="lp-mob-avatar-img-centered"
                onError={(e) => {
                  e.currentTarget.src = userAvatarRahul;
                }}
              />
              <div className="lp-mob-crown-badge-center" title="Top Leader">
                <FaCrown size={12} color="#FFFFFF" />
              </div>
            </div>
          </div>

          {/* Profile Identity Details (Centered) */}
          <div className="lp-mob-identity-center">
            {/* Name + Verified Badge */}
            <div className="lp-mob-name-center-row">
              <h2 className="lp-mob-leader-name-center">{leader.name}</h2>
              <span className="lp-mob-verified-sparkle" title="Verified Leader">
                <FaGem size={13} color="#7C3AED" />
              </span>
            </div>

            {/* Rank Badge Pill (Purple with Diamond) */}
            <div className="lp-mob-rank-badge-center">
              <FaGem size={10} color="#FFFFFF" />
              <span>{leader.levelTitle || leader.level || 'Diamond Leader'}</span>
            </div>

            {/* Meta Line: Location & Joined Date */}
            <div className="lp-mob-meta-center">
              <span className="lp-mob-meta-item">
                <FaMapMarkerAlt className="lp-mob-ico text-red" />
                <span>{leader.location || 'Fortaa, India'}</span>
              </span>
              <span className="lp-mob-meta-dot">•</span>
              <span className="lp-mob-meta-item">
                <FaCalendarAlt className="lp-mob-ico text-purple" />
                <span>{leader.joinedDate || 'Joined Jan 2013'}</span>
              </span>
            </div>

            {/* Quote / Bio */}
            {cleanQuote && (
              <p className="lp-mob-quote-center">
                “{cleanQuote}”
              </p>
            )}
          </div>

          {/* Instagram Stats Row (Posts, Followers, Following, Experience) */}
          <div className="lp-mob-ig-stats-row">
            <div className="lp-mob-ig-stat-col" onClick={() => setMobileActiveTab('Posts')}>
              <div className="lp-mob-ig-stat-num">{leader.posts || '0'}</div>
              <div className="lp-mob-ig-stat-label">Posts</div>
            </div>
            <div className="lp-mob-ig-stat-divider" />
            <div className="lp-mob-ig-stat-col" onClick={() => setMobileActiveTab('Network')}>
              <div className="lp-mob-ig-stat-num">{leader.followers || '0'}</div>
              <div className="lp-mob-ig-stat-label">Followers</div>
            </div>
            <div className="lp-mob-ig-stat-divider" />
            <div className="lp-mob-ig-stat-col" onClick={() => setMobileActiveTab('Network')}>
              <div className="lp-mob-ig-stat-num">{leader.following || '0'}</div>
              <div className="lp-mob-ig-stat-label">Following</div>
            </div>
            <div className="lp-mob-ig-stat-divider" />
            <div className="lp-mob-ig-stat-col" onClick={() => setMobileActiveTab('Achievements')}>
              <div className="lp-mob-ig-stat-num">
                {leader.experience ? leader.experience.replace(/in.*/i, '').trim() : (leader.joinedDate ? leader.joinedDate.replace('Joined ', '') : '-')}
              </div>
              <div className="lp-mob-ig-stat-label">Experience</div>
            </div>
          </div>

          {/* Action Buttons Row (Instagram Style: Follow | Message | Share) */}
          <div className="lp-mob-ig-actions-row">
            <button
              type="button"
              className={getFollowBtnClass('lp-mob-ig-btn lp-mob-ig-btn-follow')}
              onClick={handleFollowToggle}
            >
              {renderFollowBtnContent(true)}
            </button>

            <button
              type="button"
              className="lp-mob-ig-btn lp-mob-ig-btn-secondary"
              onClick={handleMessageClick}
            >
              <FaRegCommentDots size={14} />
              <span>Message</span>
            </button>

            <button
              type="button"
              className="lp-mob-ig-btn lp-mob-ig-btn-secondary"
              onClick={handleShareProfile}
            >
              <FiShare2 size={14} />
              <span>Share</span>
            </button>
          </div>

          {/* Instagram Story Highlights (Dynamic Circular Badges Row) */}
          <div className="lp-mob-ig-highlights-scroll">
            <div
              className="lp-mob-ig-highlight-item"
              onClick={() => setMobileActiveTab('Achievements')}
            >
              <div className="lp-mob-ig-highlight-circle circle-cyan">
                <FaGem size={20} color="#06B6D4" />
              </div>
              <span className="lp-mob-ig-highlight-name">
                {(leader.levelTitle || leader.level || 'Leader').replace(' Leader', '').replace(' Leaders', '')}
              </span>
            </div>

            <div
              className="lp-mob-ig-highlight-item"
              onClick={() => setMobileActiveTab('Network')}
            >
              <div className="lp-mob-ig-highlight-circle circle-orange">
                <FaUsers size={20} color="#EA580C" />
              </div>
              <span className="lp-mob-ig-highlight-name">{leader.followers || '0'}+</span>
            </div>

            <div
              className="lp-mob-ig-highlight-item"
              onClick={() => setMobileActiveTab('Posts')}
            >
              <div className="lp-mob-ig-highlight-circle circle-green">
                <BsGrid3X3Gap size={18} color="#10B981" />
              </div>
              <span className="lp-mob-ig-highlight-name">{leader.posts || '0'} Posts</span>
            </div>

            {leader.experience && (
              <div
                className="lp-mob-ig-highlight-item"
                onClick={() => setMobileActiveTab('Achievements')}
              >
                <div className="lp-mob-ig-highlight-circle circle-purple">
                  <FaStar size={20} color="#7C3AED" />
                </div>
                <span className="lp-mob-ig-highlight-name">
                  {leader.experience.replace(/in.*/i, '').trim()}
                </span>
              </div>
            )}

            {(leader.specialization || leader.skills || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 3)
              .map((skill, idx) => (
                <div
                  key={idx}
                  className="lp-mob-ig-highlight-item"
                  onClick={() => toast(`Skill: ${skill}`, { icon: '🎯' })}
                >
                  <div className="lp-mob-ig-highlight-circle circle-gray">
                    <span style={{ fontSize: '18px' }}>{idx === 0 ? '🎯' : idx === 1 ? '📈' : '⚡'}</span>
                  </div>
                  <span className="lp-mob-ig-highlight-name">{skill}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Instagram Profile Tabs Navigation Bar */}
        <div className="lp-mob-ig-tabs-bar">
          <button
            type="button"
            className={`lp-mob-ig-tab-btn ${mobileActiveTab === 'Posts' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('Posts')}
          >
            <BsGrid3X3Gap size={17} />
            <span>Posts</span>
          </button>

          <button
            type="button"
            className={`lp-mob-ig-tab-btn ${mobileActiveTab === 'About' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('About')}
          >
            <HiUserGroup size={18} />
            <span>About</span>
          </button>

          <button
            type="button"
            className={`lp-mob-ig-tab-btn ${mobileActiveTab === 'Network' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('Network')}
          >
            <FaUsers size={16} />
            <span>Network</span>
          </button>

          <button
            type="button"
            className={`lp-mob-ig-tab-btn ${mobileActiveTab === 'Achievements' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('Achievements')}
          >
            <FaMedal size={16} />
            <span>Awards</span>
          </button>
        </div>

        {/* Tab Content Section */}
        <div className="lp-mob-ig-tab-content">
          {/* TAB 1: POSTS (3-Column Square Grid - Pure Instagram) */}
          {mobileActiveTab === 'Posts' && (
            <div>
              {loadingPosts ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  Loading posts...
                </div>
              ) : userPosts && userPosts.length > 0 ? (
                <div className="lp-mob-ig-posts-grid">
                  {userPosts.map((post) => (
                    <div
                      key={post.id}
                      className="lp-mob-ig-post-square"
                      onClick={() =>
                        toast(
                          `Post by ${leader.name}: ${post.likes_count || 0} likes, ${post.comments_count || 0} comments`,
                          { icon: '📸' }
                        )
                      }
                    >
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.content ? post.content.slice(0, 30) : 'Post'}
                          className="lp-mob-ig-post-thumb"
                        />
                      ) : (
                        <div className="lp-mob-ig-post-text-thumb">
                          <p style={{ margin: 0 }}>
                            {post.content ? (post.content.length > 80 ? post.content.slice(0, 80) + '...' : post.content) : 'Post'}
                          </p>
                        </div>
                      )}
                      <div className="lp-mob-ig-post-overlay">
                        {post.author_role && (
                          <span className="lp-mob-ig-post-pill">
                            {post.author_role.replace(' Leader', '')}
                          </span>
                        )}
                        <div className="lp-mob-ig-post-stats-overlay">
                          <span>
                            <FaThumbsUp size={10} /> {post.likes_count || 0}
                          </span>
                          <span>
                            <FaRegCommentDots size={10} /> {post.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lp-mob-empty-posts">
                  <div className="lp-empty-camera-circle">
                    <FaCamera size={26} color="#7C3AED" />
                  </div>
                  <h4 className="lp-empty-posts-title">No Posts Yet</h4>
                  <p className="lp-empty-posts-sub">
                    When {leader.name} shares photos or updates, you’ll see them here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ABOUT */}
          {mobileActiveTab === 'About' && (
            <div className="lp-mob-ig-about-view">
              <div className="lp-mob-ig-card">
                <h3 className="lp-mob-ig-card-title">
                  <HiUserGroup className="text-purple" /> About {leader.name}
                </h3>
                <p className="lp-mob-ig-bio-text">
                  {leader.bio ||
                    'Motivated and passionate networker with a vision to create financial freedom and help others grow. Proud to be part of Fortaa.'}
                </p>

                <div className="lp-mob-ig-details-list">
                  {leader.location && (
                    <div className="lp-mob-ig-detail-item">
                      <FaMapMarkerAlt className="text-red" size={14} />
                      <span>{leader.location}</span>
                    </div>
                  )}
                  {leader.language && (
                    <div className="lp-mob-ig-detail-item">
                      <FaRegCommentDots className="text-purple" size={14} />
                      <span>{leader.language}</span>
                    </div>
                  )}
                  {leader.website && (
                    <div className="lp-mob-ig-detail-item">
                      <FaGlobe className="text-blue" size={14} />
                      <a
                        href={`https://${leader.website.replace(/^https?:\/\//, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="lp-mob-ig-link"
                      >
                        {leader.website}
                      </a>
                    </div>
                  )}
                </div>

                {cleanQuote && (
                  <div className="lp-mob-ig-quote-card">
                    <FaQuoteLeft className="lp-mob-ig-quote-ico" size={14} />
                    <p className="lp-mob-ig-quote-val">“{cleanQuote}”</p>
                    <span className="lp-mob-ig-quote-author">-{leader.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK */}
          {mobileActiveTab === 'Network' && (
            <div className="lp-mob-ig-network-view">
              <div className="lp-mob-ig-card">
                <h3 className="lp-mob-ig-card-title">
                  <FaUsers className="text-purple" /> Network Overview
                </h3>
                <p className="lp-mob-ig-bio-text">
                  Direct network connections and followers affiliated with {leader.name}.
                </p>

                <div className="lp-mob-ig-network-grid">
                  <div className="lp-mob-ig-network-box">
                    <div className="lp-mob-ig-net-val">{leader.followers || '0'}</div>
                    <div className="lp-mob-ig-net-lbl">Followers</div>
                  </div>
                  <div className="lp-mob-ig-network-box">
                    <div className="lp-mob-ig-net-val">{leader.following || '0'}</div>
                    <div className="lp-mob-ig-net-lbl">Following</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="lp-mob-ig-btn-full"
                  onClick={handleFollowToggle}
                >
                  {followStatus === 'accepted' ? 'Following ✓' : followStatus === 'pending' ? 'Request Pending ⏳' : 'Connect with Leader'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACHIEVEMENTS */}
          {mobileActiveTab === 'Achievements' && (
            <div className="lp-mob-ig-achievements-view">
              <div className="lp-mob-ig-achievements-grid">
                <div className="lp-mob-ig-achieve-card">
                  <div className="lp-mob-ig-ach-icon-box box-orange">
                    <FaUsers size={20} color="#EA580C" />
                  </div>
                  <div className="lp-mob-ig-ach-val">{leader.followers || '0'}</div>
                  <div className="lp-mob-ig-ach-lbl">Total Followers</div>
                </div>

                <div className="lp-mob-ig-achieve-card">
                  <div className="lp-mob-ig-ach-icon-box box-cyan">
                    <FaGem size={20} color="#06B6D4" />
                  </div>
                  <div className="lp-mob-ig-ach-val">
                    {leader.levelTitle || leader.level || 'Leader'}
                  </div>
                  <div className="lp-mob-ig-ach-lbl">Current Rank</div>
                </div>

                <div className="lp-mob-ig-achieve-card">
                  <div className="lp-mob-ig-ach-icon-box box-green">
                    <FaStar size={20} color="#10B981" />
                  </div>
                  <div className="lp-mob-ig-ach-val">{leader.posts || '0'}</div>
                  <div className="lp-mob-ig-ach-lbl">Published Posts</div>
                </div>

                <div className="lp-mob-ig-achieve-card">
                  <div className="lp-mob-ig-ach-icon-box box-purple">
                    <FaCrown size={20} color="#7C3AED" />
                  </div>
                  <div className="lp-mob-ig-ach-val">{leader.experience ? leader.experience.replace(/in.*/i, '').trim() : 'Active'}</div>
                  <div className="lp-mob-ig-ach-lbl">Experience</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <UserMobileBottomNav active="Network" />
    </div>
  );
}
