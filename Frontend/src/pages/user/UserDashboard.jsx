import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCheck, FaUsers, FaUserFriends, FaRegAddressCard, FaShieldAlt } from 'react-icons/fa';
import './UserDashboard.css';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';

// Upload & Dashboard APIs
import { uploadSingleImage } from '../../services/upload.service';
import {
  fetchDashboardOverview,
  fetchPosts,
  submitPost,
  likePostApi,
  fetchTrainers,
  fetchLeaders,
  fetchServices,
  fetchEvents,
  fetchGroups,
  fetchOpportunities,
} from '../../services/dashboard.service';
import {
  toggleFollowUser,
  sendFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  fetchFollowingIds,
} from '../../services/follow.service';
import { joinChat, subscribeToFollowEvents } from '../../services/socket.service';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';

// Dashboard uploaded assets
import postMeshImg from '../../assets/dashboard/post_abstract_mesh.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import postTogetherDreams from '../../assets/dashboard/post_together_dreams.jpg';
import priyaSharmaImg from '../../assets/figma/priya_sharma.png';
import alexMorganImg from '../../assets/figma/alex_morgan.png';
import handshakeBusiness from '../../assets/figma/handshake_business.jpg';
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

  // Logged in user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');

  const [profile, setProfile] = useState({
    id: storedUser.id || 13,
    name: storedUser.name || 'Kapil Dhakad',
    role: storedUser.designation || 'Gold Leader',
    memberId: storedUser.memberId || 'NS381517',
    company: storedUser.companyBrand || storedUser.businessName || 'Index Technology',
    avatarUrl: storedUser.avatarUrl || null,
  });

  const [stats, setStats] = useState({
    network: 0,
    followers: 0,
    following: 0,
    totalPosts: 0,
  });

  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [leadersList, setLeadersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [opportunitiesList, setOpportunitiesList] = useState([]);

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const photoInputRef = useRef(null);
  const postInputRef = useRef(null);

  // Load live data from Backend APIs on Mount
  useEffect(() => {
    async function loadDashboardData() {
      // 1. Overview & stats
      const overview = await fetchDashboardOverview(storedUser.email || '');
      let currentId = storedUser.id || 13;
      if (overview?.success) {
        if (overview.user) {
          currentId = overview.user.id || currentId;
          const freshAvatar = overview.user.avatar_url || storedUser.avatarUrl || null;
          setProfile({
            id: currentId,
            name: overview.user.name || storedUser.name || 'Kapil Dhakad',
            role: overview.user.designation || 'Gold Leader',
            memberId: overview.user.member_id || storedUser.memberId || 'NS381517',
            company: overview.user.company_brand || overview.user.business_name || 'Index Technology',
            avatarUrl: freshAvatar,
          });

          // Sync localStorage if fresh avatar came from DB
          if (overview.user.avatar_url && storedUser.avatarUrl !== overview.user.avatar_url) {
            localStorage.setItem(
              'fortaa_user',
              JSON.stringify({ ...storedUser, avatarUrl: overview.user.avatar_url })
            );
          }
        }
        if (overview.stats) {
          setStats(overview.stats);
        }
      }

      // 2. Fetch following & pending IDs for this user
      const fData = await fetchFollowingIds(currentId);
      setFollowingIds(fData?.followingIds || []);
      setPendingIds(fData?.pendingIds || []);

      // 3. Fetch Posts (Personalized feed for this user)
      const livePosts = await fetchPosts(currentId);
      if (livePosts && livePosts.length > 0) {
        setPosts(livePosts);
      }

      // 4. Supporting widgets
      const [tData, lData, sData, eData, gData, oData] = await Promise.all([
        fetchTrainers(),
        fetchLeaders(currentId),
        fetchServices(),
        fetchEvents(),
        fetchGroups(),
        fetchOpportunities(),
      ]);

      if (tData?.length) setTrainersList(tData);
      
      // Load real database users/leaders (excluding current user)
      const rawLeaders = (lData && lData.length > 0 ? lData : leaders);
      const visibleLeaders = rawLeaders.filter(
        (lead) => Number(lead.id) !== Number(currentId)
      );
      setLeadersList(visibleLeaders.length > 0 ? visibleLeaders : rawLeaders);

      if (sData?.length) setServicesList(sData);
      if (eData?.length) setEventsList(eData);
      if (gData?.length) setGroupsList(gData);
      if (oData?.length) setOpportunitiesList(oData);
    }

    loadDashboardData();

    // Join personal Socket room for real-time alerts
    const myId = storedUser.id || 13;
    joinChat(myId);

    // Subscribe to live follow events (when another user accepts your follow request)
    const unsubFollow = subscribeToFollowEvents({
      onFollowAccepted: ({ targetUserId, targetName }) => {
        const numId = Number(targetUserId);
        setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
        setFollowingIds((prev) => [...new Set([...prev, numId])]);
        setStats((prev) => ({ ...prev, following: (Number(prev.following) || 0) + 1 }));
        toast.success(`${targetName || 'User'} accepted your follow request! 🎉`);
      },
      onFollowUpdated: () => {
        fetchFollowingIds(myId).then((fData) => {
          setFollowingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData?.followingIds || []), ...demoIds])];
          });
          setPendingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData?.pendingIds || []), ...demoIds])];
          });
        });
      },
    });

    // 4-second background sync fallback to guarantee real-time state without page reload
    const pollInterval = setInterval(() => {
      fetchFollowingIds(myId).then((fData) => {
        if (fData?.followingIds) {
          setFollowingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData.followingIds || []), ...demoIds])];
          });
        }
        if (fData?.pendingIds) {
          setPendingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData.pendingIds || []), ...demoIds])];
          });
        }
      });
    }, 4000);

    return () => {
      unsubFollow?.();
      clearInterval(pollInterval);
    };
  }, []);

  // Handle Photo File Pick
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  // Submit Post to Backend (supports description only or with photo)
  const handleCreatePost = async () => {
    if (!postText.trim()) {
      toast.error('Please enter a description for your post');
      return;
    }

    setSubmittingPost(true);
    try {
      let uploadedUrl = null;
      if (postImageFile) {
        uploadedUrl = await uploadSingleImage(postImageFile, 'posts');
      }

      const createdPost = await submitPost({
        content: postText.trim(),
        tags: '#Fortaa #NetworkMarketing #GrowTogether',
        imageUrl: uploadedUrl,
        authorName: profile.name,
        authorRole: profile.role,
        authorAvatar: profile.avatarUrl || null,
        userId: profile.id,
      });

      setPosts((prev) => [createdPost, ...prev]);
      setPostText('');
      setPostImageFile(null);
      setPostImagePreview(null);
      setIsCreatePostModalOpen(false);
      setStats((prev) => ({
        ...prev,
        totalPosts: (Number(prev.totalPosts) || 0) + 1,
      }));
      toast.success('Post published successfully! 🚀');
    } catch (err) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle Follow / Request / Unfollow
  const handleToggleFollow = async (targetUserId, targetName) => {
    if (!targetUserId) {
      toast('Followed demo leader!');
      return;
    }
    const numId = Number(targetUserId);
    if (numId === Number(profile.id)) {
      toast.error('You cannot follow yourself');
      return;
    }

    const isPending = pendingIds.map(Number).includes(numId);
    const isFollowed = followingIds.map(Number).includes(numId);

    if (isPending) {
      // Cancel request
      setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
      toast('Follow request cancelled', { icon: 'ℹ️' });
      try {
        await cancelFollowRequest(numId, profile.id);
      } catch (err) {
        console.warn('Cancel follow note:', err?.message || err);
      }
    } else if (isFollowed) {
      // Unfollow
      setFollowingIds((prev) => prev.filter((id) => Number(id) !== numId));
      setStats((prev) => ({ ...prev, following: Math.max(0, (Number(prev.following) || 0) - 1) }));
      toast(`Unfollowed ${targetName}`);
      try {
        await unfollowUser(numId, profile.id);
      } catch (err) {
        console.warn('Unfollow note:', err?.message || err);
      }
    } else {
      // Send Follow Request
      setPendingIds((prev) => [...prev, numId]);
      toast.success(`Follow request sent to ${targetName}!`);
      try {
        const res = await sendFollowRequest(numId, profile.id);
        if (res && res.status === 'accepted') {
          setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
          setFollowingIds((prev) => [...prev, numId]);
        }
      } catch (err) {
        console.warn('Send follow request note:', err?.message || err);
      }
    }
  };

  // Handle Like (1 like per user toggle)
  const handleLike = async (postId) => {
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const isAlreadyLiked = Boolean(currentPost.has_liked);
    const nextLiked = !isAlreadyLiked;
    const nextCount = Math.max(0, (Number(currentPost.likes_count) || 0) + (nextLiked ? 1 : -1));

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: nextCount, has_liked: nextLiked }
          : p
      )
    );

    // Persist to backend with userId
    const res = await likePostApi(postId, profile.id);
    if (res?.post) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: res.post.likes_count, has_liked: res.liked }
            : p
        )
      );
    }
  };

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
    { label: 'Create Post', icon: qaCreatePostImg, bgColor: '#F6CEFF' },
    { label: 'Add Photo', icon: qaAddPhotoImg, bgColor: '#F6CEFF' },
    { label: 'Share Market Place', icon: qaMarketplaceImg, bgColor: '#E3FFF5' },
    { label: 'Invite Team', icon: qaInviteTeamImg, bgColor: '#DFD4FF' },
    { label: 'Join Group', icon: qaJoinGroupImg, bgColor: '#F6CEFF' },
    { label: 'Go Live', icon: qaGoLiveImg, bgColor: '#FFE3E3' },
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
      {/* ───────────────── DESKTOP VIEW (> 768px) ───────────────── */}
      <div className="ud-desktop-only">
        {/* ───────────────── SHARED REUSABLE TOPBAR ───────────────── */}
        <UserHeader
          user={profile}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onProfileClick={() => navigate('/profile')}
          onMessagesClick={() => navigate('/messages')}
        />

        {/* ───────────────── MAIN WRAPPER: PINNED SIDEBAR + SCROLLABLE RIGHT CONTENT ───────────────── */}
        <div className="ud-main-wrapper">
          {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PINNED) ── */}
          <UserSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'My Profile') navigate('/profile');
              if (tab === 'Messages') navigate('/messages');
              if (tab === 'Leaders') navigate('/leaders');
              if (tab === 'Following') navigate('/following');
            }}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />


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
                  <img src={profile.avatarUrl || userAvatarImg} alt={profile.name} className="ud-hero-avatar" />
                  <span className="ud-hero-verified-badge" title="Verified Member">
                    <FaCheck />
                  </span>
                </div>

                <div className="ud-hero-user-details">
                  <h2 className="ud-hero-name">{profile.name}</h2>
                  <div className="ud-hero-badge-capsule">
                    <span className="ud-badge-shield-icon">
                      <FaShieldAlt />
                    </span>
                    <span className="ud-badge-tech">{profile.company}</span>
                    <span className="ud-badge-sep">|</span>
                    <span className="ud-badge-role">{profile.role}</span>
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
                    <span className="ud-stat-val">{stats.network}</span>
                  </div>
                </div>

                <div className="ud-stat-item ud-stat-frame">
                  <div className="ud-stat-icon-wrap">
                    <FaUserFriends />
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Followers</span>
                    <span className="ud-stat-val">{stats.followers}</span>
                  </div>
                </div>

                <div className="ud-stat-item ud-stat-frame ud-stat-following">
                  <div className="ud-stat-icon-wrap">
                    <FaRegAddressCard />
                  </div>
                  <div className="ud-stat-texts">
                    <span className="ud-stat-label">Following</span>
                    <span className="ud-stat-val">{stats.following}</span>
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
                    <span className="ud-stat-val">{stats.totalPosts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Capsules */}
          <div className="ud-quick-actions-bar">
            {quickActions.map((qa, i) => (
              <button
                key={i}
                className="ud-quick-btn"
                onClick={() => {
                  if (qa.label === 'Create Post') {
                    setIsCreatePostModalOpen(true);
                  } else if (qa.label === 'Add Photo') {
                    setIsCreatePostModalOpen(true);
                    setTimeout(() => photoInputRef.current?.click(), 100);
                  } else {
                    toast(`${qa.label} action triggered!`);
                  }
                }}
              >
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
                  <img src={profile.avatarUrl || userAvatarImg} alt="" className="ud-cp-avatar" />
                  <input
                    ref={postInputRef}
                    type="text"
                    className="ud-cp-input"
                    placeholder="Share your thoughts, business, opportunity or updates..."
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCreatePost();
                      }
                    }}
                  />
                </div>

                {/* Photo Preview if attached */}
                {postImagePreview && (
                  <div style={{ position: 'relative', margin: '8px 12px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={postImagePreview}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPostImageFile(null);
                        setPostImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Hidden File Input for Image Upload */}
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />

                <div className="ud-cp-actions-row">
                  <div className="ud-cp-tags">
                    <button
                      type="button"
                      className="ud-cp-tag"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      📷 Photo
                    </button>
                    <button type="button" className="ud-cp-tag" onClick={() => toast('Video upload coming soon!')}>
                      🎥 Video
                    </button>
                    <button type="button" className="ud-cp-tag" onClick={() => toast('Poll feature coming soon!')}>
                      📊 Poll
                    </button>
                    <button type="button" className="ud-cp-tag" onClick={() => toast('Marketplace tagged!')}>
                      🛍️ Market Place
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ud-cp-btn-post"
                    onClick={handleCreatePost}
                    disabled={submittingPost}
                  >
                    {submittingPost ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>

              {/* ── POST SECTION (Figma: 420x688px, border 1px #D9D9D9, radius 10px) ── */}
              <div className="ud-post-section">
                {(posts.length > 0 ? posts.slice(0, 2) : [
                  {
                    id: 'mock-1',
                    author_name: 'Rahul sharma',
                    author_role: 'Gold Leader',
                    author_avatar: userAvatarImg,
                    time: '2hr ago',
                    content: 'Grateful to be part of an amazing team! Fortaa has given me the right platform to grow, learn and achieve my goals. Together we grow bigger!',
                    tags: '#FortaaMarketing #Teamwork #Success #Fortaa',
                    image_url: postTogetherDreams,
                    likes_count: 124,
                    comments_count: 28,
                    shares_count: 12,
                    has_liked: false,
                  },
                  {
                    id: 'mock-2',
                    author_name: 'Sneha Patel',
                    author_role: 'Platinum Leader',
                    author_avatar: priyaSharmaImg,
                    time: '4hr ago',
                    content: 'Looking for motivated people who want to build their own business and create financial freedom. DM me for more details.',
                    tags: '#Opportunity #FinancialFreedom #JoinNow',
                    likes_count: 85,
                    comments_count: 14,
                    shares_count: 6,
                    has_liked: false,
                  },
                ]).map((post, pIdx) => (
                  <div key={post.id || pIdx} className={`ud-post-item ${pIdx === 0 ? 'ud-post-item-first' : 'ud-post-item-second'}`}>
                    <div className="ud-post-header">
                      <div className="ud-post-avatar-wrap">
                        <img src={post.author_avatar || (pIdx === 0 ? userAvatarImg : priyaSharmaImg)} alt="" className="ud-post-avatar" />
                        <span className="ud-post-online-dot"></span>
                      </div>
                      <div className="ud-post-author-meta">
                        <div className="ud-post-author-name-row">
                          <span className="ud-post-author-name">{post.author_name}</span>
                          <span className="ud-post-badge">{post.author_role || (pIdx === 0 ? 'Gold Leader' : 'Platinum Leader')}</span>
                          <span className="ud-post-time">
                            • {post.time || (post.created_at ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (pIdx === 0 ? '2hr ago' : '4hr ago'))} • 🌐
                          </span>
                        </div>
                      </div>
                      {(() => {
                        const isSelf = post.user_id && Number(post.user_id) === Number(profile.id);
                        if (isSelf) return null;
                        const targetId = post.user_id ? Number(post.user_id) : (pIdx === 0 ? 21 : 22);
                        const isFollowed = followingIds.map(Number).includes(targetId);
                        const isPending = pendingIds.map(Number).includes(targetId);
                        return (
                          <button
                            type="button"
                            className={`ud-btn-follow-post ${isFollowed ? 'following-active' : isPending ? 'pending-active' : ''}`}
                            onClick={() => handleToggleFollow(targetId, post.author_name || 'Leader')}
                          >
                            {isFollowed ? 'Following ✓' : isPending ? 'Pending' : 'Follow'}
                          </button>
                        );
                      })()}
                      <button className="ud-btn-post-menu" type="button">⋮</button>
                    </div>

                    <div className="ud-post-body">
                      <p className="ud-post-text">{post.content}</p>
                      {post.tags && <p className="ud-post-tags">{post.tags}</p>}

                      {/* Post 1: Image banner with Fortaa logo badge */}
                      {(post.image_url || pIdx === 0) && (
                        <div className="ud-post-image-box">
                          <img
                            src={post.image_url || postTogetherDreams}
                            alt="Dream Connect Achieve"
                            className="ud-post-img"
                          />
                          <div className="ud-post-img-logo-badge">
                            <img src={logoTextImg} alt="FORTAA" className="ud-post-logo-badge-img" />
                          </div>
                        </div>
                      )}

                      {/* Post 2: Two Attached Mini Business Opportunity Cards */}
                      {pIdx === 1 && (
                        <div className="ud-attached-opps-list">
                          <div className="ud-attached-opp-card">
                            <div className="ud-attached-opp-left">
                              <div className="ud-opp-mini-avatar-wrap">
                                <img src={priyaSharmaImg} alt="" className="ud-attached-opp-icon" />
                                <span className="ud-post-online-dot"></span>
                              </div>
                              <div className="ud-opp-mini-texts">
                                <h5 className="ud-attached-opp-title">Business Opportunity</h5>
                                <span className="ud-attached-opp-sub">Flexible Working | Live Support | Global Platform</span>
                              </div>
                            </div>
                            <button type="button" className="ud-btn-learn-more" onClick={() => toast.success('Opportunity details opened!')}>
                              Learn More
                            </button>
                          </div>

                          <div className="ud-attached-opp-card">
                            <div className="ud-attached-opp-left">
                              <div className="ud-opp-mini-avatar-wrap">
                                <img src={alexMorganImg} alt="" className="ud-attached-opp-icon" />
                                <span className="ud-post-online-dot"></span>
                              </div>
                              <div className="ud-opp-mini-texts">
                                <h5 className="ud-attached-opp-title">Business Opportunity</h5>
                                <span className="ud-attached-opp-sub">Flexible Working | Live Support | Global Platform</span>
                              </div>
                            </div>
                            <button type="button" className="ud-btn-learn-more" onClick={() => toast.success('Opportunity details opened!')}>
                              Learn More
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Post 1 Reactions & Comments */}
                    {pIdx === 0 && (
                      <>
                        <div className="ud-post-reactions-row">
                          <div className="ud-post-reaction-icons">
                            <span className="ud-react-pill-blue">👍</span>
                            <span className="ud-react-pill-red">❤️</span>
                            <span className="ud-react-count">124</span>
                          </div>
                          <div className="ud-post-comment-counts">
                            <span>28 comments</span>
                            <span>12 shares</span>
                          </div>
                        </div>

                        <div className="ud-post-interact-bar">
                          <button
                            type="button"
                            className={`ud-interact-btn ${post.has_liked ? 'liked-active' : ''}`}
                            onClick={() => handleLike(post.id)}
                          >
                            👍 Like
                          </button>
                          <button type="button" className="ud-interact-btn" onClick={() => toast('Comment modal opened')}>
                            💬 Comment
                          </button>
                          <button type="button" className="ud-interact-btn" onClick={() => toast.success('Link copied to clipboard!')}>
                            ↗️ Share
                          </button>
                        </div>

                        <div className="ud-post-comments-preview">
                          <div className="ud-comment-item">
                            <img src={userAvatarImg} alt="" className="ud-commenter-avatar" />
                            <div className="ud-comment-content">
                              <span className="ud-commenter-name">Amit Verma</span>
                              <span className="ud-commenter-text">Great sharing keep insipiring!</span>
                              <div className="ud-comment-actions">
                                <span>Like</span>
                                <span>Reply</span>
                                <span>1h</span>
                              </div>
                            </div>
                          </div>
                          <div className="ud-comment-input-box">
                            <span className="ud-comment-user-dot"></span>
                            <input type="text" placeholder="Write a Comment..." className="ud-comment-input" />
                            <span className="ud-comment-icon-btn">😊</span>
                            <span className="ud-comment-icon-btn">📷</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* View All Button inside the Post Section */}
                <button
                  type="button"
                  className="ud-btn-view-all-wide ud-feed-view-all"
                  onClick={() => navigate('/all-posts')}
                >
                  View All →
                </button>
              </div>
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
                  {(trainersList.length ? trainersList : trainers).map((t, idx) => (
                    <div key={t.id || idx} className="ud-trainer-card">
                      <div className="ud-trainer-avatar-wrap">
                        <img src={t.avatar_url || userAvatarImg} alt={t.name} />
                      </div>
                      <h4 className="ud-trainer-name">{t.name}</h4>
                      <span className="ud-trainer-role">{t.role}</span>
                      <span className="ud-trainer-stat">{t.network || '1.2K Network'}</span>
                      <span className="ud-trainer-stat">{t.followers || '2K Followers'}</span>
                      <button className="ud-btn-trainer-follow" onClick={() => toast.success(`Following ${t.name}!`)}>
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaders Box (Figma Frame 231: 423x510px) */}
              <div className="ud-side-card ud-leaders-card">
                <div className="ud-side-card-header">
                  <h3 className="ud-side-card-title"># Leaders</h3>
                  <button type="button" onClick={() => navigate("/leaders")} className="ud-side-card-view-all" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>View All →</button>
                </div>
                <div className="ud-leaders-list">
                  {leadersList.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8E8A9F' }}>
                      <span style={{ fontSize: '28px' }}>✨</span>
                      <p style={{ marginTop: '8px', fontWeight: '700', color: '#1F1735', fontSize: '15px' }}>
                        All caught up!
                      </p>
                      <p style={{ fontSize: '13px' }}>
                        You are following all suggested leaders.
                      </p>
                    </div>
                  ) : (
                    leadersList.map((lead, idx) => {
                      const isFollowed = followingIds.map(Number).includes(Number(lead.id));
                      const isPending = pendingIds.map(Number).includes(Number(lead.id));
                      return (
                        <div key={lead.id || idx} className="ud-leader-item">
                          <div className="ud-leader-avatar">
                            <img src={lead.avatar_url || userAvatarImg} alt={lead.name} />
                          </div>
                          <div className="ud-leader-info">
                            <span className="ud-leader-name">{lead.name}</span>
                            <span className="ud-leader-role">{lead.role || 'Business Leader'}</span>
                          </div>
                          <div className="ud-leader-actions">
                            <button
                              className="ud-btn-lead-msg"
                              onClick={() => navigate(`/messages?userId=${lead.id}`)}
                            >
                              Message
                            </button>
                            <button
                              className={`ud-btn-lead-conn ${isFollowed ? 'following-active' : isPending ? 'pending-active' : ''}`}
                              onClick={() => handleToggleFollow(lead.id, lead.name)}
                            >
                              {isFollowed ? 'Following ✓' : isPending ? 'Pending' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Leaders View All Button (Figma Image 2) */}
                <button
                  type="button"
                  className="ud-btn-view-all-wide"
                  onClick={() => navigate('/leaders')}
                >
                  View All →
                </button>
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
              {(servicesList.length ? servicesList : services).map((srv, idx) => (
                <div key={srv.id || idx} className="ud-service-item">
                  <img src={srv.thumb || srv.thumb_url || oppDigitalImg} alt={srv.title} className="ud-service-thumb" />
                  <div className="ud-service-content">
                    <h4 className="ud-service-name">{srv.title}</h4>
                    <p className="ud-service-desc">{srv.desc || srv.description}</p>
                    <div className="ud-service-meta-row">
                      <span className="ud-service-loc">📍 {srv.location}</span>
                      <div className="ud-service-socials">
                        <span>💬</span>
                        <span>📷</span>
                        <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <button className="ud-btn-view-details" onClick={() => toast(`Viewing details for ${srv.title}`)}>
                    View Details →
                  </button>
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
              {(eventsList.length ? eventsList : upcomingEvents).map((ev, idx) => (
                <div key={ev.id || idx} className="ud-event-mini-item">
                  <div className="ud-event-mini-date">
                    <span className="ev-date-num">{ev.date}</span>
                    <span className="ev-date-mo">{ev.month}</span>
                  </div>
                  <div className="ud-event-mini-info">
                    <h5 className="ev-mini-name">{ev.title}</h5>
                    <span className="ev-mini-meta">📍 {ev.type} • Join Now →</span>
                  </div>
                  <button className="ud-btn-view-all-pill" onClick={() => toast.success(`Registered for ${ev.title}!`)}>
                    View All →
                  </button>
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
              {(groupsList.length ? groupsList : popularGroups).map((grp, idx) => (
                <div key={grp.id || idx} className="ud-group-item">
                  <div className="ud-group-avatar">👥</div>
                  <div className="ud-group-info">
                    <h5 className="ud-group-name">{grp.name}</h5>
                    <span className="ud-group-stats">{grp.members}</span>
                  </div>
                  <button className="ud-btn-join-group" onClick={() => toast.success(`Joined ${grp.name}!`)}>
                    Join
                  </button>
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
              {(opportunitiesList.length ? opportunitiesList : opportunities).map((opp, idx) => (
                <div key={opp.id || idx} className={`ud-opp-card ${idx === 2 ? 'ud-opp-card-with-nav' : ''}`}>
                  <div className="ud-opp-img-wrap">
                    <img
                      src={opp.image || opp.image_url || (idx % 2 === 0 ? oppDigitalImg : oppLeadershipImg)}
                      alt={opp.title}
                      className="ud-opp-img"
                    />
                    {opp.is_new || opp.isNew ? <span className="ud-opp-badge-new">New</span> : null}
                    {idx === 2 && (
                      <button
                        type="button"
                        className="ud-opp-carousel-arrow"
                        onClick={() => toast('Showing next opportunities...')}
                        aria-label="Next opportunities"
                      >
                        ›
                      </button>
                    )}
                  </div>
                  <div className="ud-opp-card-body">
                    <h3 className="ud-opp-card-title">{opp.title}</h3>
                    <div className="ud-opp-pill-row">
                      {(opp.tags || ['Work from Home', 'High Earning']).map((tag, tIdx) => (
                        <span key={tIdx} className="ud-opp-pill">{tag}</span>
                      ))}
                    </div>
                    <div className="ud-opp-footer">
                      <span className="ud-opp-price">{opp.price}</span>
                      <button className="ud-btn-apply" onClick={() => toast.success(`Applied for ${opp.title}!`)}>
                        Apply Now →
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Unlock Your Full Potential Card */}
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
                  <button className="ud-btn-join-now" onClick={() => toast.success('Welcome to Fortaa Community!')}>
                    Join Now →
                  </button>
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

      {/* ───────────────── FIGMA MOBILE DASHBOARD (<= 768px) ───────────────── */}
      <div className="ud-mobile-only">
        {/* Mobile Header (Royal Blue #3A23D5) */}
        <header className="ud-mob-header">
          {/* Top Action Row: Logo Pill on Left + Icons on Right */}
          <div className="ud-mob-nav-row">
            <Link to="/dashboard" className="ud-mob-logo-pill" title="FORTAA Home">
              <img src={logoIconImg} alt="Fortaa" className="ud-mob-logo-icon" />
              <div className="ud-mob-logo-text">
                <img src={logoTextImg} alt="FORTAA" className="ud-mob-logo-word" />
                <span className="ud-mob-logo-tagline">Discover, easy and Grow</span>
              </div>
            </Link>

            <div className="ud-mob-header-actions">
              <button
                type="button"
                className="ud-mob-icon-btn"
                title="WhatsApp"
                onClick={() => toast.success('Connecting to WhatsApp...')}
              >
                <img src={whatsappIconImg} alt="WhatsApp" className="ud-mob-action-img" />
              </button>

              <button
                type="button"
                className="ud-mob-icon-btn"
                title="Notifications"
                onClick={() => toast('3 New Notifications', { icon: '🔔' })}
              >
                <img src={bellIconImg} alt="Notifications" className="ud-mob-action-img" />
                <span className="ud-mob-red-badge">3</span>
              </button>

              <button
                type="button"
                className="ud-mob-icon-btn"
                title="Messages"
                onClick={() => navigate('/messages')}
              >
                <img src={messageIconImg} alt="Messages" className="ud-mob-action-img" />
                <span className="ud-mob-red-badge">3</span>
              </button>

              <div
                className="ud-mob-avatar-btn"
                onClick={() => navigate('/profile')}
                title="View Profile"
              >
                <img src={profile.avatarUrl || userAvatarImg} alt={profile.name} className="ud-mob-avatar-img" />
              </div>
            </div>
          </div>

          {/* Full-width Search Bar */}
          <div className="ud-mob-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#232356" strokeWidth="2.2" className="ud-mob-search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="ud-mob-search-input"
              placeholder="Search people, posts, companies, products, opportunities..."
            />
          </div>
        </header>

        {/* Main Content Card: Frame 109 (White container with soft glow) */}
        <div className="ud-mob-frame109">
          {/* Create Post Strip */}
          <div className="ud-mob-create-post-strip">
            <div className="ud-mob-cp-top">
              <img src={profile.avatarUrl || userAvatarImg} alt="" className="ud-mob-cp-avatar" />
              <input
                type="text"
                className="ud-mob-cp-input"
                placeholder="Share your thoughts, success, opportunity or updates.."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePost();
                }}
              />
            </div>

            <div className="ud-mob-cp-pills">
              <button type="button" className="ud-mob-cp-pill" onClick={() => photoInputRef.current?.click()}>
                <span>📷</span>
                <span>Photo</span>
              </button>

              <button type="button" className="ud-mob-cp-pill" onClick={() => toast('Video upload coming soon!')}>
                <span>🔴</span>
                <span>Video</span>
              </button>

              <button type="button" className="ud-mob-cp-pill" onClick={() => toast('Polls feature active!')}>
                <span>💬</span>
                <span>Poll</span>
              </button>

              <button type="button" className="ud-mob-cp-pill" onClick={() => navigate('/marketplace')}>
                <span>🎯</span>
                <span>Market Place</span>
              </button>

              <button
                type="button"
                className="ud-mob-cp-post-btn"
                onClick={handleCreatePost}
                disabled={submittingPost || !postText.trim()}
              >
                {submittingPost ? '...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Stories / Highlights Row (Frame 188 - 192) */}
          <div className="ud-mob-stories-row">
            {/* Story 1: Add Story */}
            <div className="ud-mob-story-card story-add" onClick={() => setIsCreatePostModalOpen(true)}>
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-add-icon">+</div>
              </div>
              <span className="ud-mob-story-name">Add Story</span>
            </div>

            {/* Story 2: Amit Yadav */}
            <div className="ud-mob-story-card story-amit">
              <div className="ud-mob-story-avatar-wrap">
                <img src={userAvatarImg} alt="Amit Yadav" className="ud-mob-story-img" />
                <span className="ud-mob-story-badge">+</span>
              </div>
              <span className="ud-mob-story-name">Amit Yadav</span>
            </div>

            {/* Story 3: Neha Gupta */}
            <div className="ud-mob-story-card story-neha">
              <div className="ud-mob-story-avatar-wrap">
                <img src={priyaSharmaImg} alt="Neha Gupta" className="ud-mob-story-img" />
                <span className="ud-mob-story-badge">+</span>
              </div>
              <span className="ud-mob-story-name">Neha Gupta</span>
            </div>

            {/* Story 4: Upcoming Event */}
            <div className="ud-mob-story-card story-event">
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-calendar-icon">📅</div>
              </div>
              <span className="ud-mob-story-name">Upcoming Event</span>
            </div>

            {/* Story 5: Top Leaders */}
            <div className="ud-mob-story-card story-leaders" onClick={() => navigate("/leaders")} style={{ cursor: "pointer" }}>
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-crown-icon">👑</div>
              </div>
              <span className="ud-mob-story-name">Top Leaders</span>
            </div>
          </div>

          {/* All Posts Feed */}
          <div className="ud-mob-posts-feed">
            {posts && posts.length > 0 ? (
              posts.map((post, pIdx) => (
                <article key={post.id || pIdx} className="ud-mob-post-card">
                  <div className="ud-mob-post-header">
                    <div className="ud-mob-post-author">
                      <div className="ud-mob-author-avatar-wrap">
                        <img src={post.author_avatar || userAvatarImg} alt={post.author_name} className="ud-mob-author-avatar" />
                        <span className="ud-mob-online-dot" />
                      </div>
                      <div className="ud-mob-author-meta">
                        <h4 className="ud-mob-author-name">{post.author_name || 'Fortaa Member'}</h4>
                        <span className="ud-mob-author-sub">
                          {post.author_role || 'Leader'} • {post.created_at ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} • 🌐
                        </span>
                      </div>
                    </div>

                    <div className="ud-mob-post-header-right">
                      {(() => {
                        const isSelf = post.user_id && Number(post.user_id) === Number(profile.id);
                        if (isSelf) return null;
                        const targetId = post.user_id ? Number(post.user_id) : (pIdx === 0 ? 21 : 22);
                        const isFollowed = followingIds.map(Number).includes(targetId);
                        const isPending = pendingIds.map(Number).includes(targetId);
                        return (
                          <button
                            type="button"
                            className={`ud-mob-btn-follow ${isFollowed ? 'following-active' : isPending ? 'pending-active' : ''}`}
                            onClick={() => handleToggleFollow(targetId, post.author_name || 'Leader')}
                          >
                            {isFollowed ? 'Following ✓' : isPending ? 'Pending' : 'Follow'}
                          </button>
                        );
                      })()}
                      <button type="button" className="ud-mob-btn-menu" aria-label="More options">
                        ⋮
                      </button>
                    </div>
                  </div>

                  <p className="ud-mob-post-text">{post.content}</p>

                  {post.tags && (
                    <div className="ud-mob-post-tags">
                      {post.tags.split(' ').map((tg, i) => (
                        <span key={i}>{tg} </span>
                      ))}
                    </div>
                  )}

                  {post.image_url && (
                    <div className="ud-mob-post-banner-wrap">
                      <img src={post.image_url} alt="Post content" className="ud-mob-post-banner-img" />
                    </div>
                  )}

                  {/* Reactions Bar */}
                  <div className="ud-mob-post-engagement">
                    <div className="ud-mob-engagement-reactions">
                      <span className="ud-mob-reaction-badge blue">👍</span>
                      <span className="ud-mob-reaction-badge orange">🧡</span>
                      <span className="ud-mob-engagement-count">{post.likes_count || 0}</span>
                    </div>
                    <div className="ud-mob-engagement-stats">
                      <span>{post.comments_count || 0} comments</span>
                      <span>•</span>
                      <span>{post.shares_count || 0} shares</span>
                    </div>
                  </div>

                  {/* Action Buttons: Like, Comment, Share */}
                  <div className="ud-mob-post-actions-row">
                    <button
                      type="button"
                      className="ud-mob-post-action-btn"
                      onClick={() => handleLike(post.id)}
                      style={{
                        color: post.has_liked ? '#5A2CE4' : 'inherit',
                        fontWeight: post.has_liked ? '700' : '500',
                      }}
                    >
                      <span>{post.has_liked ? '❤️' : '👍'}</span>
                      <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button type="button" className="ud-mob-post-action-btn" onClick={() => toast('Comments opening...')}>
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                    <button
                      type="button"
                      className="ud-mob-post-action-btn"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        toast.success('Post link copied!');
                      }}
                    >
                      <span>↗</span>
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <>
                {/* Fallback Figma Post 1: Rahul Sharma */}
                <article className="ud-mob-post-card">
                  <div className="ud-mob-post-header">
                    <div className="ud-mob-post-author">
                      <div className="ud-mob-author-avatar-wrap">
                        <img src={userAvatarImg} alt="Rahul Sharma" className="ud-mob-author-avatar" />
                        <span className="ud-mob-online-dot" />
                      </div>
                      <div className="ud-mob-author-meta">
                        <h4 className="ud-mob-author-name">Rahul sharma</h4>
                        <span className="ud-mob-author-sub">Gold Leader • 2hr ago • 🌐</span>
                      </div>
                    </div>

                    <div className="ud-mob-post-header-right">
                      {(() => {
                        const targetId = 21;
                        const isFollowed = followingIds.map(Number).includes(targetId);
                        const isPending = pendingIds.map(Number).includes(targetId);
                        return (
                          <button
                            type="button"
                            className={`ud-mob-btn-follow ${isFollowed ? 'following-active' : isPending ? 'pending-active' : ''}`}
                            onClick={() => handleToggleFollow(targetId, 'Rahul sharma')}
                          >
                            {isFollowed ? 'Following ✓' : isPending ? 'Pending' : 'Follow'}
                          </button>
                        );
                      })()}
                      <button type="button" className="ud-mob-btn-menu" aria-label="More options">
                        ⋮
                      </button>
                    </div>
                  </div>

                  <p className="ud-mob-post-text">
                    Grateful to be part of an amazing team! Fortaa has given me the right platform to grow, learn and achieve my goals. Together we grow bigger!
                  </p>

                  <div className="ud-mob-post-tags">
                    <span>#FortaaMarketing</span> <span>#Teamwork</span> <span>#Success</span> <span>#Fortaa</span>
                  </div>

                  {/* Dream Connect Achieve Banner Image */}
                  <div className="ud-mob-post-banner-wrap">
                    <img src={postTogetherDreams} alt="Dream Connect Achieve" className="ud-mob-post-banner-img" />
                    <div className="ud-mob-banner-overlay-logo">
                      <img src={logoTextImg} alt="Fortaa" className="ud-mob-banner-fortaa-word" />
                    </div>
                  </div>

                  {/* Reactions Bar */}
                  <div className="ud-mob-post-engagement">
                    <div className="ud-mob-engagement-reactions">
                      <span className="ud-mob-reaction-badge blue">👍</span>
                      <span className="ud-mob-reaction-badge orange">🧡</span>
                      <span className="ud-mob-engagement-count">124</span>
                    </div>
                    <div className="ud-mob-engagement-stats">
                      <span>28 comments</span>
                      <span>•</span>
                      <span>12 shares</span>
                    </div>
                  </div>

                  {/* Action Buttons: Like, Comment, Share */}
                  <div className="ud-mob-post-actions-row">
                    <button type="button" className="ud-mob-post-action-btn" onClick={() => toast.success('Liked Rahul\'s post!')}>
                      <span>👍</span>
                      <span>Like</span>
                    </button>
                    <button type="button" className="ud-mob-post-action-btn" onClick={() => toast('Comment section')}>
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                    <button type="button" className="ud-mob-post-action-btn" onClick={() => toast.success('Shared!')}>
                      <span>↗</span>
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comment Preview */}
                  <div className="ud-mob-comment-preview">
                    <img src={alexMorganImg} alt="" className="ud-mob-comment-avatar" />
                    <div className="ud-mob-comment-body">
                      <span className="ud-mob-comment-author">Amit Verma</span>
                      <p className="ud-mob-comment-msg">Great sharing keep insipiring!</p>
                      <div className="ud-mob-comment-meta">
                        <button type="button">Like</button>
                        <button type="button">Reply</button>
                        <span>1h</span>
                      </div>
                    </div>
                  </div>

                  {/* Write a comment input */}
                  <div className="ud-mob-comment-input-row">
                    <img src={profile.avatarUrl || userAvatarImg} alt="" className="ud-mob-comment-my-avatar" />
                    <div className="ud-mob-comment-input-box">
                      <span className="ud-mob-input-icon">🔍</span>
                      <input type="text" placeholder="Write a Comment" className="ud-mob-comment-field" />
                      <span className="ud-mob-comment-tool">😊</span>
                      <span className="ud-mob-comment-tool">📷</span>
                    </div>
                  </div>
                </article>

                {/* Fallback Figma Post 2: Sneha Patel */}
                <article className="ud-mob-post-card">
                  <div className="ud-mob-post-header">
                    <div className="ud-mob-post-author">
                      <div className="ud-mob-author-avatar-wrap">
                        <img src={priyaSharmaImg} alt="Sneha Patel" className="ud-mob-author-avatar" />
                        <span className="ud-mob-online-dot" />
                      </div>
                      <div className="ud-mob-author-meta">
                        <h4 className="ud-mob-author-name">Sneha Patel</h4>
                        <span className="ud-mob-author-sub">Platinum Leader • 4hr ago • 🌐</span>
                      </div>
                    </div>

                    <div className="ud-mob-post-header-right">
                      {(() => {
                        const targetId = 22;
                        const isFollowed = followingIds.map(Number).includes(targetId);
                        const isPending = pendingIds.map(Number).includes(targetId);
                        return (
                          <button
                            type="button"
                            className={`ud-mob-btn-follow ${isFollowed ? 'following-active' : isPending ? 'pending-active' : ''}`}
                            onClick={() => handleToggleFollow(targetId, 'Sneha Patel')}
                          >
                            {isFollowed ? 'Following ✓' : isPending ? 'Pending' : 'Follow'}
                          </button>
                        );
                      })()}
                      <button type="button" className="ud-mob-btn-menu" aria-label="More options">
                        ⋮
                      </button>
                    </div>
                  </div>

                  <p className="ud-mob-post-text">
                    Looking for motivated people who want to build their own business and create financial freedom. DM me for more details.
                  </p>

                  <div className="ud-mob-post-tags">
                    <span>#Opportunity</span> <span>#FinancialFreedom</span> <span>#JoinNow</span>
                  </div>

                  {/* Embedded Opportunity Card */}
                  <div className="ud-mob-opp-card-embed">
                    <div className="ud-mob-opp-card-thumb">
                      <span>BUILD YOUR FUTURE</span>
                      <img src={logoTextImg} alt="" className="ud-mob-opp-fortaa-tiny" />
                    </div>
                    <div className="ud-mob-opp-card-info">
                      <h5 className="ud-mob-opp-title">Business Opportunity</h5>
                      <p className="ud-mob-opp-desc">Flexible Working | Live Support | Global Platform</p>
                      <button type="button" className="ud-mob-opp-btn" onClick={() => navigate('/opportunity')}>
                        Learn More
                      </button>
                    </div>
                  </div>

                  {/* Team Image Banner */}
                  <div className="ud-mob-post-banner-wrap">
                    <img src={handshakeBusiness} alt="Team" className="ud-mob-post-banner-img" />
                  </div>

                  <div className="ud-mob-post-tags">
                    <span>#FortaaMarketing</span> <span>#Teamwork</span> <span>#Success</span> <span>#Fortaa</span>
                  </div>

                  {/* Reactions Bar */}
                  <div className="ud-mob-post-engagement">
                    <div className="ud-mob-engagement-reactions">
                      <span className="ud-mob-reaction-badge blue">👍</span>
                      <span className="ud-mob-reaction-badge orange">🧡</span>
                      <span className="ud-mob-engagement-count">124</span>
                    </div>
                    <div className="ud-mob-engagement-stats">
                      <span>30 comments</span>
                      <span>•</span>
                      <span>15 shares</span>
                    </div>
                  </div>
                </article>
              </>
            )}
          </div>
        </div>

        {/* Fixed Bottom Navigation Bar ("Home Navbar") */}
        <nav className="ud-mob-bottom-navbar">
          <button
            type="button"
            className={`ud-mob-bnav-item ${activeTab === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveTab('Home')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`ud-mob-bnav-item ${activeTab === 'Network' ? 'active' : ''}`}
            onClick={() => setActiveTab('Network')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Network</span>
          </button>

          {/* Center Floating Plus FAB */}
          <button
            type="button"
            className="ud-mob-bnav-fab"
            onClick={() => setIsCreatePostModalOpen(true)}
            aria-label="Create Post"
          >
            +
          </button>

          <button
            type="button"
            className={`ud-mob-bnav-item ${activeTab === 'Opportunity' ? 'active' : ''}`}
            onClick={() => setActiveTab('Opportunity')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>Opportunity</span>
          </button>

          <button
            type="button"
            className={`ud-mob-bnav-item ${activeTab === 'More' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2.5" />
              <circle cx="19" cy="12" r="2.5" />
              <circle cx="5" cy="12" r="2.5" />
            </svg>
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* ───────────────── CREATE POST POPUP MODAL ───────────────── */}
      {isCreatePostModalOpen && (
        <div
          className="ud-modal-backdrop"
          onClick={() => {
            setIsCreatePostModalOpen(false);
          }}
        >
          <div className="ud-create-post-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="ud-cpm-header">
              <h3 className="ud-cpm-title">Create a Post</h3>
              <button
                type="button"
                className="ud-cpm-close-btn"
                onClick={() => setIsCreatePostModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Author Meta Row */}
            <div className="ud-cpm-author-row">
              <img src={profile.avatarUrl || userAvatarImg} alt={profile.name} className="ud-cpm-avatar" />
              <div className="ud-cpm-author-info">
                <span className="ud-cpm-author-name">{profile.name}</span>
                <div className="ud-cpm-badge-row">
                  <span className="ud-cpm-role-pill">{profile.role}</span>
                  <span className="ud-cpm-public-pill">🌐 Anyone</span>
                </div>
              </div>
            </div>

            {/* Input Body */}
            <div className="ud-cpm-body">
              <textarea
                className="ud-cpm-textarea"
                placeholder="What do you want to talk about? Share an update, business opportunity or insight..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                autoFocus
              />

              {/* Photo Preview if attached */}
              {postImagePreview && (
                <div className="ud-cpm-preview-box">
                  <img src={postImagePreview} alt="Preview" className="ud-cpm-preview-img" />
                  <button
                    type="button"
                    className="ud-cpm-remove-preview"
                    onClick={() => {
                      setPostImageFile(null);
                      setPostImagePreview(null);
                    }}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="ud-cpm-tools-row">
                <span className="ud-cpm-tools-label">Add to your post:</span>
                <div className="ud-cpm-tools-btns">
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    📷 Photo
                  </button>
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => toast('Video upload coming soon!')}
                  >
                    🎥 Video
                  </button>
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => toast.success('Tag #Fortaa added!')}
                  >
                    🏷️ Tags
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="ud-cpm-footer">
              <button
                type="button"
                className="ud-cpm-cancel-btn"
                onClick={() => setIsCreatePostModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ud-cpm-submit-btn"
                onClick={handleCreatePost}
                disabled={submittingPost || !postText.trim()}
              >
                {submittingPost ? 'Publishing...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
