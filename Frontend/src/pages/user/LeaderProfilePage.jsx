import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import AuthGateModal from '../../components/auth/AuthGateModal';
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
} from 'react-icons/fa';
import {
  HiChatAlt2,
  HiEye,
  HiUserGroup,
  HiShare,
  HiOutlineClock,
  HiLightBulb,
  HiTrendingUp,
  HiSpeakerphone,
  HiUserAdd,
  HiSparkles,
} from 'react-icons/hi';
import { MdLanguage, MdCampaign } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiShare2, FiLock } from 'react-icons/fi';

// Assets
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
        profile_visibility: l.profile_visibility || 'public',
        joinedDate: l.created_at ? 'Joined ' + new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
      };
    }
    // Check preset map
    if (id && PRESET_LEADERS[id]) {
      return { ...PRESET_LEADERS[id], profile_visibility: 'public' };
    }
    return { ...PRESET_LEADERS['default'], profile_visibility: 'public' };
  });

  const cleanQuote = (leader.quote || leader.bio || '')
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .trim();

  // Privacy and access calculation
  const isOwnProfile = Number(currentUserId) === Number(leader.id || id);
  const isAccountPrivate = (leader.profile_visibility || 'public') !== 'public';
  const canViewContent = isOwnProfile || !isAccountPrivate || followStatus === 'accepted';

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
          fetchPosts(id, 'mine', currentUserId),
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
              profile_visibility: fetched.profile_visibility || prev.profile_visibility || 'public',
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

        updateCachedFollowStatus(targetLeaderId, serverStatus);
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
  }, [id, leader.id, leader.name, currentUserId]);

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
      try {
        if (!isNaN(Number(targetId))) {
          const res = await sendFollowRequest(Number(targetId), currentUserId);
          if (res?.status) {
            updateCachedFollowStatus(targetId, res.status);
            if (res.status === 'accepted') {
              toast.success(`You are now following ${targetName}! 🎉`);
            } else {
              toast.success(`Follow request sent to ${targetName}! ⏳`);
            }
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

  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/leader/${id}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${leader.name || 'Leader'} on Fortaa`,
          text: `Check out ${leader.name || 'this leader'}'s profile on Fortaa:`,
          url: profileUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Leader profile URL copied to clipboard! 📋');
    } else {
      toast.success(`Leader profile URL: ${profileUrl}`);
    }
  };

  const handleMessageClick = () => {
    navigate(`/messages?user=${leader.id}&name=${encodeURIComponent(leader.name)}`);
  };

  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="profile" targetName={leader.name} />
      )}
      <div className={`lp-root-container ${!isUserAuthenticated ? 'auth-gated-blur' : ''}`}>
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
              
              {/* HERO PROFILE BANNER (Modern Gradient Mesh) */}
              <section className="lp-hero-banner">
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
                      User Name: {leader.username ? (leader.username.startsWith('@') ? leader.username : `@${leader.username}`) : ''}
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

            </div>

            {/* THREE COLUMNS GRID OR PRIVATE ACCOUNT STATE (Instagram style) */}
            {!canViewContent ? (
              <div className="lp-private-account-card">
                <div className="lp-private-lock-circle">
                  <FiLock size={36} color="#0F172A" />
                </div>
                <h3 className="lp-private-title">This profile is private</h3>
                <p className="lp-private-desc">
                  Follow to see their photos and videos.
                </p>
              </div>
            ) : (
              <>
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

                {/* Card 2: Professional Experience & Background (Real Data) */}
                <div className="lp-card lp-exp-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Professional Background</h3>
                  </div>

                  <div className="lp-exp-card-body">
                    <div className="lp-exp-item">
                      <div className="lp-exp-icon-box">
                        <FaMedal size={22} color="#7C3AED" />
                      </div>
                      <div className="lp-exp-details">
                        <h4 className="lp-exp-role">{leader.levelTitle || leader.level || 'Leader'}</h4>
                        <p className="lp-exp-company">{leader.company || 'Fortaa'}</p>
                        <span className="lp-exp-duration">
                          <FaCalendarAlt size={12} /> {leader.joinedDate || 'Active Member'}
                        </span>
                        <p className="lp-exp-desc">
                          {leader.experience || `Active ${leader.level || 'Leader'} committed to team building, network expansion, and business growth.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* MIDDLE COLUMN: Skills, Achievements, Recent Activities */}
              <div className="lp-col-center">

                {/* Card 1: Skills (Real user skills from DB) */}
                <div className="lp-card lp-skills-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Skills</h3>
                  </div>

                  {(() => {
                    const skillsList = (leader.specialization || leader.skills || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);

                    if (skillsList.length === 0) {
                      return (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                          No specific skills added yet by this leader.
                        </div>
                      );
                    }

                    const skillIcons = [
                      <MdCampaign key="0" size={24} color="#7C3AED" />,
                      <HiLightBulb key="1" size={24} color="#D97706" />,
                      <HiTrendingUp key="2" size={24} color="#0284C7" />,
                      <FaHeadset key="3" size={20} color="#DB2777" />,
                    ];
                    const colorClasses = ['purple', 'amber', 'cyan', 'magenta'];

                    return (
                      <div className="lp-skills-row">
                        {skillsList.slice(0, 4).map((skill, idx) => (
                          <div key={idx} className="lp-skill-item">
                            <div className={`lp-skill-circle ${colorClasses[idx % colorClasses.length]}`}>
                              {skillIcons[idx % skillIcons.length]}
                            </div>
                            <span className="lp-skill-name">{skill}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Card 2: Achievements (Dynamic milestones from real data) */}
                <div className="lp-card lp-achieve-card">
                  <div className="lp-card-head-row">
                    <h3 className="lp-card-title">Achievements</h3>
                  </div>

                  <div className="lp-achieve-row">
                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge blue">
                        <FaCrown size={20} color="#2563EB" />
                      </div>
                      <span className="lp-achieve-title">{leader.level || 'Leader'}</span>
                      <span className="lp-achieve-tier">Tier Rank</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge orange">
                        <HiTrendingUp size={20} color="#EA580C" />
                      </div>
                      <span className="lp-achieve-title">{leader.followers || '0'} Followers</span>
                      <span className="lp-achieve-tier">Network</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge teal">
                        <FaGlobeAmericas size={20} color="#059669" />
                      </div>
                      <span className="lp-achieve-title">{leader.posts || '0'} Posts</span>
                      <span className="lp-achieve-tier">Contributions</span>
                    </div>

                    <div className="lp-achieve-item">
                      <div className="lp-achieve-badge gold">
                        <FaUsers size={20} color="#CA8A04" />
                      </div>
                      <span className="lp-achieve-title">{leader.company || 'Fortaa'}</span>
                      <span className="lp-achieve-tier">Organization</span>
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
            </>
            )}

          </div>
        </div>
      </div>
      </div>
      {/* End Desktop View */}

      {/* ====================================================================
          LINKEDIN-STYLE DEDICATED MOBILE VIEW (Matching LinkedIn Profile App)
          ==================================================================== */}
      <div className="lp-mobile-view lp-li-mobile">
        {/* 1. LinkedIn Cover Photo with Top Floating Actions */}
        <div className="lp-li-cover">
          <div className="lp-li-cover-overlay" />
          <div className="lp-li-cover-nav">
            <button
              type="button"
              className="lp-li-nav-btn"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <FaChevronLeft size={16} />
            </button>
            <div className="lp-li-nav-right">
              <button
                type="button"
                className="lp-li-nav-btn"
                onClick={handleShareProfile}
                title="Share Profile"
              >
                <FiShare2 size={16} />
              </button>
              <button
                type="button"
                className="lp-li-nav-btn"
                onClick={() => toast('Profile Options: Share, Copy URL, Report', { icon: 'ℹ️' })}
                title="More"
              >
                <BsThreeDotsVertical size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Profile Header Card (LinkedIn Structure) */}
        <div className="lp-li-main-card">
          {/* Overlapping Avatar Row */}
          <div className="lp-li-avatar-row">
            <div className="lp-li-avatar-box">
              <img
                src={leader.avatar || userAvatarRahul}
                alt={leader.name}
                className="lp-li-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = userAvatarRahul;
                }}
              />
              <div className="lp-li-avatar-badge" title="Top Leader">
                <FaCrown size={12} color="#FFFFFF" />
              </div>
            </div>

            {leader.company && (
              <div className="lp-li-company-tag">
                <FaMedal size={12} color="#7C3AED" />
                <span className="lp-li-company-name">{leader.company}</span>
              </div>
            )}
          </div>

          {/* Left-Aligned Identity Information */}
          <div className="lp-li-info">
            <div className="lp-li-name-row">
              <h1 className="lp-li-name">{leader.name}</h1>
              <span className="lp-li-verified-icon" title="Verified Leader">
                <FaGem size={14} color="#7C3AED" />
              </span>
              <span className="lp-li-badge-pill">
                {leader.levelTitle || leader.level || 'Leader'}
              </span>
            </div>

            {leader.username && (
              <div className="lp-li-username">
                {leader.username.startsWith('@') ? leader.username : `@${leader.username}`}
              </div>
            )}

            <p className="lp-li-headline">
              {leader.levelTitle || leader.role || 'Business Leader'} at {leader.company || 'Fortaa Network'}
            </p>

            <div className="lp-li-meta-line">
              <span className="lp-li-location">
                <FaMapMarkerAlt size={12} /> {leader.location || 'India'}
              </span>
              <span className="lp-li-meta-dot">•</span>
              <span
                className="lp-li-contact-link"
                onClick={() => toast.success(`Website/Contact: ${leader.website || 'Fortaa Member'}`)}
              >
                Contact info
              </span>
            </div>

            <div className="lp-li-social-proof">
              <span className="lp-li-followers-highlight">
                <strong>{leader.followers || '0'}</strong> followers
              </span>
              <span className="lp-li-meta-dot">•</span>
              <span className="lp-li-following-sub">
                {leader.following || '0'} connections
              </span>
            </div>
          </div>

          {/* Action Buttons Row (LinkedIn Style) */}
          <div className="lp-li-actions-row">
            <button
              type="button"
              className="lp-li-btn-primary"
              onClick={handleMessageClick}
            >
              <HiChatAlt2 size={16} />
              <span>Message</span>
            </button>

            <button
              type="button"
              className={getFollowBtnClass('lp-li-btn-secondary')}
              onClick={handleFollowToggle}
            >
              {renderFollowBtnContent(true)}
            </button>

            <button
              type="button"
              className="lp-li-btn-icon"
              onClick={handleShareProfile}
              title="Share"
            >
              <FiShare2 size={16} />
            </button>
          </div>
        </div>

        {/* 3. Sections or Private Lock */}
        {!canViewContent ? (
          <div className="lp-li-card lp-li-private-card">
            <div className="lp-private-lock-circle">
              <FiLock size={36} color="#0F172A" />
            </div>
            <h3 className="lp-private-title">This profile is private</h3>
            <p className="lp-private-desc">
              Follow to see their photos and videos.
            </p>
          </div>
        ) : (
          <div className="lp-li-sections">
            {/* CARD 1: ABOUT */}
            <div className="lp-li-card">
              <h3 className="lp-li-card-heading">About</h3>
              <p className="lp-li-card-paragraph">
                {leader.bio || cleanQuote || 'Network marketing leader and entrepreneur dedicated to team growth and collaboration.'}
              </p>
              {leader.website && (
                <div className="lp-li-website-item">
                  <MdLanguage size={15} color="#7C3AED" />
                  <a
                    href={leader.website.startsWith('http') ? leader.website : `https://${leader.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="lp-li-website-anchor"
                  >
                    {leader.website}
                  </a>
                </div>
              )}
            </div>

            {/* CARD 2: ACTIVITY / POSTS */}
            <div className="lp-li-card">
              <div className="lp-li-card-head-row">
                <h3 className="lp-li-card-heading" style={{ margin: 0 }}>Activity</h3>
                <span className="lp-li-activity-sub">{userPosts.length} posts</span>
              </div>

              {loadingPosts ? (
                <div className="lp-li-empty-text">Loading posts...</div>
              ) : userPosts && userPosts.length > 0 ? (
                <div className="lp-li-posts-list">
                  {userPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="lp-li-post-item">
                      <p className="lp-li-post-content">{post.content || 'Shared an update'}</p>
                      {post.image_url && (
                        <div className="lp-li-post-media">
                          <img src={post.image_url} alt="Post" className="lp-li-post-img" />
                        </div>
                      )}
                      <div className="lp-li-post-metrics">
                        <span>❤️ {post.likes_count || 0} likes</span>
                        <span>💬 {post.comments_count || 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lp-li-empty-text">No posts published yet.</div>
              )}
            </div>

            {/* CARD 3: EXPERIENCE */}
            <div className="lp-li-card">
              <h3 className="lp-li-card-heading">Experience</h3>
              <div className="lp-li-exp-item">
                <div className="lp-li-exp-icon">
                  <FaMedal size={20} color="#7C3AED" />
                </div>
                <div className="lp-li-exp-body">
                  <h4 className="lp-li-exp-role">{leader.levelTitle || leader.role || 'Business Leader'}</h4>
                  <p className="lp-li-exp-company">{leader.company || 'Fortaa'}</p>
                  <span className="lp-li-exp-date">
                    <FaCalendarAlt size={11} /> {leader.joinedDate || 'Active Leader'}
                  </span>
                  <p className="lp-li-exp-desc">
                    {leader.experience || `Actively growing business networks, mentoring leaders, and driving growth.`}
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 4: SKILLS */}
            <div className="lp-li-card">
              <h3 className="lp-li-card-heading">Skills</h3>
              {(() => {
                const skills = (leader.specialization || leader.skills || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);

                if (skills.length === 0) {
                  return <div className="lp-li-empty-text">No skills added yet.</div>;
                }

                return (
                  <div className="lp-li-skills-chips">
                    {skills.map((skill, sIdx) => (
                      <span key={sIdx} className="lp-li-skill-chip">
                        <span className="lp-li-skill-dot">✓</span> {skill}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>





      {/* Mobile Bottom Navigation */}
      <UserMobileBottomNav active="Network" />
    </div>
    </>
  );
}
