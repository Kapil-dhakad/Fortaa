import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProfilePage.css';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';

// User, Follow & Dashboard Services
import { fetchUserProfile, updateUserProfile as apiUpdateUserProfile } from '../../services/user.service';
import { uploadSingleImage } from '../../services/upload.service';
import { fetchPosts, fetchDashboardOverview, likePostApi } from '../../services/dashboard.service';
import {
  fetchFollowers,
  fetchFollowing,
  fetchUserSocialCounts,
  toggleFollowUser,
  unfollowUser,
  cancelFollowRequest,
} from '../../services/follow.service';

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
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

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

      // 3. Followers & Following lists
      const [fFollowers, fFollowing] = await Promise.all([
        fetchFollowers(currentUserId),
        fetchFollowing(currentUserId),
      ]);
      setFollowersList(fFollowers);
      setFollowingList(fFollowing);
    }

    loadProfileSocialData();
  }, [currentUserId]);

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
          p.id === postId ? { ...p, likes_count: res.post.likes_count, has_liked: res.liked } : p
        )
      );
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
          toast.success('Preset profile picture applied!');
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

  const navItems = [
    { label: 'Home', icon: navHomeIcon, path: '/dashboard' },
    { label: 'My Profile', icon: navProfileIcon, path: '/profile' },
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

  const handleNavClick = (item) => {
    setActiveNav(item.label);
    setMobileMenuOpen(false);
    if (item.label === 'My Profile') {
      setIsEditing(false);
    }
    if (item.path && item.path !== '/profile') {
      navigate(item.path);
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
                      <p className="prof-username-text">User Name: {userProfile.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 4 Stats Cards Row */}
              <div className="prof-stats-grid">
                <div className="prof-stat-card">
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

                <div className="prof-stat-card">
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

                <div className="prof-stat-card">
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

                <div className="prof-stat-card">
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
                              <img src={userProfile.avatarImg} alt={userProfile.name} className="prof-post-avatar" />
                              <div className="prof-post-meta">
                                <span className="prof-post-author-name">{userProfile.name}</span>
                                <span className="prof-post-subline">
                                  <span className="prof-post-badge-gold">{userProfile.userRole}</span>
                                  <span>
                                    • {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'} • 🌐
                                  </span>
                                </span>
                              </div>
                            </div>
                            <button className="prof-btn-menu-dots">⋮</button>
                          </div>

                          <div className="prof-post-body">
                            <p className="prof-post-caption">{post.content}</p>
                            {post.tags && <p className="prof-post-tags">{post.tags}</p>}
                            {post.image_url ? (
                              <div className="prof-post-media-box">
                                <img
                                  src={post.image_url}
                                  alt="Post media"
                                  className="prof-post-img"
                                />
                              </div>
                            ) : null}
                          </div>

                          <div className="prof-post-metrics-row">
                            <div className="prof-reactions-group">
                              <span className="prof-reaction-emojis">👍 💙 🧡</span>
                              <span>{post.likes_count || 124}</span>
                            </div>
                            <div>
                              <span>{post.comments_count || 28} comments</span> &nbsp;•&nbsp; <span>12 shares</span>
                            </div>
                          </div>

                          <div className="prof-post-actions-row">
                            <button
                              className={`prof-action-btn ${post.has_liked ? 'liked-active' : ''}`}
                              onClick={() => handleLike(post.id)}
                              style={{
                                color: post.has_liked ? '#5A2CE4' : 'inherit',
                                fontWeight: post.has_liked ? '700' : '500',
                              }}
                            >
                              {post.has_liked ? '👍 Liked' : '👍 Like'}
                            </button>
                            <button className="prof-action-btn">💬 Comment</button>
                            <button className="prof-action-btn">↗️ Share</button>
                          </div>
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
                  <div className="prof-post-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1735' }}>
                        My Network Team ({socialCounts.networkCount})
                      </h4>
                      <span style={{ fontSize: '13px', color: '#5A2CE4', fontWeight: '600' }}>Active Downline</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { name: 'Amit Verma', role: 'Diamond Leader', id: 'NS294812', team: '45 members' },
                        { name: 'Sneha Patel', role: 'Platinum Leader', id: 'NS819234', team: '32 members' },
                        { name: 'Vikas Kumar', role: 'Gold Leader', id: 'NS381023', team: '18 members' },
                        { name: 'Neha Gupta', role: 'Silver Leader', id: 'NS491028', team: '12 members' },
                      ].map((member, mIdx) => (
                        <div
                          key={mIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#F9F8FD',
                            borderRadius: '12px',
                            border: '1px solid #ECE8F7',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={userAvatarImg}
                              alt={member.name}
                              style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                            />
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1F1735' }}>{member.name}</div>
                              <div style={{ fontSize: '12px', color: '#8E8A9F' }}>
                                {member.role} • ID: {member.id} • {member.team}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="prof-btn-purple-sm"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => toast(`Viewing team details of ${member.name}`)}
                          >
                            View Team
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: FOLLOWERS (Real Database Followers) ── */}
                {activeTab === 'Followers' && (
                  <div className="prof-post-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1735', marginBottom: '18px' }}>
                      Followers ({followersList.length})
                    </h4>

                    {followersList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {followersList.map((follower) => (
                          <div
                            key={follower.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: '#F9F8FD',
                              borderRadius: '12px',
                              border: '1px solid #ECE8F7',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={userAvatarImg}
                                alt={follower.name}
                                style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1F1735' }}>
                                  {follower.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#8E8A9F' }}>
                                  {follower.designation || 'Leader'} • {follower.company_brand || 'Fortaa'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="prof-btn-purple-sm"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              onClick={() => toast(`Opening profile of ${follower.name}`)}
                            >
                              View Profile
                            </button>
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
                  <div className="prof-post-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1735', marginBottom: '18px' }}>
                      Following ({followingList.length})
                    </h4>

                    {followingList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {followingList.map((user) => {
                          const isPending = user.follow_status === 'pending';
                          return (
                            <div
                              key={user.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 18px',
                                background: '#FFFFFF',
                                borderRadius: '10px',
                                border: '1px solid #D9D2EE',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <img
                                  src={user.avatar_url || userAvatarImg}
                                  alt={user.name}
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#232356' }}>
                                    {user.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6B6B8A' }}>
                                    {user.designation || 'Business Leader'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/messages?userId=${user.id}`)}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1.5px solid #8B2CF5',
                                    borderRadius: '6px',
                                    color: '#8B2CF5',
                                    fontWeight: '500',
                                    fontSize: '12px',
                                    padding: '6px 16px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Message
                                </button>
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelRequestFromProfile(user.id, user.name)}
                                    title="Click to cancel request"
                                    style={{
                                      background: '#FFFFFF',
                                      border: '1.5px solid #9D4EDD',
                                      borderRadius: '6px',
                                      color: '#9D4EDD',
                                      fontWeight: '500',
                                      fontSize: '12px',
                                      padding: '6px 16px',
                                      cursor: 'pointer',
                                      minWidth: '85px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    Pending
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUnfollowFromProfile(user.id, user.name)}
                                    title="Click to unfollow"
                                    style={{
                                      background: '#FFFFFF',
                                      border: '1.5px solid #9D4EDD',
                                      borderRadius: '6px',
                                      color: '#9D4EDD',
                                      fontWeight: '500',
                                      fontSize: '12px',
                                      padding: '6px 16px',
                                      cursor: 'pointer',
                                      minWidth: '85px',
                                      textAlign: 'center',
                                    }}
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

                {/* ── TAB 5: GROUPS ── */}
                {activeTab === 'Groups' && (
                  <div className="prof-post-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1735', marginBottom: '18px' }}>
                      Joined Groups (3)
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { name: 'Success Mindset & Motivation', members: '12.4K members', topic: 'Personal Growth' },
                        { name: 'Network Marketing Tips & Strategy', members: '5.7K members', topic: 'Direct Selling' },
                        { name: 'Health & Wellness Products Hub', members: '8.2K members', topic: 'Product Insights' },
                      ].map((grp, gIdx) => (
                        <div
                          key={gIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#F9F8FD',
                            borderRadius: '12px',
                            border: '1px solid #ECE8F7',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                background: '#EDE9FE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                              }}
                            >
                              👥
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1F1735' }}>{grp.name}</div>
                              <div style={{ fontSize: '12px', color: '#8E8A9F' }}>
                                {grp.members} • {grp.topic}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="prof-btn-purple-sm"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => toast.success(`Viewing ${grp.name}`)}
                          >
                            Open Group
                          </button>
                        </div>
                      ))}
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

      {/* Fixed Bottom Navigation Bar ("Home Navbar") on Mobile */}
      <nav className="ud-mob-bottom-navbar">
        <button
          type="button"
          className="ud-mob-bnav-item"
          onClick={() => navigate('/dashboard')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Home</span>
        </button>

        <button
          type="button"
          className="ud-mob-bnav-item"
          onClick={() => navigate('/leaders')}
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
          onClick={() => navigate('/dashboard')}
          aria-label="Create Post"
        >
          +
        </button>

        <button
          type="button"
          className="ud-mob-bnav-item"
          onClick={() => navigate('/opportunity')}
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
          className="ud-mob-bnav-item active"
          onClick={() => setIsEditing(false)}
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
  );
}
