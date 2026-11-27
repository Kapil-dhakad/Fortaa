import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import AuthGateModal from '../../components/auth/AuthGateModal';
import { fetchCurrentUser, fetchUserProfile } from '../../services/user.service';
import {
  sendFollowRequest,
  unfollowUser,
  cancelFollowRequest,
  fetchFollowingIds,
  fetchUserSocialCounts,
  fetchFollowers,
  fetchFollowing,
} from '../../services/follow.service';
import { fetchPosts, fetchLeaders, likePostApi } from '../../services/dashboard.service';
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
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaPlay,
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
import { FiShare2, FiLock, FiEdit2 } from 'react-icons/fi';

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

const sanitizeWebsite = (url) => {
  if (!url) return '';
  if (url.includes('Enter your') || url.includes('Business Name') || url.length > 80) return '';
  return url.trim();
};

const getInitialLeaderState = (targetId, fallbackState = null) => {
  if (fallbackState && (fallbackState.id === targetId || String(fallbackState.id) === String(targetId))) {
    const fallbackAvatar = fallbackState.avatar || fallbackState.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackState.name || 'Leader')}&background=6220FE&color=fff`;
    return {
      id: fallbackState.id,
      name: fallbackState.name || 'Leader',
      username: (fallbackState.name || 'leader').toLowerCase().replace(/\s+/g, ''),
      level: fallbackState.levelTitle || (fallbackState.level ? `${fallbackState.level} Leader` : 'Leader'),
      levelTitle: fallbackState.levelTitle || (fallbackState.level ? `${fallbackState.level} Leader` : 'Leader'),
      company: fallbackState.company_brand || fallbackState.company || 'Fortaa',
      location: fallbackState.location || 'India',
      followers: fallbackState.followers || '0',
      followersCount: fallbackState.followersCount || 0,
      following: fallbackState.following || '0',
      followingCount: fallbackState.followingCount || 0,
      posts: fallbackState.posts || '0',
      avatar: fallbackAvatar,
      quote: fallbackState.quote || fallbackState.bio || '',
      bio: fallbackState.bio || '',
      experience: fallbackState.experience || '',
      specialization: fallbackState.skills || fallbackState.specialization || '',
      language: fallbackState.language || '',
      website: sanitizeWebsite(fallbackState.website || fallbackState.website_social || ''),
      profile_visibility: fallbackState.profile_visibility || 'public',
      joinedDate: fallbackState.created_at ? 'Joined ' + new Date(fallbackState.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
    };
  }
  if (targetId && PRESET_LEADERS[targetId]) {
    return { ...PRESET_LEADERS[targetId], profile_visibility: 'public' };
  }
  return {
    id: targetId,
    name: 'Leader',
    username: '',
    level: 'Leader',
    levelTitle: 'Leader',
    company: 'Fortaa',
    location: 'India',
    followers: '0',
    followersCount: 0,
    following: '0',
    followingCount: 0,
    posts: '0',
    avatar: `https://ui-avatars.com/api/?name=Leader&background=6220FE&color=fff`,
    quote: '',
    bio: '',
    experience: '',
    specialization: '',
    language: '',
    website: '',
    profile_visibility: 'public',
    joinedDate: '',
  };
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
  const [currentUserId, setCurrentUserId] = useState(() => storedUser.id || storedUser._id || null);

  useEffect(() => {
    if (!currentUserId) {
      fetchCurrentUser()
        .then((me) => {
          if (me?.id) setCurrentUserId(me.id);
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileTab, setMobileTab] = useState('About'); // 'About' | 'Posts' | 'Network' | 'Achievements'
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkModalTab, setNetworkModalTab] = useState('followers');
  const [networkSubTab, setNetworkSubTab] = useState('followers');
  const [leaderFollowers, setLeaderFollowers] = useState([]);
  const [leaderFollowing, setLeaderFollowing] = useState([]);
  const [topFollowMap, setTopFollowMap] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [topLeaders, setTopLeaders] = useState([]);

  const handleLikePost = async (post) => {
    if (!currentUserId) {
      toast.error('Please log in to like posts');
      return;
    }
    const wasLiked = !!post.has_liked;
    const prevCount = Number(post.likes_count) || 0;
    const nextLiked = !wasLiked;
    const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, has_liked: nextLiked, likes_count: nextCount } : p
      )
    );

    try {
      await likePostApi(post.id, currentUserId);
    } catch {
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, has_liked: wasLiked, likes_count: prevCount } : p
        )
      );
    }
  };

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

  const [leader, setLeader] = useState(() => getInitialLeaderState(id, location.state?.leader));

  const cleanQuote = (leader.quote || leader.bio || '')
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .trim();

  // Privacy and access calculation
  const isOwnProfile = Boolean(
    (currentUserId && (
      Number(currentUserId) === Number(leader.id || id) ||
      String(currentUserId) === String(leader.id || id)
    )) ||
    (storedUser?.id && (
      Number(storedUser.id) === Number(leader.id || id) ||
      String(storedUser.id) === String(leader.id || id)
    )) ||
    (storedUser?.email && leader.email && storedUser.email.toLowerCase() === leader.email.toLowerCase())
  );

  // If user opens their own profile via leader route, redirect to personal profile page
  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  const isAccountPrivate = (leader.profile_visibility || 'public') !== 'public';
  const canViewContent = isOwnProfile || !isAccountPrivate || followStatus === 'accepted';

  // Load dynamic profile, actual user posts, social counts, and top leaders
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (!id || id === 'rahul') return;
      try {
        setLoadingPosts(true);
        // Reset immediately to clean state for current id so previous user's data doesn't leak
        setLeader(getInitialLeaderState(id, location.state?.leader));

        const [fetched, counts, postsRes, leadersRes, followersRes, followingRes] = await Promise.all([
          fetchUserProfile(id, currentUserId),
          fetchUserSocialCounts(id),
          fetchPosts(id, 'mine', currentUserId),
          fetchLeaders(currentUserId).catch(() => []),
          fetchFollowers(id).catch(() => []),
          fetchFollowing(id).catch(() => []),
        ]);
        if (isMounted) {
          if (followersRes) {
            setLeaderFollowers(Array.isArray(followersRes) ? followersRes : []);
          }
          if (followingRes) {
            setLeaderFollowing(Array.isArray(followingRes) ? followingRes : []);
          }
          if (postsRes) {
            setUserPosts(Array.isArray(postsRes) ? postsRes : []);
          }
          if (leadersRes && Array.isArray(leadersRes) && leadersRes.length > 0) {
            setTopLeaders(leadersRes.slice(0, 6));
          }

          if (fetched) {
            const joined = fetched.created_at
              ? 'Joined ' + new Date(fetched.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '';
            const fCount = counts?.followersCount || 0;
            const fgCount = counts?.followingCount || 0;
            const pCount = counts?.postsCount !== undefined ? counts.postsCount : (postsRes ? postsRes.length : 0);

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fetched.name || 'Leader')}&background=6220FE&color=fff`;
            const cleanAv = fetched.avatar_url && !fetched.avatar_url.includes('user_avatar_rahul') ? fetched.avatar_url : fallbackAvatar;

            setLeader({
              id: fetched.id || id,
              name: fetched.name || 'Leader',
              username: fetched.username || (fetched.name || '').toLowerCase().replace(/\s+/g, ''),
              location: fetched.location || (fetched.company_brand ? `${fetched.company_brand}, India` : 'India'),
              bio: fetched.bio || '',
              experience: fetched.experience || '',
              specialization: fetched.skills || '',
              company: fetched.company_brand || fetched.business_name || 'Fortaa',
              avatar: cleanAv,
              coverUrl: fetched.cover_url || null,
              quote: fetched.bio || '',
              level: fetched.designation || 'Leader',
              levelTitle: fetched.designation || 'Leader',
              website: sanitizeWebsite(fetched.website_social || ''),
              profile_visibility: fetched.profile_visibility || 'public',
              joinedDate: joined,
              followers: fCount >= 1000 ? `${(fCount / 1000).toFixed(1)}k` : `${fCount}`,
              followersCount: fCount,
              following: fgCount >= 1000 ? `${(fgCount / 1000).toFixed(1)}k` : `${fgCount}`,
              followingCount: fgCount,
              posts: String(pCount),
            });
          }
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
  }, [id, currentUserId, location.state]);

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

        // Also update topFollowMap for all leaders
        const map = {};
        followingIds.forEach((fId) => { map[fId] = 'accepted'; });
        pendingIds.forEach((pId) => { map[pId] = 'pending'; });
        setTopFollowMap((prev) => ({ ...prev, ...map }));
      })
      .catch((err) => console.warn('fetchFollowingIds error:', err));

    try {
      joinChat(currentUserId);
      const unsub = subscribeToFollowEvents({
        onFollowAccepted: ({ targetUserId }) => {
          if (String(targetUserId) === String(targetLeaderId)) {
            updateCachedFollowStatus(targetLeaderId, 'accepted');
          }
          setTopFollowMap((prev) => ({ ...prev, [targetUserId]: 'accepted' }));
        },
        onFollowUpdated: (data) => {
          if (data?.targetUserId && String(data.targetUserId) === String(targetLeaderId) && data.status) {
            updateCachedFollowStatus(targetLeaderId, data.status);
          }
          if (data?.targetUserId && data.status) {
            setTopFollowMap((prev) => ({ ...prev, [data.targetUserId]: data.status }));
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
      setTopFollowMap((prev) => ({ ...prev, [targetId]: 'none' }));
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
      setTopFollowMap((prev) => ({ ...prev, [targetId]: 'none' }));
      try {
        if (!isNaN(Number(targetId))) {
          await cancelFollowRequest(Number(targetId), currentUserId);
        }
      } catch (err) {
        console.error('cancelFollowRequest error:', err);
      }
    } else {
      updateCachedFollowStatus(targetId, 'pending');
      setTopFollowMap((prev) => ({ ...prev, [targetId]: 'pending' }));
      try {
        if (!isNaN(Number(targetId))) {
          const res = await sendFollowRequest(Number(targetId), currentUserId);
          if (res?.status) {
            updateCachedFollowStatus(targetId, res.status);
            setTopFollowMap((prev) => ({ ...prev, [targetId]: res.status }));
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
          <span>Pending</span>
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

  const handleTopFollowToggle = async (topId, topName) => {
    if (!currentUserId) {
      toast.error('Please login to follow leaders');
      return;
    }
    const currentStatus = topFollowMap[topId] || 'none';

    if (currentStatus === 'accepted') {
      const confirm = window.confirm(`Are you sure you want to unfollow ${topName}?`);
      if (!confirm) return;
      setTopFollowMap((prev) => ({ ...prev, [topId]: 'none' }));
      toast(`Unfollowed ${topName}`);
      try {
        await unfollowUser(Number(topId), currentUserId);
      } catch (err) {
        console.error('unfollowUser error:', err);
      }
    } else if (currentStatus === 'pending') {
      const confirm = window.confirm(`Cancel follow request to ${topName}?`);
      if (!confirm) return;
      setTopFollowMap((prev) => ({ ...prev, [topId]: 'none' }));
      toast('Follow request cancelled', { icon: '✖' });
      try {
        await cancelFollowRequest(Number(topId), currentUserId);
      } catch (err) {
        console.error('cancelFollowRequest error:', err);
      }
    } else {
      setTopFollowMap((prev) => ({ ...prev, [topId]: 'pending' }));
      try {
        const res = await sendFollowRequest(Number(topId), currentUserId);
        if (res?.status) {
          setTopFollowMap((prev) => ({ ...prev, [topId]: res.status }));
          if (res.status === 'accepted') {
            toast.success(`You are now following ${topName}! 🎉`);
          } else {
            toast.success(`Follow request sent to ${topName}! ⏳`);
          }
        }
      } catch (err) {
        console.error('sendFollowRequest error:', err);
        setTopFollowMap((prev) => ({ ...prev, [topId]: 'none' }));
      }
    }
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
    navigate(`/messages?userId=${leader.id}&name=${encodeURIComponent(leader.name || '')}&role=${encodeURIComponent(leader.role || leader.levelTitle || '')}&avatar=${encodeURIComponent(leader.avatar || '')}`, {
      state: {
        contact: {
          user_id: leader.id,
          name: leader.name,
          role: leader.role || leader.levelTitle,
          avatar_url: leader.avatar,
        },
      },
    });
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
                      {isOwnProfile ? (
                        <button
                          type="button"
                          className="lp-btn-follow"
                          onClick={() => navigate('/profile')}
                        >
                          <FiEdit2 size={16} />
                          <span>Edit Profile</span>
                        </button>
                      ) : (
                        <>
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
                        </>
                      )}

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
                  {activeTab === 'Overview' && (
                    <>
                      {/* LEFT COLUMN: About Leader & Professional Background */}
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
                    </>
                  )}

                  {/* TAB: ABOUT US */}
                  {activeTab === 'About Us' && (
                    <div className="lp-col-main-view">
                      {/* Full Bio & Details */}
                      <div className="lp-card lp-about-card">
                        <h3 className="lp-card-title">About {leader.name}</h3>
                        <p className="lp-about-bio" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                          {leader.bio || 'Network marketing leader and entrepreneur dedicated to team growth and collaboration.'}
                        </p>

                        <div className="lp-about-details-list" style={{ marginTop: '16px' }}>
                          {leader.location && (
                            <div className="lp-about-row">
                              <FaMapMarkerAlt className="lp-about-icon text-red" />
                              <div className="lp-about-info">
                                <span className="lp-about-lbl">Location</span>
                                <span className="lp-about-val">{leader.location}</span>
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
                                <span className="lp-about-lbl">Specialization / Skills</span>
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

                        {cleanQuote && (
                          <div className="lp-about-quote-box" style={{ marginTop: '20px' }}>
                            <FaQuoteLeft className="lp-quote-icon" />
                            <p className="lp-quote-text">
                              “{cleanQuote}”
                            </p>
                            <span className="lp-quote-author">-{leader.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Professional Background */}
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

                      {/* Skills */}
                      <div className="lp-card lp-skills-card">
                        <div className="lp-card-head-row">
                          <h3 className="lp-card-title">Core Skills & Expertise</h3>
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
                              {skillsList.map((skill, idx) => (
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
                    </div>
                  )}

                  {/* TAB: NETWORK */}
                  {activeTab === 'Network' && (
                    <div className="lp-col-main-view">
                      <div className="lp-card">
                        <div className="lp-network-tab-header">
                          <div className="lp-card-head-row">
                            <h3 className="lp-card-title">Network & Connections</h3>
                            <div className="lp-network-subtabs">
                              <button
                                type="button"
                                className={`lp-net-subtab-btn ${networkSubTab === 'followers' ? 'active' : ''}`}
                                onClick={() => setNetworkSubTab('followers')}
                              >
                                Followers ({leaderFollowers.length || leader.followers || 0})
                              </button>
                              <button
                                type="button"
                                className={`lp-net-subtab-btn ${networkSubTab === 'following' ? 'active' : ''}`}
                                onClick={() => setNetworkSubTab('following')}
                              >
                                Following ({leaderFollowing.length || leader.following || 0})
                              </button>
                            </div>
                          </div>
                        </div>

                        {networkSubTab === 'followers' && (
                          <div className="lp-network-members-list">
                            {leaderFollowers.length > 0 ? (
                              leaderFollowers.map((member) => {
                                const memberAvatar = member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=6220FE&color=fff`;
                                const memSt = topFollowMap[member.id] || member.follow_status || 'none';
                                const isMemFollowing = memSt === 'accepted';
                                const isMemPending = memSt === 'pending';

                                return (
                                  <div key={member.id} className="lp-network-member-row">
                                    <img
                                      src={memberAvatar}
                                      alt={member.name}
                                      className="lp-net-avatar"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate(`/leader/${member.id}`, { state: { leader: member } })}
                                      onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=6220FE&color=fff`;
                                      }}
                                    />
                                    <div
                                      className="lp-net-info"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate(`/leader/${member.id}`, { state: { leader: member } })}
                                    >
                                      <span className="lp-net-name">{member.name}</span>
                                      <span className="lp-net-role">{member.designation || member.role || 'Member'}</span>
                                      {member.company_brand && (
                                        <span className="lp-net-company">{member.company_brand}</span>
                                      )}
                                    </div>
                                    {currentUserId && Number(currentUserId) !== Number(member.id) && (
                                      <button
                                        type="button"
                                        className={`lp-top-follow-btn ${isMemFollowing ? 'following' : isMemPending ? 'pending' : ''}`}
                                        onClick={() => handleTopFollowToggle(member.id, member.name)}
                                      >
                                        {isMemFollowing ? 'Following ✓' : isMemPending ? 'Pending ⏳' : 'Follow'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                                <FaUsers size={32} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>{leader.name} doesn't have any followers yet.</p>
                                <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                                  Be the first one to follow {leader.name} and connect!
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {networkSubTab === 'following' && (
                          <div className="lp-network-members-list">
                            {leaderFollowing.length > 0 ? (
                              leaderFollowing.map((member) => {
                                const memberAvatar = member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=6220FE&color=fff`;
                                const memSt = topFollowMap[member.id] || member.follow_status || 'none';
                                const isMemFollowing = memSt === 'accepted';
                                const isMemPending = memSt === 'pending';

                                return (
                                  <div key={member.id} className="lp-network-member-row">
                                    <img
                                      src={memberAvatar}
                                      alt={member.name}
                                      className="lp-net-avatar"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate(`/leader/${member.id}`, { state: { leader: member } })}
                                      onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=6220FE&color=fff`;
                                      }}
                                    />
                                    <div
                                      className="lp-net-info"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate(`/leader/${member.id}`, { state: { leader: member } })}
                                    >
                                      <span className="lp-net-name">{member.name}</span>
                                      <span className="lp-net-role">{member.designation || member.role || 'Member'}</span>
                                      {member.company_brand && (
                                        <span className="lp-net-company">{member.company_brand}</span>
                                      )}
                                    </div>
                                    {currentUserId && Number(currentUserId) !== Number(member.id) && (
                                      <button
                                        type="button"
                                        className={`lp-top-follow-btn ${isMemFollowing ? 'following' : isMemPending ? 'pending' : ''}`}
                                        onClick={() => handleTopFollowToggle(member.id, member.name)}
                                      >
                                        {isMemFollowing ? 'Following ✓' : isMemPending ? 'Pending ⏳' : 'Follow'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                                <FaUserCheck size={32} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>{leader.name} is not following anyone yet.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: POST */}
                  {activeTab === 'Post' && (
                    <div className="lp-col-main-view">
                      {loadingPosts ? (
                        <div className="lp-card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                          Loading posts...
                        </div>
                      ) : userPosts && userPosts.length > 0 ? (
                        userPosts.map((post) => {
                          return (
                            <div key={post.id} className="lp-full-post-card">
                              <div className="lp-fp-header">
                                <img
                                  src={leader.avatar}
                                  alt={leader.name}
                                  className="lp-fp-avatar"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name || 'Leader')}&background=6220FE&color=fff`;
                                  }}
                                />
                                <div>
                                  <h4 className="lp-fp-author">{leader.name}</h4>
                                  <span className="lp-fp-time">
                                    {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                  </span>
                                </div>
                              </div>

                              {post.content && (
                                <p className="lp-fp-content">{post.content}</p>
                              )}

                              {post.image_url && (
                                <div className="lp-fp-media-wrap">
                                  <img src={post.image_url} alt="Post Attachment" className="lp-fp-img" />
                                </div>
                              )}

                              {post.video_url && (
                                <div className="lp-fp-media-wrap">
                                  <video src={post.video_url} controls className="lp-fp-video" />
                                </div>
                              )}

                              <div className="lp-fp-stats-bar">
                                <span>❤️ {post.likes_count || 0} Likes</span>
                                <span>💬 {post.comments_count || 0} Comments</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="lp-card" style={{ padding: '40px 16px', textAlign: 'center', color: '#64748B' }}>
                          <HiSpeakerphone size={36} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                          <h4 style={{ margin: '0 0 4px 0', color: '#1E293B' }}>No posts published yet</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                            {leader.name} hasn't published any posts or updates yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RIGHT COLUMN: Top Network (Overview only), Top Leaders, Quick Actions */}
                  <div className="lp-col-right">
                    {activeTab === 'Overview' && (
                      /* Card 1: Top Network */
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
                    )}

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
                          const st = topFollowMap[topLdr.id] || (topLdr.follow_status || 'none');
                          const isFollowing = st === 'accepted';
                          const isPending = st === 'pending';
                          const topAvatar = topLdr.avatar || topLdr.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(topLdr.name || 'Leader')}&background=6220FE&color=fff`;

                          return (
                            <div
                              key={topLdr.id}
                              className="lp-top-row"
                              onClick={() => navigate(`/leader/${topLdr.id}`, { state: { leader: topLdr } })}
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={topAvatar}
                                alt={topLdr.name}
                                className="lp-top-avatar"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topLdr.name || 'Leader')}&background=6220FE&color=fff`;
                                }}
                              />
                              <div className="lp-top-info">
                                <span className="lp-top-name">{topLdr.name}</span>
                                <span className="lp-top-sub">{topLdr.levelTitle || topLdr.designation || topLdr.role || 'Leader'}</span>
                                <span className="lp-top-followers">{topLdr.followers ? `${topLdr.followers} Followers` : ''}</span>
                              </div>
                              <button
                                type="button"
                                className={`lp-top-follow-btn ${isFollowing ? 'following' : isPending ? 'pending' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTopFollowToggle(topLdr.id, topLdr.name);
                                }}
                              >
                                {isFollowing ? 'Following ✓' : isPending ? 'Pending ⏳' : 'Follow'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card 3: Quick Actions */}
                    <div className="lp-card lp-quick-actions-card">
                      <h3 className="lp-card-title">Quick Actions</h3>

                      <div className="lp-quick-horizontal-row">
                        {isOwnProfile ? (
                          <button
                            type="button"
                            className="lp-quick-action-btn"
                            onClick={() => navigate('/profile')}
                          >
                            <div className="lp-quick-action-icon-wrap">
                              <FiEdit2 size={24} color="#7C3AED" />
                            </div>
                            <span className="lp-quick-action-label">Edit Profile</span>
                          </button>
                        ) : (
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
                        )}

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
        <div
          className="lp-li-cover"
          style={leader.coverUrl ? { backgroundImage: `url(${leader.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
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

        {/* 2. Main Profile Header Card (Instagram Stats + Image 2 Hybrid) */}
        <div className="lp-li-main-card">
          {/* Top Row: Avatar on Left + Instagram-Style Stats on Right */}
          <div className="lp-li-avatar-stats-row">
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
                <FaCrown size={11} color="#FFFFFF" />
              </div>
            </div>

            {/* Instagram Profile Stats (Posts, Followers, Following) */}
            <div className="lp-li-insta-stats">
              <div
                className="lp-li-insta-stat-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setMobileTab('Posts')}
              >
                <span className="lp-li-insta-stat-num">{userPosts.length || leader.posts || '0'}</span>
                <span className="lp-li-insta-stat-lbl">Posts</span>
              </div>
              <div
                className="lp-li-insta-stat-item"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setNetworkModalTab('followers');
                  setShowNetworkModal(true);
                }}
              >
                <span className="lp-li-insta-stat-num">{leader.followers || '0'}</span>
                <span className="lp-li-insta-stat-lbl">Followers</span>
              </div>
              <div
                className="lp-li-insta-stat-item"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setNetworkModalTab('following');
                  setShowNetworkModal(true);
                }}
              >
                <span className="lp-li-insta-stat-num">{leader.following || '0'}</span>
                <span className="lp-li-insta-stat-lbl">Following</span>
              </div>
            </div>
          </div>

          {/* Left-Aligned Identity Information (Matching Image 2) */}
          <div className="lp-li-info">
            <div className="lp-li-name-header-row">
              <h1 className="lp-li-name">{leader.name}</h1>
              <span className="lp-li-verified-icon" title="Verified Leader">
                <FaGem size={13} color="#7C3AED" />
              </span>
              <span className="lp-li-badge-pill">
                {leader.levelTitle || leader.level || 'Leader'}
              </span>
              {leader.company && (
                <span className="lp-li-company-pill">
                  <FaMedal size={11} color="#7C3AED" />
                  <span>{leader.company}</span>
                </span>
              )}
            </div>

            {leader.username && (
              <div className="lp-li-username">
                {leader.username.startsWith('@') ? leader.username : `@${leader.username}`}
              </div>
            )}

            <p className="lp-li-headline">
              {leader.levelTitle || leader.role || 'Leader'} at {leader.company || 'Fortaa Network'}
            </p>

            <div className="lp-li-meta-line">
              <span className="lp-li-location">
                <FaMapMarkerAlt size={12} color="#64748B" /> {leader.location || 'India'}
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
              <span
                className="lp-li-followers-highlight"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setNetworkModalTab('followers');
                  setShowNetworkModal(true);
                }}
              >
                <strong>{leader.followers || '0'}</strong> followers
              </span>
              <span className="lp-li-meta-dot">•</span>
              <span
                className="lp-li-following-sub"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setNetworkModalTab('following');
                  setShowNetworkModal(true);
                }}
              >
                {leader.following || '0'} connections
              </span>
            </div>

            <p className="lp-li-motto-figma">
              “{cleanQuote || 'Small steps every day lead to big result'}”
            </p>
          </div>

          {/* Action Buttons Row (Matching Image 2) */}
          <div className="lp-li-actions-row">
            {isOwnProfile ? (
              <button
                type="button"
                className="lp-li-btn-primary"
                onClick={() => navigate('/profile')}
              >
                <FiEdit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
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
              </>
            )}

            <button
              type="button"
              className="lp-li-btn-icon"
              onClick={handleShareProfile}
              title="Share"
            >
              <FiShare2 size={16} />
            </button>
          </div>

          {/* 3. FOUR SECTION TABS ROW (About, Posts, Network, Achievements - Media removed) */}
          <div className="lp-li-tabs-bar-four">
            {['About', 'Posts', 'Network', 'Achievements'].map((tab) => {
              const isActive = mobileTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  className={`lp-li-tab-btn-four ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileTab(tab)}
                >
                  <span>{tab}</span>
                  {isActive && <div className="lp-li-tab-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Tab Content or Private Lock */}
        {!canViewContent ? (
          <div className="lp-li-card lp-li-private-card">
            <div className="lp-private-lock-circle">
              <FiLock size={36} color="#0F172A" />
            </div>
            <h3 className="lp-private-title">This profile is private</h3>
            <p className="lp-private-desc">
              Follow to see their posts and achievements.
            </p>
          </div>
        ) : (
          <div className="lp-li-tab-content">
            {/* ─── TAB 1: ABOUT (About info only) ─── */}
            {mobileTab === 'About' && (
              <div className="lp-li-tab-pane">
                {/* Card 1: About Me */}
                <div className="lp-li-card">
                  <h3 className="lp-li-card-heading">About</h3>
                  <p className="lp-li-card-paragraph">
                    {leader.bio || cleanQuote || 'Network marketing leader and entrepreneur dedicated to team growth and collaboration.'}
                  </p>

                  <div className="lp-li-about-meta">
                    <div className="lp-li-meta-row">
                      <FaMapMarkerAlt size={13} color="#64748B" />
                      <span>{leader.location || 'India'}</span>
                    </div>
                    <div className="lp-li-meta-row">
                      <MdLanguage size={14} color="#64748B" />
                      <span>Hindi, English</span>
                    </div>
                    {leader.website && (
                      <div className="lp-li-meta-row">
                        <FaGlobe size={13} color="#7C3AED" />
                        <a
                          href={leader.website.startsWith('http') ? leader.website : `https://${leader.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="lp-li-meta-link"
                        >
                          {leader.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Motivational Quote Bubble */}
                  <div className="lp-li-quote-bubble">
                    <p className="lp-li-quote-text">
                      “Success is not a destination, it's a journey of continuous growth.”
                    </p>
                    <span className="lp-li-quote-author">-{leader.name?.toLowerCase() || 'leader'}</span>
                  </div>
                </div>

                {/* Card 2: Professional Background & Experience */}
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

                {/* Card 3: Skills */}
                <div className="lp-li-card">
                  <h3 className="lp-li-card-heading">Skills</h3>
                  {(() => {
                    const skills = (leader.specialization || leader.skills || 'Marketing, Sales, Strategy, Leadership, Team Builder')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);

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

            {/* ─── TAB 2: POSTS (All Real Posts) ─── */}
            {mobileTab === 'Posts' && (
              <div className="lp-li-tab-pane">
                <div className="lp-li-posts-header">
                  <h3 className="lp-li-posts-header-title">
                    Posts by {leader.name} ({userPosts.length})
                  </h3>
                </div>

                {loadingPosts ? (
                  <div className="lp-li-card" style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                    Loading posts...
                  </div>
                ) : userPosts && userPosts.length > 0 ? (
                  userPosts.map((post) => {
                    const hasLiked = !!post.has_liked;
                    return (
                      <div key={post.id} className="lp-li-full-post-card">
                        <div className="lp-li-fp-header">
                          <img
                            src={leader.avatar || userAvatarRahul}
                            alt={leader.name}
                            className="lp-li-fp-avatar"
                          />
                          <div className="lp-li-fp-meta">
                            <h4 className="lp-li-fp-author">{leader.name}</h4>
                            <div className="lp-li-fp-sub">
                              <span className="lp-li-fp-role">{leader.levelTitle || leader.level || 'Leader'}</span>
                              <span>•</span>
                              <span>
                                {post.created_at
                                  ? new Date(post.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {post.content && (
                          <p className="lp-li-fp-content">{post.content}</p>
                        )}

                        {post.image_url && (
                          <div className="lp-li-fp-media">
                            <img src={post.image_url} alt="Post" className="lp-li-fp-img" />
                          </div>
                        )}

                        {post.video_url && (
                          <div className="lp-li-fp-media">
                            <video src={post.video_url} controls className="lp-li-fp-video" />
                          </div>
                        )}

                        <div className="lp-li-fp-actions">
                          <button
                            type="button"
                            className={`lp-li-fp-act-btn ${hasLiked ? 'liked' : ''}`}
                            onClick={() => handleLikePost(post)}
                          >
                            {hasLiked ? <FaHeart color="#EF4444" /> : <FaRegHeart />}
                            <span>{post.likes_count || 0} Likes</span>
                          </button>
                          <button
                            type="button"
                            className="lp-li-fp-act-btn"
                            onClick={() => toast(`Post has ${post.comments_count || 0} comments.`)}
                          >
                            <FaRegComment />
                            <span>{post.comments_count || 0} Comments</span>
                          </button>
                          <button
                            type="button"
                            className="lp-li-fp-act-btn"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: `Post by ${leader.name}`,
                                  url: window.location.href,
                                });
                              } else {
                                toast.success('Post link copied to clipboard!');
                              }
                            }}
                          >
                            <FiShare2 />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="lp-li-card" style={{ padding: '40px 16px', textAlign: 'center', color: '#64748B' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>No posts published yet</p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
                      {leader.name} hasn't published any posts or updates yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 3: NETWORK (Followers & Following) ─── */}
            {mobileTab === 'Network' && (
              <div className="lp-li-tab-pane">
                <div className="lp-li-card">
                  <div className="lp-li-card-head-row">
                    <h3 className="lp-li-card-heading">Network & Connections</h3>
                    <button
                      type="button"
                      className="lp-li-view-all-btn"
                      onClick={() => {
                        setNetworkModalTab('followers');
                        setShowNetworkModal(true);
                      }}
                    >
                      View List ↗
                    </button>
                  </div>
                  <p className="lp-li-card-paragraph">
                    {leader.name} has <strong>{leader.followers || '0'}</strong> followers and is connected with <strong>{leader.following || '0'}</strong> leaders across Fortaa.
                  </p>
                  <div className="lp-li-net-stats-row">
                    <div
                      className="lp-li-net-stat-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setNetworkModalTab('followers');
                        setShowNetworkModal(true);
                      }}
                    >
                      <span className="lp-li-net-stat-num">{leader.followers || '0'}</span>
                      <span className="lp-li-net-stat-lbl">Followers</span>
                    </div>
                    <div
                      className="lp-li-net-stat-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setNetworkModalTab('following');
                        setShowNetworkModal(true);
                      }}
                    >
                      <span className="lp-li-net-stat-num">{leader.following || '0'}</span>
                      <span className="lp-li-net-stat-lbl">Following</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 4: ACHIEVEMENTS (Milestones & Recognition - Image 1 Style) ─── */}
            {mobileTab === 'Achievements' && (
              <div className="lp-li-tab-pane">
                <div className="lp-li-card">
                  <h3 className="lp-li-card-heading">Milestones & Recognition</h3>
                  <div className="lp-li-achieve-grid">
                    <div className="lp-li-achieve-card">
                      <FaGem size={24} color="#7C3AED" />
                      <span className="lp-li-achieve-val">{leader.levelTitle || leader.level || 'Diamond Leader'}</span>
                      <span className="lp-li-achieve-lbl">Current Tier</span>
                    </div>
                    <div className="lp-li-achieve-card">
                      <FaMedal size={24} color="#F59E0B" />
                      <span className="lp-li-achieve-val">{leader.experience || '12 year'}</span>
                      <span className="lp-li-achieve-lbl">Industry Experience</span>
                    </div>
                    <div className="lp-li-achieve-card">
                      <FaCrown size={24} color="#10B981" />
                      <span className="lp-li-achieve-val">Top 10</span>
                      <span className="lp-li-achieve-lbl">Leadership Award</span>
                    </div>
                    <div className="lp-li-achieve-card">
                      <FaStar size={24} color="#EF4444" />
                      <span className="lp-li-achieve-val">Verified</span>
                      <span className="lp-li-achieve-lbl">Leader Status</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. INSTAGRAM-STYLE FOLLOWERS / FOLLOWING POPUP MODAL (WEB) */}
        {showNetworkModal && (
          <div className="lp-li-modal-backdrop" onClick={() => setShowNetworkModal(false)}>
            <div className="lp-li-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="lp-li-modal-head">
                <h3 className="lp-li-modal-title">Network</h3>
                <button
                  type="button"
                  className="lp-li-modal-close-btn"
                  onClick={() => setShowNetworkModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="lp-li-modal-subtabs">
                <button
                  type="button"
                  className={`lp-li-modal-subtab-btn ${networkModalTab === 'followers' ? 'active' : ''}`}
                  onClick={() => setNetworkModalTab('followers')}
                >
                  Followers ({leader.followers || '0'})
                </button>
                <button
                  type="button"
                  className={`lp-li-modal-subtab-btn ${networkModalTab === 'following' ? 'active' : ''}`}
                  onClick={() => setNetworkModalTab('following')}
                >
                  Following ({leader.following || '0'})
                </button>
              </div>

              <div className="lp-li-modal-body">
                {(() => {
                  const list = networkModalTab === 'followers' ? leaderFollowers : leaderFollowing;
                  if (!list || list.length === 0) {
                    return (
                      <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                        No {networkModalTab} yet.
                      </div>
                    );
                  }
                  return list.map((item) => (
                    <div key={item.id} className="lp-li-modal-member-row">
                      <img
                        src={item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Member')}&background=6220FE&color=fff`}
                        alt={item.name}
                        className="lp-li-modal-avatar"
                        onClick={() => {
                          setShowNetworkModal(false);
                          navigate(`/leader/${item.id}`, { state: { leader: item } });
                        }}
                      />
                      <div
                        className="lp-li-modal-info"
                        onClick={() => {
                          setShowNetworkModal(false);
                          navigate(`/leader/${item.id}`, { state: { leader: item } });
                        }}
                      >
                        <span className="lp-li-modal-name">{item.name}</span>
                        <span className="lp-li-modal-role">{item.designation || item.role || 'Member'}</span>
                      </div>
                      {currentUserId && Number(currentUserId) !== Number(item.id) && (
                        <button
                          type="button"
                          className="lp-li-modal-follow-btn"
                          onClick={() => handleTopFollowToggle(item.id, item.name)}
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 7. Bottom Fixed Action Bar */}
        {!isOwnProfile && (
          <div className="lp-li-bottom-bar-figma">
            <button
              type="button"
              className="lp-li-bbar-msg-btn"
              onClick={handleMessageClick}
            >
              <HiChatAlt2 size={16} />
              <span>Message</span>
            </button>
            <button
              type="button"
              className={`lp-li-bbar-follow-btn ${followStatus === 'accepted' ? 'following' : followStatus === 'pending' ? 'pending' : ''}`}
              onClick={handleFollowToggle}
            >
              {followStatus === 'accepted' ? 'Following ✓' : followStatus === 'pending' ? 'Pending ⏳' : '+ Follow'}
            </button>
            <button
              type="button"
              className="lp-li-bbar-share-btn"
              onClick={handleShareProfile}
            >
              <FiShare2 size={16} />
              <span>Share Profile</span>
            </button>
          </div>
        )}
      </div>





      {/* Mobile Bottom Navigation */}
      <UserMobileBottomNav active="Network" />
    </div>
    </>
  );
}
