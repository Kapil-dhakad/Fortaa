import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProfilePage.css';
import './UserDashboard.css';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import PostComments from '../../components/posts/PostComments';
import ShareModal from '../../components/posts/ShareModal';
import { FaRegThumbsUp, FaThumbsUp, FaRegComment } from 'react-icons/fa';
import { RiShareForwardLine } from 'react-icons/ri';
import { FiEdit3, FiTrash2, FiUsers, FiFolderPlus, FiCompass } from 'react-icons/fi';

// User, Follow & Dashboard Services
import { fetchUserProfile, updateUserProfile as apiUpdateUserProfile } from '../../services/user.service';
import { uploadSingleImage } from '../../services/upload.service';
import { fetchPosts, fetchDashboardOverview, likePostApi, updatePostApi, deletePostApi, votePollApi } from '../../services/dashboard.service';
import {
  fetchFollowers,
  fetchFollowing,
  fetchUserSocialCounts,
  toggleFollowUser,
  unfollowUser,
  cancelFollowRequest,
} from '../../services/follow.service';
import { fetchUserGroups } from '../../services/group.service';
import PostLikersModal from '../../components/posts/PostLikersModal';
import {
  formatRelativeTime,
  renderFormattedContent,
  renderInstagramLikes,
  PostPoll,
} from './UserDashboard';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';

// Dashboard & Profile assets
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import sidebarMegaphoneImg from '../../assets/dashboard/sidebar_megaphone_3d.png';
import whatsappIconImg from '../../assets/dashboard/whatsaap-icon.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';
import profileCoverPurple from '../../assets/dashboard/profile_cover_purple.png';
import postTogetherDreams from '../../assets/dashboard/post_together_dreams.jpg';
import postExcitedFortaa from '../../assets/dashboard/post_excited_fortaa.jpg';

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('My Profile');
  const [activeTab, setActiveTab] = useState('All posts');
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditMenu, setActiveEditMenu] = useState('Personal Information');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals for Photo & Cover
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Stored user profile state
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  const currentUserId = storedUser.id || 13;

  const [userProfile, setUserProfile] = useState(() => {
    return {
      name: storedUser.name || 'User',
      username: storedUser.username || (storedUser.email ? storedUser.email.split('@')[0] : 'user'),
      dob: storedUser.dob || '',
      gender: storedUser.gender || 'Male',
      location: storedUser.location || '',
      email: storedUser.email || '',
      mobile: storedUser.mobileNumber || storedUser.mobile_number || '',
      altMobile: storedUser.altMobile || '',
      whatsapp: storedUser.whatsappNumber || '',
      website: storedUser.websiteSocial || '',
      skills: storedUser.skills ? (typeof storedUser.skills === 'string' ? storedUser.skills.split(',').map(s => s.trim()) : storedUser.skills) : [],
      achievements: ['Top performer', 'Community Star'],
      socialLinks: {
        linkedin: '',
        instagram: '',
        twitter: '',
      },
      experience: storedUser.experience || '',
      bio: storedUser.bio || '',
      company: storedUser.companyBrand || storedUser.businessName || 'Index Technology',
      userRole: storedUser.designation || storedUser.role || 'Senior Leader',
      avatarImg: storedUser.avatarUrl || userAvatarImg,
      coverImg: profileCoverPurple,
    };
  });

  const [formData, setFormData] = useState({ ...userProfile });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Presets for Profile Photo Modal
  const avatarPresets = [
    { id: 1, img: userAvatarImg, label: 'Young Professional' },
    { id: 2, img: userAvatarImg, label: 'Bearded Stylist' },
    { id: 3, img: userAvatarImg, label: 'Creative Designer' },
    { id: 4, img: userAvatarImg, label: 'Lead Specialist' },
  ];
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);

  // Presets for Cover Photo Modal
  const coverPresets = [
    { id: 1, img: profileCoverPurple },
    { id: 2, img: postTogetherDreams },
    { id: 3, img: postExcitedFortaa },
    { id: 4, img: profileCoverPurple },
    { id: 5, img: postTogetherDreams },
    { id: 6, img: postExcitedFortaa },
  ];
  const [selectedCoverId, setSelectedCoverId] = useState(1);

  // Password fields state
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profilePhotoInputRef = useRef(null);

  // Real DB Data for Profile
  const [socialCounts, setSocialCounts] = useState({
    networkCount: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  });
  const [myPosts, setMyPosts] = useState([]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [networkTeamList, setNetworkTeamList] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [likesModalPostId, setLikesModalPostId] = useState(null);

  // Post 3-dots Menu & Edit/Delete State
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const postMenuRef = useRef(null);

  // Close post 3-dots menu on outside click
  useEffect(() => {
    function handlePostMenuOutside(e) {
      if (
        postMenuRef.current &&
        !postMenuRef.current.contains(e.target) &&
        !e.target.closest('.prof-btn-menu-dots')
      ) {
        setActivePostMenuId(null);
      }
    }
    if (activePostMenuId) {
      document.addEventListener('mousedown', handlePostMenuOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handlePostMenuOutside);
    };
  }, [activePostMenuId]);

  const handleStartEdit = (post) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditTags(post.tags || '');
    setActivePostMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    setSavingEdit(true);
    const res = await updatePostApi(editingPost.id, {
      content: editContent.trim(),
      tags: editTags.trim(),
      userId: currentUserId,
    });
    setSavingEdit(false);
    if (res?.success) {
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, content: editContent.trim(), tags: editTags.trim() }
            : p
        )
      );
      toast.success('Post updated successfully!');
      setEditingPost(null);
    } else {
      toast.error(res?.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    setActivePostMenuId(null);
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const res = await deletePostApi(postId, currentUserId);
    if (res?.success) {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      setSocialCounts((prev) => ({
        ...prev,
        postsCount: Math.max(0, (Number(prev.postsCount) || 1) - 1),
      }));
      toast.success('Post deleted successfully!');
    } else {
      toast.error(res?.message || 'Failed to delete post');
    }
  };

  // Load real profile counts, posts, followers & following from PostgreSQL
  useEffect(() => {
    async function loadProfileSocialData() {
      // 0. Live user profile from PostgreSQL
      const dbProfile = await fetchUserProfile(currentUserId);
      if (dbProfile) {
        const loadedProfile = {
          name: dbProfile.name || storedUser.name || 'User',
          username: dbProfile.username || dbProfile.email?.split('@')[0] || 'user',
          dob: dbProfile.dob ? dbProfile.dob.split('T')[0] : (storedUser.dob || ''),
          gender: dbProfile.gender || storedUser.gender || 'Male',
          location: dbProfile.location || storedUser.location || '',
          email: dbProfile.email || storedUser.email || '',
          mobile: dbProfile.mobile_number || storedUser.mobileNumber || '',
          altMobile: storedUser.altMobile || '',
          whatsapp: storedUser.whatsappNumber || '',
          website: dbProfile.website_social || storedUser.websiteSocial || '',
          skills: dbProfile.skills
            ? (typeof dbProfile.skills === 'string' ? dbProfile.skills.split(',').map((s) => s.trim()) : dbProfile.skills)
            : (storedUser.skills ? (typeof storedUser.skills === 'string' ? storedUser.skills.split(',').map((s) => s.trim()) : storedUser.skills) : []),
          achievements: ['Top performer', 'Community Star'],
          socialLinks: {
            linkedin: '',
            instagram: '',
            twitter: '',
          },
          experience: dbProfile.experience || storedUser.experience || '',
          bio: dbProfile.bio || storedUser.bio || '',
          company: dbProfile.company_brand || dbProfile.business_name || storedUser.companyBrand || 'Forever Living',
          userRole: dbProfile.designation || storedUser.designation || 'Senior Leader',
          avatarImg: dbProfile.avatar_url || storedUser.avatarUrl || userAvatarImg,
          coverImg: profileCoverPurple,
        };
        setUserProfile(loadedProfile);
        setFormData(loadedProfile);
      }

      // 1. Live counts
      const counts = await fetchUserSocialCounts(currentUserId);
      if (counts?.success) {
        setSocialCounts({
          networkCount: counts.networkCount || 0,
          followersCount: counts.followersCount,
          followingCount: counts.followingCount,
          postsCount: counts.postsCount,
        });
      }

      // 2. My own posts
      const posts = await fetchPosts(currentUserId, 'mine');
      setMyPosts(posts);

      // 3. Followers & Following & Network Team lists
      const [fFollowers, fFollowing, groupsData] = await Promise.all([
        fetchFollowers(currentUserId),
        fetchFollowing(currentUserId),
        fetchUserGroups(currentUserId),
      ]);
      setFollowersList(fFollowers);
      setFollowingList(fFollowing);
      if (groupsData) {
        setJoinedGroups(groupsData.joinedGroups || []);
        setCreatedGroups(groupsData.createdGroups || []);
      }

      try {
        const teamRes = await fetch(`/api/users/team/${currentUserId}`);
        const teamData = await teamRes.json();
        if (teamData?.success && Array.isArray(teamData.team)) {
          setNetworkTeamList(teamData.team);
          setSocialCounts((prev) => ({
            ...prev,
            networkCount: teamData.team.length,
          }));
        }
      } catch (err) {
        console.warn('Fetch network team error:', err);
      }
    }

    loadProfileSocialData();
  }, [currentUserId]);

  const handleViewFollowerProfile = (follower) => {
    const targetId = follower?.id || follower?.user_id;
    if (targetId) {
      navigate(`/leader/${targetId}`, {
        state: {
          leader: {
            id: targetId,
            name: follower.name,
            avatar: follower.avatar_url,
            levelTitle: follower.designation,
          },
        },
      });
    } else {
      navigate('/leaders');
    }
  };

  const formatAtUsername = (u) => {
    if (!u) return '@user';
    const clean = String(u).trim();
    return clean.startsWith('@') ? clean : `@${clean}`;
  };

  const handleUnfollowFromProfile = async (targetId, targetName) => {
    const confirm = window.confirm(`Are you sure you want to unfollow ${targetName}?`);
    if (!confirm) return;

    setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
    setSocialCounts((prev) => ({
      ...prev,
      followingCount: Math.max(0, prev.followingCount - 1),
    }));
    toast(`Unfollowed ${targetName}`);

    try {
      await unfollowUser(targetId, currentUserId);
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  };

  const handleCancelRequestFromProfile = async (targetId, targetName) => {
    const confirm = window.confirm(`Cancel follow request to ${targetName}?`);
    if (!confirm) return;

    setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
    toast('Follow request cancelled', { icon: 'ℹ️' });

    try {
      await cancelFollowRequest(targetId, currentUserId);
    } catch (err) {
      console.error('Cancel request error:', err);
    }
  };

  const handleLike = async (postId) => {
    const currentPost = myPosts.find((p) => p.id === postId);
    if (!currentPost) return;

    const isAlreadyLiked = Boolean(currentPost.has_liked);
    const nextLiked = !isAlreadyLiked;
    const nextCount = Math.max(0, (Number(currentPost.likes_count) || 0) + (nextLiked ? 1 : -1));

    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes_count: nextCount, has_liked: nextLiked } : p
      )
    );

    const res = await likePostApi(postId, currentUserId);
    if (res?.post) {
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: res.post.likes_count,
                has_liked: res.liked,
                latest_liker_name: res.post.latest_liker_name,
                latest_liker_avatar: res.post.latest_liker_avatar,
              }
            : p
        )
      );
    }
  };

  const handleVotePoll = async (postId, optionId) => {
    const voterId = currentUserId;
    if (!voterId) return;

    setMyPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        let poll = null;
        try {
          poll = typeof p.poll_data === 'string' ? JSON.parse(p.poll_data) : { ...p.poll_data };
        } catch {
          return p;
        }
        if (!poll || !poll.options) return p;
        poll.voters = poll.voters || {};
        const previousVote = poll.voters[voterId];
        if (previousVote === optionId) return p;

        poll.options = poll.options.map((opt) => {
          let votes = Number(opt.votes) || 0;
          if (opt.id === previousVote) votes = Math.max(0, votes - 1);
          if (opt.id === optionId) votes += 1;
          return { ...opt, votes };
        });
        poll.voters[voterId] = optionId;
        poll.totalVotes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);
        return { ...p, poll_data: poll };
      })
    );

    try {
      const res = await votePollApi(postId, optionId, voterId);
      if (res?.success && res.pollData) {
        setMyPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? { ...p, poll_data: res.pollData } : p))
        );
      }
    } catch (err) {
      console.warn('Vote poll error in profile:', err);
    }
  };

  const handleOpenEdit = () => {
    setFormData({ ...userProfile });
    setActiveEditMenu('Personal Information');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setUserProfile({ ...formData });

    try {
      await apiUpdateUserProfile(currentUserId, {
        name: formData.name,
        username: formData.username,
        dob: formData.dob,
        gender: formData.gender,
        location: formData.location,
        mobileNumber: formData.mobile,
        skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills,
        experience: formData.experience,
        bio: formData.bio,
      });

      const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
      localStorage.setItem('fortaa_user', JSON.stringify({
        ...stored,
        name: formData.name,
        username: formData.username,
        dob: formData.dob,
        gender: formData.gender,
        location: formData.location,
        mobileNumber: formData.mobile,
        skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills,
        experience: formData.experience,
        bio: formData.bio,
      }));
      toast.success('Profile updated in database successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save changes');
    }
    setIsEditing(false);
  };

  // Select Avatar from PC / Mobile
  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  // Upload Avatar to AWS S3 & Save to DB
  const handleSaveProfilePhoto = async () => {
    setUploadingPhoto(true);
    try {
      if (profilePhotoFile) {
        const s3Url = await uploadSingleImage(profilePhotoFile, 'avatars');
        if (s3Url) {
          setUserProfile((prev) => ({ ...prev, avatarImg: s3Url }));
          setFormData((prev) => ({ ...prev, avatarImg: s3Url }));
          await apiUpdateUserProfile(currentUserId, { avatarUrl: s3Url });

          const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
          localStorage.setItem('fortaa_user', JSON.stringify({ ...stored, avatarUrl: s3Url }));
          toast.success('Profile picture updated to AWS S3 & database! 🚀');
        }
      } else {
        const chosen = avatarPresets.find((av) => av.id === selectedAvatarId);
        if (chosen) {
          setUserProfile((prev) => ({ ...prev, avatarImg: chosen.img }));
          setFormData((prev) => ({ ...prev, avatarImg: chosen.img }));
          await apiUpdateUserProfile(currentUserId, { avatarUrl: chosen.img });
          const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
          localStorage.setItem('fortaa_user', JSON.stringify({ ...stored, avatarUrl: chosen.img }));
          toast.success('Preset profile picture saved to database!');
        }
      }
      setIsPhotoModalOpen(false);
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleAddSkill = () => {
    const newSkill = prompt('Enter new skill:');
    if (newSkill && newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwordState.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    toast.success('Password updated successfully!');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setActiveEditMenu('Personal Information');
  };

  const editMenuItems = [
    { label: 'Personal Information', icon: '👤' },
    { label: 'Profile Photo', icon: '📷' },
    { label: 'Cover Photo', icon: '🖼️' },
    { label: 'About Me', icon: '💬' },
    { label: 'Contact Information', icon: '📇' },
    { label: 'Social Links', icon: '🔗' },
    { label: 'Privacy Setting', icon: '⚙️' },
  ];

  const handleEditMenuClick = (label) => {
    if (label === 'Profile Photo') {
      setIsPhotoModalOpen(true);
    } else if (label === 'Cover Photo') {
      setIsCoverModalOpen(true);
    } else {
      setActiveEditMenu(label);
    }
  };

  const tabs = ['All posts', 'Network', 'Followers', 'Groups', 'Following'];

  return (
    <div className="prof-page">
      {/* ───────────────── SHARED REUSABLE TOPBAR ───────────────── */}
      <UserHeader
        user={{
          name: userProfile.name,
          role: userProfile.userRole,
          avatarUrl: userProfile.avatarImg,
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onProfileClick={() => setIsEditing(false)}
        onMessagesClick={() => navigate('/messages')}
      />

      {/* ───────────────── MAIN WRAPPER ───────────────── */}
      <div className="prof-main-wrapper">
        {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PINNED) ── */}
        <UserSidebar
          activeTab={activeNav}
          onTabChange={(tab) => {
            setActiveNav(tab);
            if (tab === 'My Profile') setIsEditing(false);
            if (tab === 'Home') navigate('/dashboard');
            if (tab === 'Messages') navigate('/messages');
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="prof-content-scroll-container">
          {/* VIEW A: IN-PAGE EDIT PROFILE VIEW */}
          {isEditing ? (
            <div className="prof-edit-view">
              {/* Inner Left Menu: Edit Profile */}
              <aside className="prof-edit-sidebar">
                <h3 className="prof-edit-title">Edit Profile</h3>
                <nav className="prof-edit-menu-list">
                  {editMenuItems.map((menu) => (
                    <button
                      key={menu.label}
                      type="button"
                      className={`prof-edit-menu-btn ${activeEditMenu === menu.label ? 'active' : ''}`}
                      onClick={() => handleEditMenuClick(menu.label)}
                    >
                      <span className="prof-edit-menu-icon">{menu.icon}</span>
                      <span>{menu.label}</span>
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Inner Right Form: Dynamic according to activeEditMenu */}
              <main className="prof-edit-form-card">
                {/* 1. PERSONAL INFORMATION (Screenshot 1) */}
                {activeEditMenu === 'Personal Information' && (
                  <>
                    <h2 className="prof-edit-heading">Personal Details</h2>
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Full Name<span className="prof-edit-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          User Name<span className="prof-edit-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Date of Birth</label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          placeholder="15-06-1990"
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Gender</label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          placeholder="Male"
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Location</label>
                        <div className="prof-edit-input-with-icon">
                          <span className="prof-edit-input-icon">📍</span>
                          <input
                            type="text"
                            className="prof-edit-input"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Skills</label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          placeholder="e.g. Graphic Designer"
                          value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Work Experience</label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          placeholder="e.g. 6month.."
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Bio</label>
                        <textarea
                          className="prof-edit-textarea"
                          maxLength={200}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                        <span className="prof-edit-char-count">{formData.bio.length}/200</span>
                      </div>

                      <div className="prof-edit-actions">
                        <button
                          type="button"
                          className="prof-btn-cancel"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancle
                        </button>
                        <button type="submit" className="prof-btn-save">
                          Save Change
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* 2. CONTACT INFORMATION (Screenshot 3 - media_1793070146611_5763fa5f.png) */}
                {activeEditMenu === 'Contact Information' && (
                  <>
                    <h2 className="prof-edit-heading">Contact Information</h2>
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Email Address */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Email Address<span className="prof-edit-star">*</span>
                        </label>
                        <div className="prof-edit-input-with-icon">
                          <span className="prof-edit-input-icon">✉️</span>
                          <input
                            type="email"
                            className="prof-edit-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Mobile Number<span className="prof-edit-star">*</span>
                        </label>
                        <div className="prof-phone-input-row">
                          <div className="prof-phone-code-box">
                            <span>📞</span>
                            <span>+91</span>
                            <span>▾</span>
                          </div>
                          <input
                            type="tel"
                            className="prof-phone-input-field"
                            placeholder="Enter your mobile numberr"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Alternate Mobile Number */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Alternate Mobile Number<span className="prof-edit-star">*</span>
                        </label>
                        <div className="prof-phone-input-row">
                          <div className="prof-phone-code-box">
                            <span>📞</span>
                            <span>+91</span>
                            <span>▾</span>
                          </div>
                          <input
                            type="tel"
                            className="prof-phone-input-field"
                            placeholder="Enter your mobile numberr"
                            value={formData.altMobile}
                            onChange={(e) => setFormData({ ...formData, altMobile: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* WhatsApp Number */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          WhatsApp Number <span className="prof-edit-star">*</span>
                        </label>
                        <div className="prof-phone-input-row">
                          <div className="prof-phone-code-box">
                            <span>📞</span>
                            <span>+91</span>
                            <span>▾</span>
                          </div>
                          <input
                            type="tel"
                            className="prof-phone-input-field"
                            placeholder="Enter your mobile numberr"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Location</label>
                        <div className="prof-edit-input-with-icon">
                          <span className="prof-edit-input-icon">📍</span>
                          <input
                            type="text"
                            className="prof-edit-input"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="New Delhi, India"
                          />
                        </div>
                      </div>

                      {/* Website Link */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Website Link</label>
                        <input
                          type="text"
                          className="prof-edit-input"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="your website link"
                        />
                      </div>

                      <div className="prof-edit-actions">
                        <button
                          type="button"
                          className="prof-btn-cancel"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancle
                        </button>
                        <button type="submit" className="prof-btn-save">
                          Save Change
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* 3. ABOUT ME (Screenshot 4 - media_1793070167234_e54f51c5.png) */}
                {activeEditMenu === 'About Me' && (
                  <>
                    <div className="prof-edit-heading-row">
                      <button
                        type="button"
                        className="prof-edit-back-arrow"
                        onClick={() => setActiveEditMenu('Personal Information')}
                      >
                        ‹
                      </button>
                      <h2 className="prof-edit-heading">About Me</h2>
                    </div>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Bio */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Bio</label>
                        <textarea
                          className="prof-edit-textarea"
                          maxLength={200}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                        <span className="prof-edit-char-count">{formData.bio.length}/200</span>
                      </div>

                      {/* Skills Removable Tags */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Skills</label>
                        <div className="prof-tags-edit-box">
                          {Array.isArray(formData.skills) && formData.skills.map((skill, idx) => (
                            <span key={idx} className="prof-tag-removable">
                              <span>{skill}</span>
                              <button
                                type="button"
                                className="prof-tag-close-btn"
                                onClick={() => handleRemoveSkill(skill)}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            className="prof-btn-add-skill"
                            onClick={handleAddSkill}
                          >
                            + Add Skill
                          </button>
                        </div>
                      </div>

                      {/* My Achievements */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">My Achievements</label>
                        <div className="prof-tags-edit-box">
                          {userProfile.achievements.map((ach, idx) => (
                            <span key={idx} className="prof-tag-removable" style={{ background: '#F1F5F9', color: '#475569' }}>
                              <span>{ach}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Social Media Link */}
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Social Media Link</label>
                        <div className="prof-social-inputs-box">
                          {/* LinkedIn */}
                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-linkedin">in</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.linkedin}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, linkedin: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Instagram */}
                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-instagram">📷</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.instagram}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, instagram: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Twitter */}
                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-twitter">🐦</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.twitter}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, twitter: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="prof-edit-actions">
                        <button
                          type="button"
                          className="prof-btn-cancel"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancle
                        </button>
                        <button type="submit" className="prof-btn-save">
                          Save Change
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* 4. SOCIAL LINKS (Dedicated View) */}
                {activeEditMenu === 'Social Links' && (
                  <>
                    <h2 className="prof-edit-heading">Social Links</h2>
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">Social Media Profiles</label>
                        <div className="prof-social-inputs-box">
                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-linkedin">in</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.linkedin}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, linkedin: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>

                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-instagram">📷</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.instagram}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, instagram: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>

                          <div className="prof-social-row">
                            <span className="prof-social-badge badge-twitter">🐦</span>
                            <input
                              type="text"
                              className="prof-social-input"
                              value={formData.socialLinks.twitter}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                              })}
                            />
                            <button
                              type="button"
                              className="prof-social-clear-btn"
                              onClick={() => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, twitter: '' }
                              })}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="prof-edit-actions">
                        <button
                          type="button"
                          className="prof-btn-cancel"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancle
                        </button>
                        <button type="submit" className="prof-btn-save">
                          Save Change
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* 5. PRIVACY SETTING / CHANGE PASSWORD (Screenshot 5 - media_1793070273616_070d3e5e.png) */}
                {activeEditMenu === 'Privacy Setting' && (
                  <>
                    <div className="prof-edit-heading-row">
                      <button
                        type="button"
                        className="prof-edit-back-arrow"
                        onClick={() => setActiveEditMenu('Personal Information')}
                      >
                        ‹
                      </button>
                      <h2 className="prof-edit-heading">Change Password</h2>
                    </div>

                    <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Change Password <span className="prof-edit-star">*</span>
                        </label>
                        <input
                          type="password"
                          className="prof-edit-input"
                          placeholder="••••••••••"
                          value={passwordState.currentPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          New Password <span className="prof-edit-star">*</span>
                        </label>
                        <input
                          type="password"
                          className="prof-edit-input"
                          placeholder="••••••••••"
                          value={passwordState.newPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                          required
                        />
                        <div className="prof-pw-strength-row">
                          <div className="prof-pw-bar-track">
                            <div className="prof-pw-bar-fill" style={{ width: '70%' }} />
                          </div>
                          <span className="prof-pw-strength-label">Strong</span>
                        </div>
                      </div>

                      <div className="prof-edit-group">
                        <label className="prof-edit-label">
                          Confirm New Password <span className="prof-edit-star">*</span>
                        </label>
                        <input
                          type="password"
                          className="prof-edit-input"
                          placeholder="••••••••••"
                          value={passwordState.confirmPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                        <button type="submit" className="prof-btn-update-pw">
                          Update Password
                        </button>
                        <button
                          type="button"
                          className="prof-btn-cancel"
                          style={{ width: '100%' }}
                          onClick={() => setIsEditing(false)}
                        >
                          Cancle
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </main>
            </div>
          ) : (
            /* VIEW B: NORMAL PROFILE OVERVIEW */
            <>
              {/* 1. Cover Banner & Profile Card */}
              <div className="prof-banner-card">
                <div
                  className="prof-cover-wrap"
                  style={{ backgroundImage: `url(${userProfile.coverImg})` }}
                >
                  <button
                    className="prof-btn-edit-profile"
                    onClick={handleOpenEdit}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit Profile</span>
                  </button>

                  <div className="prof-user-header-content">
                    <div className="prof-avatar-wrap">
                      <img src={userProfile.avatarImg} alt={userProfile.name} className="prof-avatar-img" />
                      <span className="prof-avatar-verified" title="Verified Member">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    </div>
                    <div className="prof-user-details">
                      <h1 className="prof-user-name">{userProfile.name}</h1>
                      <div className="prof-combined-badge">
                        <span className="prof-badge-gem">💎</span>
                        <span>{userProfile.company}</span>
                        <span className="prof-badge-pipe">|</span>
                        <span className="prof-badge-secondary">{userProfile.userRole}</span>
                      </div>
                      <p className="prof-username-text">User Name: {formatAtUsername(userProfile.username)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 4 Stats Cards Row */}
              <div className="prof-stats-grid">
                <div
                  className="prof-stat-card prof-stat-card--network"
                  onClick={() => setActiveTab('Network')}
                  title="View Network"
                  role="button"
                  tabIndex={0}
                >
                  <div className="prof-stat-icon-wrap">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="prof-stat-info">
                    <span className="prof-stat-number">{socialCounts.networkCount}</span>
                    <span className="prof-stat-label">Network</span>
                  </div>
                </div>

                <div
                  className="prof-stat-card prof-stat-card--followers"
                  onClick={() => setActiveTab('Followers')}
                  title="View Followers"
                  role="button"
                  tabIndex={0}
                >
                  <div className="prof-stat-icon-wrap">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20v2a10 10 0 0 0 0-20z"></path>
                      <circle cx="12" cy="5" r="1.5" fill="#16A34A"></circle>
                      <circle cx="5" cy="16" r="1.5" fill="#16A34A"></circle>
                      <circle cx="19" cy="16" r="1.5" fill="#16A34A"></circle>
                    </svg>
                  </div>
                  <div className="prof-stat-info">
                    <span className="prof-stat-number">{socialCounts.followersCount}</span>
                    <span className="prof-stat-label">Followers</span>
                  </div>
                </div>

                <div
                  className="prof-stat-card prof-stat-card--following"
                  onClick={() => setActiveTab('Following')}
                  title="View Following"
                  role="button"
                  tabIndex={0}
                >
                  <div className="prof-stat-icon-wrap">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <div className="prof-stat-info">
                    <span className="prof-stat-number">{socialCounts.followingCount}</span>
                    <span className="prof-stat-label">Following</span>
                  </div>
                </div>

                <div
                  className="prof-stat-card prof-stat-card--post"
                  onClick={() => setActiveTab('All posts')}
                  title="View All Posts"
                  role="button"
                  tabIndex={0}
                >
                  <div className="prof-stat-icon-wrap">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="9" r="2"></circle>
                      <path d="M9 13a3 3 0 0 1 6 0"></path>
                    </svg>
                  </div>
                  <div className="prof-stat-info">
                    <span className="prof-stat-number">{socialCounts.postsCount}</span>
                    <span className="prof-stat-label">Post</span>
                  </div>
                </div>
              </div>

              {/* 3. About Me Card */}
              <div className="prof-about-card">
                <h3 className="prof-section-heading">About Me</h3>
                <p className="prof-about-desc">
                  {userProfile.bio}
                </p>

                <div className="prof-meta-contact-row">
                  <div className="prof-meta-item">
                    <span>📍</span>
                    <span>{userProfile.location}</span>
                  </div>
                  <div className="prof-meta-item">
                    <span>✉️</span>
                    <span>{userProfile.email}</span>
                  </div>
                </div>

                <div className="prof-tags-block">
                  <span className="prof-tags-label">Skills</span>
                  <div className="prof-pills-row">
                    {Array.isArray(userProfile.skills) ? (
                      userProfile.skills.map((skill, idx) => (
                        <span key={idx} className="prof-pill-tag">
                          <span className="prof-pill-dot" /> {skill}
                        </span>
                      ))
                    ) : (
                      <span className="prof-pill-tag">
                        <span className="prof-pill-dot" /> {userProfile.skills}
                      </span>
                    )}
                  </div>
                </div>

                <div className="prof-tags-block">
                  <span className="prof-tags-label">My Achievements</span>
                  <div className="prof-pills-row">
                    {userProfile.achievements.map((ach, idx) => (
                      <span key={idx} className="prof-pill-tag">
                        <span className="prof-pill-dot" /> {ach}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Tabs Bar */}
              <div className="prof-tabs-bar">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`prof-tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 5. Dynamic Tab Content according to activeTab */}
              <div className="prof-feed-list">
                {/* ── TAB 1: ALL POSTS (My Posts from Database) ── */}
                {activeTab === 'All posts' && (
                  <>
                    {myPosts.length > 0 ? (
                      myPosts.map((post, pIdx) => (
                        <div key={post.id || pIdx} className="prof-post-card">
                          <div className="prof-post-header">
                            <div className="prof-post-author-row">
                              <img
                                src={post.author_avatar || userProfile.avatarImg || userAvatarImg}
                                alt={post.author_name || userProfile.name}
                                className="prof-post-avatar"
                              />
                              <div className="prof-post-meta">
                                <span className="prof-post-author-name">{post.author_name || userProfile.name}</span>
                                <div className="prof-post-headline">
                                  {post.author_role || userProfile.userRole || 'Senior Leader • Fortaa'}
                                </div>
                                <div className="prof-post-time-row">
                                  <span className="prof-post-time">
                                    {formatRelativeTime(post.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 3-dots Menu for Edit & Delete */}
                            <div className="prof-post-menu-wrap" style={{ position: 'relative' }}>
                              <button
                                type="button"
                                className="prof-btn-menu-dots"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePostMenuId((prev) => (prev === post.id ? null : post.id));
                                }}
                                title="Post options"
                              >
                                ⋮
                              </button>

                              {activePostMenuId === post.id && (
                                <div className="prof-post-menu-dropdown" ref={postMenuRef}>
                                  <button
                                    type="button"
                                    className="prof-post-menu-item"
                                    onClick={() => handleStartEdit(post)}
                                  >
                                    <FiEdit3 className="prof-post-menu-icon" />
                                    <span>Edit Post</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="prof-post-menu-item prof-post-menu-delete"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    <FiTrash2 className="prof-post-menu-icon" />
                                    <span>Delete Post</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="prof-post-body">
                            <p className="prof-post-caption">{renderFormattedContent(post.content)}</p>
                            {post.tags && <p className="prof-post-tags">{post.tags}</p>}

                            {/* Interactive Poll Display (Fix for missing poll) */}
                            {post.poll_data && (
                              <PostPoll
                                pollData={post.poll_data}
                                postId={post.id}
                                onVote={(optionId) => handleVotePoll(post.id, optionId)}
                                currentUserId={currentUserId}
                              />
                            )}

                            {(() => {
                              const isVideo = post.media_type === 'video' || post.video_url || (post.image_url && /\.(mp4|webm|mov|mkv|avi)(\?.*)?$/i.test(post.image_url));
                              const mediaSrc = post.video_url || post.image_url;
                              if (!mediaSrc) return null;

                              if (isVideo) {
                                return (
                                  <div className="prof-post-media-box" style={{ background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                                    <video
                                      src={mediaSrc}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="prof-post-img"
                                      style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#000', display: 'block' }}
                                    />
                                  </div>
                                );
                              }

                              return (
                                <div className="prof-post-media-box">
                                  <img
                                    src={mediaSrc}
                                    alt="Post media"
                                    className="prof-post-img"
                                  />
                                </div>
                              );
                            })()}
                          </div>

                          {/* Instagram-style Reactions Row */}
                          <div className="prof-post-reactions-row">
                            {renderInstagramLikes(post, userProfile, (pid) => setLikesModalPostId(pid))}
                            <div
                              className="prof-comments-shares"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                              title="View comments"
                            >
                              <span className="ud-metric-pill" title={`${post.comments_count || 0} comments`}>
                                <FaRegComment size={14} className="ud-metric-icon" />
                                <span>{post.comments_count || 0}</span>
                              </span>
                              <span className="ud-metric-dot">•</span>
                              <span className="ud-metric-pill" title={`${post.shares_count || 0} shares`}>
                                <RiShareForwardLine size={15} className="ud-metric-icon" />
                                <span>{post.shares_count || 0}</span>
                              </span>
                            </div>
                          </div>

                          {/* LinkedIn / Dashboard Interactive Bar */}
                          <div className="prof-post-actions-row">
                            <button
                              type="button"
                              className={`ud-interact-btn ud-btn-like ${post.has_liked ? 'liked-active' : ''}`}
                              onClick={() => handleLike(post.id)}
                            >
                              <span className="ud-interact-icon-wrap">
                                {post.has_liked ? (
                                  <FaThumbsUp size={16} className="ud-like-icon" />
                                ) : (
                                  <FaRegThumbsUp size={16} className="ud-like-icon" />
                                )}
                              </span>
                              <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                            </button>
                            <button
                              type="button"
                              className={`ud-interact-btn ud-btn-comment ${openCommentsPostId === post.id ? 'active' : ''}`}
                              onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                            >
                              <span className="ud-interact-icon-wrap">
                                <FaRegComment size={16} className="ud-comment-icon" />
                              </span>
                              <span>Comment</span>
                            </button>
                            <button
                              type="button"
                              className="ud-interact-btn ud-btn-share"
                              onClick={() => setShareModalPost(post)}
                            >
                              <span className="ud-interact-icon-wrap">
                                <RiShareForwardLine size={18} className="ud-share-icon" />
                              </span>
                              <span>Share</span>
                            </button>
                          </div>

                          {/* Interactive Comments Drawer */}
                          {openCommentsPostId === post.id && (
                            <PostComments
                              postId={post.id}
                              currentUser={storedUser}
                              initialCount={post.comments_count || 0}
                              onCommentAdded={(newCount) => {
                                setMyPosts((prev) =>
                                  prev.map((p) => (p.id === post.id ? { ...p, comments_count: newCount } : p))
                                );
                              }}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="prof-post-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '42px', marginBottom: '12px' }}>✍️</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1735', marginBottom: '8px' }}>
                          No posts published yet
                        </h4>
                        <p style={{ color: '#8E8A9F', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
                          Share your business milestones, team achievements, or opportunities with your network.
                        </p>
                        <button
                          type="button"
                          className="prof-btn-purple-sm"
                          style={{ margin: '0 auto' }}
                          onClick={() => navigate('/dashboard')}
                        >
                          Create a Post on Dashboard →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── TAB 2: NETWORK (Team / Downline) ── */}
                {activeTab === 'Network' && (
                  <div className="prof-post-card prof-tab-content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <h4 className="prof-tab-content-title" style={{ marginBottom: 0 }}>
                        My Network Team ({socialCounts.networkCount})
                      </h4>
                      <span style={{ fontSize: '13px', color: '#5A2CE4', fontWeight: '600' }}>Active Downline</span>
                    </div>

                    {networkTeamList.length > 0 ? (
                      <div className="prof-following-list">
                        {networkTeamList.map((member, mIdx) => (
                          <div key={member.id || mIdx} className="prof-following-card prof-follower-card">
                            <div className="prof-following-user-row">
                              <img
                                src={member.avatar_url || userAvatarImg}
                                alt={member.name}
                                className="prof-following-avatar"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = userAvatarImg;
                                }}
                              />
                              <div className="prof-following-info">
                                <div className="prof-following-name">{member.name}</div>
                                <div className="prof-following-role">
                                  {member.designation || 'Leader'} • ID: {member.member_id || member.id} • {member.company_brand || 'Fortaa'}
                                </div>
                              </div>
                            </div>
                            <div className="prof-following-actions">
                              <button
                                type="button"
                                className="prof-btn-purple-sm prof-btn-action-single"
                                onClick={() => navigate(`/leader/${member.id}`)}
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 14px', color: '#8E8A9F' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                        <p style={{ fontWeight: '700', fontSize: '15px', color: '#1F1735', marginBottom: '6px' }}>
                          No Network Team Members Yet
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '400px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                          When other members register using your Referral Member ID (<b>{userProfile.memberId || storedUser.memberId || 'Fortaa'}</b>), your active downline team will appear here.
                        </p>
                        <button
                          type="button"
                          className="prof-btn-purple-sm"
                          style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => {
                            const code = userProfile.memberId || storedUser.memberId;
                            if (code) {
                              navigator.clipboard?.writeText(code);
                              toast.success(`Referral Member ID (${code}) copied to clipboard!`);
                            } else {
                              toast('Share your profile URL with prospective team members');
                            }
                          }}
                        >
                          Copy Referral Member ID 📋
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: FOLLOWERS (Real Database Followers) ── */}
                {activeTab === 'Followers' && (
                  <div className="prof-post-card prof-tab-content-card">
                    <h4 className="prof-tab-content-title">
                      Followers ({followersList.length})
                    </h4>

                    {followersList.length > 0 ? (
                      <div className="prof-following-list">
                        {followersList.map((follower) => (
                          <div key={follower.id} className="prof-following-card prof-follower-card">
                            <div
                              className="prof-following-user-row"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleViewFollowerProfile(follower)}
                              title={`View ${follower.name}'s Profile`}
                            >
                              <img
                                src={follower.avatar_url || userAvatarImg}
                                alt={follower.name}
                                className="prof-following-avatar"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = userAvatarImg;
                                }}
                              />
                              <div className="prof-following-info">
                                <div className="prof-following-name" title={follower.name}>
                                  {follower.name}
                                </div>
                                <div className="prof-following-role">
                                  {follower.designation || 'Leader'} • {follower.company_brand || 'Fortaa'}
                                </div>
                              </div>
                            </div>
                            <div className="prof-following-actions">
                              <button
                                type="button"
                                className="prof-btn-purple-sm prof-btn-action-single"
                                onClick={() => handleViewFollowerProfile(follower)}
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8E8A9F' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                        <p style={{ fontWeight: '600', color: '#1F1735' }}>No followers yet</p>
                        <p style={{ fontSize: '13px' }}>
                          When other leaders follow your profile, they will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 4: FOLLOWING (Real Database Following with Unfollow) ── */}
                {activeTab === 'Following' && (
                  <div className="prof-post-card prof-tab-content-card">
                    <h4 className="prof-tab-content-title">
                      Following ({followingList.length})
                    </h4>

                    {followingList.length > 0 ? (
                      <div className="prof-following-list">
                        {followingList.map((user) => {
                          const isPending = user.follow_status === 'pending';
                          return (
                            <div key={user.id} className="prof-following-card">
                              <div
                                className="prof-following-user-row"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleViewFollowerProfile(user)}
                                title={`View ${user.name}'s Profile`}
                              >
                                <img
                                  src={user.avatar_url || userAvatarImg}
                                  alt={user.name}
                                  className="prof-following-avatar"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = userAvatarImg;
                                  }}
                                />
                                <div className="prof-following-info">
                                  <div className="prof-following-name" title={user.name}>
                                    {user.name}
                                  </div>
                                  <div className="prof-following-role">
                                    {user.designation || 'Business Leader'}
                                  </div>
                                </div>
                              </div>
                              <div className="prof-following-actions">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/messages?userId=${user.id}`)}
                                  className="prof-btn-action prof-btn-msg"
                                >
                                  Message
                                </button>
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelRequestFromProfile(user.id, user.name)}
                                    title="Click to cancel request"
                                    className="prof-btn-action prof-btn-pending"
                                  >
                                    Pending
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUnfollowFromProfile(user.id, user.name)}
                                    title="Click to unfollow"
                                    className="prof-btn-action prof-btn-following"
                                  >
                                    Following
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8E8A9F' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
                        <p style={{ fontWeight: '600', color: '#1F1735' }}>You are not following anyone yet</p>
                        <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                          Follow top leaders and trainers on the dashboard to see their posts in your feed!
                        </p>
                        <button
                          type="button"
                          className="prof-btn-purple-sm"
                          style={{ margin: '0 auto' }}
                          onClick={() => navigate('/dashboard')}
                        >
                          Discover Leaders →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 5: GROUPS (Real Database Created & Joined Groups - Left / Right Split Layout) ── */}
                {activeTab === 'Groups' && (
                  <div className="prof-groups-split-container">
                    {/* LEFT COLUMN: Groups Created by this User */}
                    <div className="prof-post-card prof-groups-split-card">
                      <div className="prof-groups-split-header">
                        <div className="prof-groups-title-wrap">
                          <FiFolderPlus className="prof-groups-title-icon" />
                          <h4 className="prof-tab-content-title" style={{ margin: 0 }}>
                            Created Groups ({createdGroups.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="prof-btn-purple-sm"
                          onClick={() => navigate('/groups')}
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          + Create Group
                        </button>
                      </div>

                      {createdGroups.length > 0 ? (
                        <div className="prof-following-list">
                          {createdGroups.map((grp) => (
                            <div key={grp.id} className="prof-following-card prof-follower-card">
                              <div
                                className="prof-following-user-row"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/messages?groupId=${grp.id}`)}
                                title={`Open ${grp.name}`}
                              >
                                {grp.icon_url ? (
                                  <img
                                    src={grp.icon_url}
                                    alt={grp.name}
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      background: '#EDE9FE',
                                      color: '#7C3AED',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <FiFolderPlus />
                                  </div>
                                )}
                                <div className="prof-following-info">
                                  <div className="prof-following-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{grp.name}</span>
                                    <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                      Admin
                                    </span>
                                  </div>
                                  <div className="prof-following-role">
                                    {grp.actual_members_count || 1} members • {grp.category || 'General'}
                                  </div>
                                </div>
                              </div>
                              <div className="prof-following-actions">
                                <button
                                  type="button"
                                  className="prof-btn-purple-sm prof-btn-action-single"
                                  onClick={() => navigate(`/messages?groupId=${grp.id}`)}
                                >
                                  Open Group
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="prof-groups-empty-box">
                          <FiFolderPlus className="prof-groups-empty-icon" />
                          <p className="prof-groups-empty-title">No created groups yet</p>
                          <p className="prof-groups-empty-sub">Groups you create will appear here.</p>
                          <button
                            type="button"
                            className="prof-btn-purple-sm"
                            onClick={() => navigate('/groups')}
                            style={{ padding: '6px 14px', fontSize: '12.5px' }}
                          >
                            + Create a Group
                          </button>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Groups Joined by User */}
                    <div className="prof-post-card prof-groups-split-card">
                      <div className="prof-groups-split-header">
                        <div className="prof-groups-title-wrap">
                          <FiUsers className="prof-groups-title-icon" />
                          <h4 className="prof-tab-content-title" style={{ margin: 0 }}>
                            Joined Groups ({joinedGroups.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="prof-btn-outline-sm"
                          onClick={() => navigate('/groups')}
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          Explore Groups →
                        </button>
                      </div>

                      {joinedGroups.length > 0 ? (
                        <div className="prof-following-list">
                          {joinedGroups.map((grp) => (
                            <div key={grp.id} className="prof-following-card prof-follower-card">
                              <div
                                className="prof-following-user-row"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/messages?groupId=${grp.id}`)}
                                title={`Open ${grp.name}`}
                              >
                                {grp.icon_url ? (
                                  <img
                                    src={grp.icon_url}
                                    alt={grp.name}
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      background: '#EDE9FE',
                                      color: '#7C3AED',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <FiUsers />
                                  </div>
                                )}
                                <div className="prof-following-info">
                                  <div className="prof-following-name">{grp.name}</div>
                                  <div className="prof-following-role">
                                    {grp.actual_members_count || 1} members • {grp.category || 'General'}
                                  </div>
                                </div>
                              </div>
                              <div className="prof-following-actions">
                                <button
                                  type="button"
                                  className="prof-btn-purple-sm prof-btn-action-single"
                                  onClick={() => navigate(`/messages?groupId=${grp.id}`)}
                                >
                                  Open Group
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="prof-groups-empty-box">
                          <FiCompass className="prof-groups-empty-icon" />
                          <p className="prof-groups-empty-title">No joined groups yet</p>
                          <p className="prof-groups-empty-sub">Explore the community and join groups that interest you.</p>
                          <button
                            type="button"
                            className="prof-btn-purple-sm"
                            onClick={() => navigate('/groups')}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                          >
                            Explore Groups
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ───────────────── CHANGE PROFILE PHOTO MODAL (Screenshot 1 - media_1793070118107_296fb141.png) ───────────────── */}
      {isPhotoModalOpen && (
        <div className="prof-submodal-backdrop" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="prof-photo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="prof-modal-header">
              <h3 className="prof-modal-title">Change profile photo</h3>
              <button
                type="button"
                className="prof-modal-close-btn"
                onClick={() => setIsPhotoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Center Avatar Preview */}
            <div className="prof-modal-avatar-preview">
              <img
                src={profilePhotoPreview || userProfile.avatarImg}
                alt="Avatar Preview"
                className="prof-avatar-circle-big"
                style={{ objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => profilePhotoInputRef.current?.click()}
                title="Click to choose photo from PC / Mobile"
              />
              <input
                type="file"
                ref={profilePhotoInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePhotoSelect}
              />
              <button
                type="button"
                className="prof-btn-purple-sm"
                onClick={() => profilePhotoInputRef.current?.click()}
              >
                📁 Choose from PC / Mobile
              </button>
              <div>
                <p className="prof-submodal-subtitle">
                  {profilePhotoFile ? `Selected: ${profilePhotoFile.name}` : 'Update a New photo from device'}
                </p>
                <span className="prof-submodal-dim">Uploads directly to AWS S3 &amp; saves to database</span>
              </div>
            </div>

            {/* Choose Photo Presets */}
            <h4 className="prof-choose-label">Choose Preset</h4>
            <div className="prof-avatar-options-row">
              {avatarPresets.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  className={`prof-avatar-choice-btn ${!profilePhotoFile && selectedAvatarId === av.id ? 'selected' : ''}`}
                  onClick={() => {
                    setProfilePhotoFile(null);
                    setProfilePhotoPreview(null);
                    setSelectedAvatarId(av.id);
                  }}
                  title={av.label}
                >
                  <img src={av.img} alt={av.label} className="prof-avatar-choice-img" />
                </button>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="prof-edit-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="prof-btn-cancel"
                onClick={() => {
                  setProfilePhotoFile(null);
                  setProfilePhotoPreview(null);
                  setIsPhotoModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="prof-btn-save"
                onClick={handleSaveProfilePhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading to S3...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── CHANGE COVER PHOTO MODAL (Screenshot 2 - media_1793070134862_dec6b46f.png) ───────────────── */}
      {isCoverModalOpen && (
        <div className="prof-submodal-backdrop" onClick={() => setIsCoverModalOpen(false)}>
          <div className="prof-cover-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="prof-modal-header">
              <h3 className="prof-modal-title">Change Cover photo</h3>
              <button
                type="button"
                className="prof-modal-close-btn"
                onClick={() => setIsCoverModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Cover Banner Preview */}
            <div className="prof-cover-preview-box">
              <img
                src={coverPresets.find(c => c.id === selectedCoverId)?.img || profileCoverPurple}
                alt="Cover Preview"
                className="prof-cover-preview-img"
              />
            </div>

            <div className="prof-cover-action-btns">
              <button
                type="button"
                className="prof-btn-purple-sm"
                onClick={() => toast.success('Select from thumbnails below or upload file!')}
              >
                Change Profile
              </button>
              <button
                type="button"
                className="prof-btn-white-sm"
                onClick={() => setSelectedCoverId(1)}
              >
                Discard
              </button>
            </div>

            {/* Choose Photo Presets */}
            <h4 className="prof-choose-label">Choose Photo</h4>
            <div className="prof-cover-thumbs-grid">
              {coverPresets.map((cov) => (
                <button
                  key={cov.id}
                  type="button"
                  className={`prof-cover-thumb-btn ${selectedCoverId === cov.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCoverId(cov.id)}
                >
                  <img src={cov.img} alt={`Preset ${cov.id}`} className="prof-cover-thumb-img" />
                </button>
              ))}
            </div>

            <p className="prof-recommended-size-text">
              Recommended size: 1024*1440, 344*800, .......
            </p>

            {/* Bottom Actions */}
            <div className="prof-edit-actions" style={{ marginTop: '4px' }}>
              <button
                type="button"
                className="prof-btn-cancel"
                onClick={() => setIsCoverModalOpen(false)}
              >
                Cancle
              </button>
              <button
                type="button"
                className="prof-btn-save"
                onClick={() => {
                  const chosen = coverPresets.find(c => c.id === selectedCoverId);
                  if (chosen) {
                    setUserProfile(prev => ({ ...prev, coverImg: chosen.img }));
                  }
                  toast.success('Cover photo updated!');
                  setIsCoverModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="prof-edit-modal-backdrop" onClick={() => setEditingPost(null)}>
          <div className="prof-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prof-edit-modal-header">
              <h3 className="prof-edit-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiEdit3 style={{ color: '#5A2CE4' }} /> Edit Post
              </h3>
              <button
                type="button"
                className="prof-edit-modal-close"
                onClick={() => setEditingPost(null)}
              >
                ✕
              </button>
            </div>

            <div className="prof-edit-modal-body">
              <label className="prof-edit-modal-label">Post Description / Content</label>
              <textarea
                rows={4}
                className="prof-edit-modal-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Share your thoughts, updates or milestones..."
              />

              <label className="prof-edit-modal-label" style={{ marginTop: '14px' }}>
                Tags
              </label>
              <input
                type="text"
                className="prof-edit-modal-input"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="#FortaaMarketing #Success #Leadership"
              />
            </div>

            <div className="prof-edit-modal-footer">
              <button
                type="button"
                className="prof-btn-modal-cancel"
                onClick={() => setEditingPost(null)}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="prof-btn-modal-save"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar ("Home Navbar") on Mobile */}
      <UserMobileBottomNav active="More" />

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(shareModalPost)}
        post={shareModalPost}
        currentUser={storedUser}
        onClose={() => setShareModalPost(null)}
        onShareSuccess={(newSharesCount) => {
          if (shareModalPost) {
            setMyPosts((prev) =>
              prev.map((p) =>
                p.id === shareModalPost.id ? { ...p, shares_count: newSharesCount } : p
              )
            );
          }
        }}
      />

      {/* Post Likers Modal */}
      <PostLikersModal
        isOpen={Boolean(likesModalPostId)}
        onClose={() => setLikesModalPostId(null)}
        postId={likesModalPostId}
        currentUserId={currentUserId}
        followingIds={followingList.map((u) => u.id)}
        onUserClick={(userId) => navigate(`/leader/${userId}`)}
      />
    </div>
  );
}
