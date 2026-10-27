import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProfilePage.css';

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('My Profile');
  const [activeTab, setActiveTab] = useState('All posts');
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditMenu, setActiveEditMenu] = useState('Personal Information');

  // Modals for Photo & Cover
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Stored user profile state
  const [userProfile, setUserProfile] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
    return {
      name: stored.name || 'Rahul Sharma',
      username: stored.username || 'rahulsharma',
      dob: stored.dob || '15-06-1990',
      gender: stored.gender || 'Male',
      location: stored.location || 'New Delhi, India',
      email: stored.email || 'rahulsharma@gmail.com',
      mobile: stored.mobile || '',
      altMobile: stored.altMobile || '',
      whatsapp: stored.whatsapp || '',
      website: stored.website || '',
      skills: stored.skills ? stored.skills.split(',').map(s => s.trim()) : [
        'Leadership',
        'Communication',
        'Team Building',
        'Marketing',
        'Sales',
        'Strategy',
      ],
      achievements: ['Top performer', 'Good Communicator'],
      socialLinks: {
        linkedin: 'https://www.linkedin.com/help/lms/answer/a426534/single-image-ads',
        instagram: 'https://www.linkedin.com/help/lms/answer/a426534/single-image-ads',
        twitter: 'https://www.linkedin.com/help/lms/answer/a426534/single-image-ads',
      },
      experience: stored.experience || '6month..',
      bio: stored.bio || 'I am a passionate and result -driven professional with a vision to create financial freedom and help others grow, proud to be part of Fortaa.',
      userRole: stored.role || 'Silver Leader',
      avatarImg: userAvatarImg,
      coverImg: profileCoverPurple,
    };
  });

  const [formData, setFormData] = useState({ ...userProfile });

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

  const handleOpenEdit = () => {
    setFormData({ ...userProfile });
    setActiveEditMenu('Personal Information');
    setIsEditing(true);
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    setUserProfile({ ...formData });
    const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
    localStorage.setItem('fortaa_user', JSON.stringify({
      ...stored,
      name: formData.name,
      username: formData.username,
      dob: formData.dob,
      gender: formData.gender,
      location: formData.location,
      email: formData.email,
      mobile: formData.mobile,
      altMobile: formData.altMobile,
      whatsapp: formData.whatsapp,
      website: formData.website,
      skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills,
      experience: formData.experience,
      bio: formData.bio,
    }));
    toast.success('Profile updated successfully!');
    setIsEditing(false);
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
    { label: 'Home', icon: '🏠', path: '/dashboard' },
    { label: 'My Profile', icon: '👤', path: '/profile' },
    { label: 'Services', icon: '⚡' },
    { label: 'My Team', icon: '👥' },
    { label: 'Following', icon: '🌐' },
    { label: 'Opportunities', icon: '🎯' },
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

  const handleNavClick = (item) => {
    setActiveNav(item.label);
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
      {/* ───────────────── TOP NAVBAR ───────────────── */}
      <header className="prof-topbar">
        <div className="prof-topbar-left">
          <div className="prof-brand-logo-card">
            <Link to="/" className="prof-brand-logo">
              <img src={logoIconImg} alt="Fortaa" className="prof-logo-icon" />
              <div className="prof-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="prof-logo-word" />
                <span className="prof-logo-tagline">Discover, easy and Grow</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="prof-search-wrapper">
          <span className="prof-search-icon">🔍</span>
          <input
            type="text"
            className="prof-search-input"
            placeholder="Search people, posts, companies, products, opportunities..."
          />
        </div>

        {/* Topbar Actions */}
        <div className="prof-topbar-right">
          <button
            className="prof-icon-circle-btn"
            title="WhatsApp"
            onClick={() => toast.success('WhatsApp connected!')}
          >
            <img src={whatsappIconImg} alt="WhatsApp" className="prof-wa-img-icon" />
          </button>
          <button
            className="prof-icon-circle-btn"
            title="Notifications"
            onClick={() => toast('No new notifications', { icon: '🔔' })}
          >
            <img src={bellIconImg} alt="Notifications" className="prof-header-action-icon" />
            <span className="prof-badge-count">4</span>
          </button>
          <button
            className="prof-icon-circle-btn"
            title="Messages"
            onClick={() => toast('No new messages', { icon: '✉️' })}
          >
            <img src={messageIconImg} alt="Messages" className="prof-header-action-icon" />
            <span className="prof-badge-count">3</span>
          </button>

          {/* User Profile Mini Capsule */}
          <div
            className="prof-user-pill"
            title="My Profile"
            onClick={() => setIsEditing(false)}
          >
            <img src={userProfile.avatarImg} alt="Profile" className="prof-user-pill-avatar" />
            <div className="prof-user-pill-info">
              <span className="prof-user-pill-name">{userProfile.name}</span>
              <span className="prof-user-pill-role">{userProfile.userRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────── MAIN WRAPPER ───────────────── */}
      <div className="prof-main-wrapper">
        {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PERMANENTLY PINNED) ── */}
        <aside className="prof-sidebar-left">
          <nav className="prof-nav-list">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`prof-nav-link ${activeNav === item.label ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <span className="prof-nav-icon">{item.icon}</span>
                <span className="prof-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Promo Card */}
          <div className="prof-sidebar-promo-card">
            <div className="prof-promo-img-wrap">
              <img src={sidebarMegaphoneImg} alt="Grow Together" className="prof-promo-megaphone" />
            </div>
            <p className="prof-promo-title">Grow Together</p>
            <span className="prof-promo-dim">104 × 62</span>
          </div>

          {/* Sidebar Bottom Brand */}
          <div className="prof-sidebar-bottom-brand">
            <img src={logoIconImg} alt="" className="prof-sbb-icon" />
            <span className="prof-sbb-name">FORTAA</span>
          </div>
        </aside>

        {/* ── SCROLLABLE RIGHT CONTENT CONTAINER ── */}
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
                        <span>Index Technology</span>
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
                    <span className="prof-stat-number">248</span>
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
                    <span className="prof-stat-number">112</span>
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
                    <span className="prof-stat-number">1,25,450</span>
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
                    <span className="prof-stat-number">85</span>
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

              {/* 5. Feed Posts List */}
              <div className="prof-feed-list">
                {/* Post 1 */}
                <div className="prof-post-card">
                  <div className="prof-post-header">
                    <div className="prof-post-author-row">
                      <img src={userAvatarImg} alt="Rahul Sharma" className="prof-post-avatar" />
                      <div className="prof-post-meta">
                        <span className="prof-post-author-name">
                          Rahul Sharma
                        </span>
                        <span className="prof-post-subline">
                          <span className="prof-post-badge-gold">Gold Leader</span>
                          <span>• 4hr ago • 🌐</span>
                        </span>
                      </div>
                    </div>
                    <button className="prof-btn-menu-dots">⋮</button>
                  </div>

                  <div className="prof-post-body">
                    <p className="prof-post-caption">Together we grow bigger!</p>
                    <p className="prof-post-tags">#FortaaMarketing #Teamwork #Success #Fortaa</p>
                    <div className="prof-post-media-box">
                      <img
                        src={postTogetherDreams}
                        alt="Together We Build Bigger Dreams"
                        className="prof-post-img"
                      />
                    </div>
                  </div>

                  <div className="prof-post-metrics-row">
                    <div className="prof-reactions-group">
                      <span className="prof-reaction-emojis">👍 💙 🧡</span>
                      <span>124</span>
                    </div>
                    <div>
                      <span>28 comments</span> &nbsp;•&nbsp; <span>12 shares</span>
                    </div>
                  </div>

                  <div className="prof-post-actions-row">
                    <button className="prof-action-btn">👍 Like</button>
                    <button className="prof-action-btn">💬 Comment</button>
                    <button className="prof-action-btn">↗️ Share</button>
                  </div>

                  {/* Comment preview */}
                  <div className="prof-comment-preview-box">
                    <img src={userAvatarImg} alt="Amit Verma" className="prof-comment-avatar" />
                    <div className="prof-comment-bubble">
                      <span className="prof-commenter-name">Amit Verma</span>
                      <span className="prof-commenter-text">Great sharing keep inspiring!</span>
                      <div className="prof-comment-subactions">
                        <span>Like</span>
                        <span>Reply</span>
                        <span>1h</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post 2 */}
                <div className="prof-post-card">
                  <div className="prof-post-header">
                    <div className="prof-post-author-row">
                      <img src={userAvatarImg} alt="Rahul Sharma" className="prof-post-avatar" />
                      <div className="prof-post-meta">
                        <span className="prof-post-author-name">
                          Rahul Sharma
                        </span>
                        <span className="prof-post-subline">
                          <span className="prof-post-badge-gold">Gold Leader</span>
                          <span>• 4hr ago • 🌐</span>
                        </span>
                      </div>
                    </div>
                    <button className="prof-btn-menu-dots">⋮</button>
                  </div>

                  <div className="prof-post-body">
                    <p className="prof-post-caption">Together we grow bigger!</p>
                    <p className="prof-post-tags">#FortaaMarketing #Teamwork #Success #Fortaa</p>
                    <div className="prof-post-media-box">
                      <img
                        src={postExcitedFortaa}
                        alt="Excited to join Fortaa!"
                        className="prof-post-img"
                      />
                    </div>
                  </div>

                  <div className="prof-post-metrics-row">
                    <div className="prof-reactions-group">
                      <span className="prof-reaction-emojis">👍 💙 🧡</span>
                      <span>124</span>
                    </div>
                    <div>
                      <span>28 comments</span> &nbsp;•&nbsp; <span>12 shares</span>
                    </div>
                  </div>

                  <div className="prof-post-actions-row">
                    <button className="prof-action-btn">👍 Like</button>
                    <button className="prof-action-btn">💬 Comment</button>
                    <button className="prof-action-btn">↗️ Share</button>
                  </div>

                  {/* Comment preview */}
                  <div className="prof-comment-preview-box">
                    <img src={userAvatarImg} alt="Amit Verma" className="prof-comment-avatar" />
                    <div className="prof-comment-bubble">
                      <span className="prof-commenter-name">Amit Verma</span>
                      <span className="prof-commenter-text">Great sharing keep inspiring!</span>
                      <div className="prof-comment-subactions">
                        <span>Like</span>
                        <span>Reply</span>
                        <span>1h</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                src={userProfile.avatarImg}
                alt="Avatar Preview"
                className="prof-avatar-circle-big"
              />
              <button
                type="button"
                className="prof-btn-purple-sm"
                onClick={() => toast.success('Choose a photo from presets or files below!')}
              >
                Change Profile
              </button>
              <div>
                <p className="prof-submodal-subtitle">Update a New photo</p>
                <span className="prof-submodal-dim">( abc, bfd, mbn,mvx)</span>
              </div>
            </div>

            {/* Choose Photo Presets */}
            <h4 className="prof-choose-label">Choose Photo</h4>
            <div className="prof-avatar-options-row">
              {avatarPresets.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  className={`prof-avatar-choice-btn ${selectedAvatarId === av.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatarId(av.id)}
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
                onClick={() => setIsPhotoModalOpen(false)}
              >
                Cancle
              </button>
              <button
                type="button"
                className="prof-btn-save"
                onClick={() => {
                  toast.success('Profile photo updated!');
                  setIsPhotoModalOpen(false);
                }}
              >
                Upload
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
    </div>
  );
}
