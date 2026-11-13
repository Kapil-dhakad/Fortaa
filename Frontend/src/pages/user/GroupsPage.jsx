import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCompass,
  FiUsers,
  FiSearch,
  FiPlus,
  FiShare2,
  FiMessageCircle,
  FiCheck,
  FiX,
  FiLink,
  FiZap,
  FiAward,
  FiTrendingUp,
  FiHeart,
  FiTarget,
  FiGrid,
  FiPlusCircle,
  FiUserPlus,
  FiArrowRight,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import AuthGateModal from '../../components/auth/AuthGateModal';
import { fetchGroups, joinGroup, leaveGroup, createGroup } from '../../services/group.service';
import './GroupsPage.css';

const CATEGORIES = ['All', 'Leadership', 'Direct Selling', 'Motivation', 'Wellness', 'Marketing'];

const CATEGORY_META = {
  All: { icon: FiGrid, label: 'All' },
  Leadership: { icon: FiAward, label: 'Leadership' },
  'Direct Selling': { icon: FiTrendingUp, label: 'Direct Selling' },
  Motivation: { icon: FiZap, label: 'Motivation' },
  Wellness: { icon: FiHeart, label: 'Wellness' },
  Marketing: { icon: FiTarget, label: 'Marketing' },
  General: { icon: FiCompass, label: 'General' },
};

const getCategoryIcon = (cat) => {
  const meta = CATEGORY_META[cat] || CATEGORY_META['General'];
  const IconComp = meta.icon;
  return <IconComp className="grp-cat-icon" />;
};

const CATEGORY_GRADIENTS = {
  Leadership: 'linear-gradient(135deg, #6B11FF 0%, #B845ED 100%)',
  'Direct Selling': 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)',
  Motivation: 'linear-gradient(135deg, #F39C12 0%, #F1C40F 100%)',
  Wellness: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
  Marketing: 'linear-gradient(135deg, #5A2CE4 0%, #9E04C3 100%)',
  General: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-groups'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Leadership');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Instagram-style Invite / Share Modal State
  const [inviteModalGroup, setInviteModalGroup] = useState(null);
  const [invitedLeaderIds, setInvitedLeaderIds] = useState([]);
  const [leadersList, setLeadersList] = useState([]);

  // Stored user
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }
  const currentUserId = storedUser.id || storedUser._id || 1;

  // Load groups from backend
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchGroups(currentUserId);
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [currentUserId]);

  // Handle Join Group
  const handleJoin = async (group) => {
    try {
      setActionLoadingId(group.id);
      // Optimistic UI update
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: true } : g))
      );
      toast.success(`Joined ${group.name}! 🎉`);
      await joinGroup(currentUserId, group.id);
    } catch (err) {
      console.error('Join error:', err);
      // Revert if error
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: false } : g))
      );
      toast.error('Failed to join group');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Leave Group
  const handleLeave = async (group) => {
    const confirmLeave = window.confirm(`Are you sure you want to leave ${group.name}?`);
    if (!confirmLeave) return;

    try {
      setActionLoadingId(group.id);
      // Optimistic UI update
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: false } : g))
      );
      toast(`Left ${group.name}`, { icon: '👋' });
      await leaveGroup(currentUserId, group.id);
    } catch (err) {
      console.error('Leave error:', err);
      // Revert
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: true } : g))
      );
      toast.error('Failed to leave group');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Load leaders for Instagram-style Direct Invites
  useEffect(() => {
    let isMounted = true;
    async function loadLeaders() {
      try {
        const res = await fetch('/api/dashboard/leaders');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.leaders)) {
            setLeadersList(data.leaders);
          }
        }
      } catch {}
    }
    loadLeaders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-detect and handle ?join=<groupId> invite links
  useEffect(() => {
    const joinId = searchParams.get('join');
    if (joinId && groups.length > 0) {
      const target = groups.find((g) => String(g.id) === String(joinId));
      if (target && !target.is_member) {
        toast(`Invited to "${target.name}"! Joining community...`, { icon: '🤝' });
        handleJoin(target);
      }
    }
  }, [groups, searchParams]);

  // Handle Create Group Submission
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    const nameTrimmed = newGroupName.trim();
    if (!nameTrimmed) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setCreatingGroup(true);
      const created = await createGroup({
        name: nameTrimmed,
        category: newGroupCategory,
        description: newGroupDesc.trim() || 'Connect and collaborate with direct selling leaders.',
        userId: currentUserId,
      });

      const groupObj = {
        ...created,
        id: created?.id || Date.now(),
        name: created?.name || nameTrimmed,
        category: created?.category || newGroupCategory,
        description: created?.description || newGroupDesc.trim(),
        members: created?.members || '1 member',
        is_member: true,
      };

      setGroups((prev) => [groupObj, ...prev.filter((g) => g.id !== groupObj.id)]);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setActiveTab('my-groups');
      toast.success(`Group "${groupObj.name}" created successfully! 🎉`);
      // Open Instagram-style invite modal immediately so creator can invite team members
      setInviteModalGroup(groupObj);
    } catch (err) {
      console.error('Failed to create group:', err);
      toast.error(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Copy Group Invite Link
  const handleCopyLink = async (group) => {
    const link = `${window.location.origin}/groups?join=${group.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Group invite link copied to clipboard! 📋');
    } catch {
      toast.success(`Invite link: ${link}`);
    }
  };

  // Native Share / Mobile Share
  const handleNativeShare = async (group) => {
    const link = `${window.location.origin}/groups?join=${group.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on Fortaa`,
          text: `Join our direct selling mastermind group "${group.name}" on Fortaa:`,
          url: link,
        });
      } catch {}
    } else {
      handleCopyLink(group);
    }
  };

  // Direct Send Invite to a Leader
  const handleSendDirectInvite = (leader, group) => {
    setInvitedLeaderIds((prev) => [...prev, leader.id]);
    toast.success(`Invite sent to ${leader.name || 'leader'} for "${group.name}"! 🚀`);
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Tab filter
      if (activeTab === 'my-groups' && !g.is_member) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && g.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (g.name || '').toLowerCase().includes(q);
        const matchDesc = (g.description || '').toLowerCase().includes(q);
        const matchCat = (g.category || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [groups, activeTab, selectedCategory, searchQuery]);

  const myGroupsCount = groups.filter((g) => g.is_member).length;
  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));
  const joinId = searchParams.get('join');
  const targetInviteGroup =
    joinId && groups.length > 0 ? groups.find((g) => String(g.id) === String(joinId)) : null;

  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="group" targetName={targetInviteGroup?.name || ''} />
      )}
      <div className={`grp-page-root ${!isUserAuthenticated ? 'auth-gated-blur' : ''}`}>
      {/* Global Header */}
      <UserHeader
        user={storedUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="grp-main-layout">
        {/* Left Sidebar */}
        <UserSidebar
          activeTab="Groups"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Content Container */}
        <main className="grp-content-container">
          <div className="grp-body-wrapper">
            {/* Hero Banner Header */}
            <div className="grp-hero-banner">
              <div className="grp-hero-glow" />
              <div className="grp-hero-meta">
                <div className="grp-hero-tag">
                  <FiZap className="grp-hero-zap" />
                  <span>COMMUNITY HUBS</span>
                </div>
                <h1 className="grp-hero-title">Groups & Masterminds</h1>
                <p className="grp-hero-subtitle">
                  Join exclusive direct selling communities, exchange winning strategies, and scale your team with verified leaders.
                </p>
              </div>

              <button
                type="button"
                className="grp-create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus className="grp-btn-plus-icon" />
                <span>Create Group</span>
              </button>
            </div>

            {/* Sub-tabs & Search Bar Row */}
            <div className="grp-toolbar-row">
              <div className="grp-tabs-wrap">
                <button
                  type="button"
                  className={`grp-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                  onClick={() => setActiveTab('explore')}
                >
                  <FiCompass className="grp-tab-icon" />
                  <span>Explore Groups</span>
                  <span className="grp-count-pill">{groups.length}</span>
                </button>

                <button
                  type="button"
                  className={`grp-tab-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
                  onClick={() => setActiveTab('my-groups')}
                >
                  <FiUsers className="grp-tab-icon" />
                  <span>My Groups</span>
                  <span className="grp-count-pill">{myGroupsCount}</span>
                </button>
              </div>

              <div className="grp-search-box">
                <FiSearch className="grp-search-icon" />
                <input
                  type="text"
                  placeholder="Search groups by name or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="grp-search-input"
                />
                {searchQuery && (
                  <button type="button" className="grp-search-clear" onClick={() => setSearchQuery('')}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="grp-categories-scroll">
              {CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat] || CATEGORY_META['General'];
                const IconComp = meta.icon;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`grp-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <IconComp className="grp-cat-pill-icon" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className="grp-loading-box">
                <div className="grp-spinner" />
                <span>Loading groups...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="grp-empty-box">
                <div className="grp-empty-icon-wrap">
                  <FiUsers className="grp-empty-icon" />
                </div>
                <h3 className="grp-empty-title">
                  {activeTab === 'my-groups'
                    ? "You haven't joined any groups yet!"
                    : 'No groups found matching your criteria.'}
                </h3>
                <p className="grp-empty-sub">
                  {activeTab === 'my-groups'
                    ? 'Explore groups in the community and join to start collaborating with top leaders.'
                    : 'Try clearing your search or switching categories.'}
                </p>
                {activeTab === 'my-groups' && (
                  <button
                    type="button"
                    className="grp-empty-btn"
                    onClick={() => {
                      setActiveTab('explore');
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                  >
                    <span>Browse Explore Groups</span>
                    <FiArrowRight />
                  </button>
                )}
              </div>
            ) : (
              <div className="grp-cards-grid">
                {filteredGroups.map((group, idx) => {
                  const gradient =
                    CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS['General'];
                  const isMember = group.is_member;
                  const isActionLoading = actionLoadingId === group.id;

                  return (
                    <div
                      key={group.id}
                      className="grp-card"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {/* Card Gradient Header */}
                      <div className="grp-card-header" style={{ background: gradient }}>
                        <div className="grp-card-header-overlay" />
                        <span className="grp-card-badge">
                          {getCategoryIcon(group.category)}
                          <span>{group.category || 'General'}</span>
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="grp-card-body">
                        {/* Group Avatar / Icon */}
                        <div className="grp-card-avatar-wrap">
                          {group.icon_url ? (
                            <img
                              src={group.icon_url}
                              alt={group.name}
                              className="grp-card-avatar"
                            />
                          ) : (
                            <div className="grp-card-avatar-placeholder" style={{ background: gradient }}>
                              {(group.name || 'G').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="grp-card-title" title={group.name}>{group.name}</h3>
                        <p className="grp-card-desc">{group.description}</p>

                        {/* Footer Meta: Members count & Action buttons */}
                        <div className="grp-card-footer">
                          <div className="grp-members-count">
                            <FiUsers className="grp-members-icon" />
                            <span>{group.members || '1 member'}</span>
                          </div>

                          <div className="grp-card-actions">
                            {isMember ? (
                              <>
                                <button
                                  type="button"
                                  className="grp-chat-btn"
                                  onClick={() => navigate(`/messages?groupId=${group.id}`)}
                                  title="Open Group Chat"
                                >
                                  <FiMessageCircle className="grp-btn-sub-icon" />
                                  <span>Chat</span>
                                </button>
                                <button
                                  type="button"
                                  className="grp-invite-btn"
                                  onClick={() => setInviteModalGroup(group)}
                                  title="Invite friends or share link"
                                >
                                  <FiShare2 className="grp-btn-sub-icon" />
                                  <span>Invite</span>
                                </button>
                                <button
                                  type="button"
                                  className="grp-joined-btn"
                                  disabled={isActionLoading}
                                  onClick={() => handleLeave(group)}
                                  title="Click to leave group"
                                >
                                  <FiCheck className="grp-btn-sub-icon" />
                                  <span>{isActionLoading ? '...' : 'Joined'}</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="grp-invite-btn"
                                  onClick={() => setInviteModalGroup(group)}
                                  title="Share group invite link"
                                >
                                  <FiShare2 className="grp-btn-sub-icon" />
                                  <span>Share</span>
                                </button>
                                <button
                                  type="button"
                                  className="grp-join-btn"
                                  disabled={isActionLoading}
                                  onClick={() => handleJoin(group)}
                                >
                                  <FiUserPlus className="grp-btn-sub-icon" />
                                  <span>{isActionLoading ? 'Joining...' : 'Join Group'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ──────────────── CREATE GROUP MODAL ──────────────── */}
      {showCreateModal && (
        <div className="grp-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="grp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="grp-modal-header">
              <div className="grp-modal-title-wrap">
                <FiPlusCircle className="grp-modal-title-icon" />
                <h3 className="grp-modal-title">Create New Group</h3>
              </div>
              <button
                type="button"
                className="grp-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="grp-modal-form">
              <div className="grp-form-group">
                <label className="grp-form-label">Group Name *</label>
                <input
                  type="text"
                  className="grp-form-input"
                  placeholder="e.g. Mumbai Direct Selling Masterminds"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grp-form-group">
                <label className="grp-form-label">Category</label>
                <select
                  className="grp-form-select"
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grp-form-group">
                <label className="grp-form-label">Description</label>
                <textarea
                  className="grp-form-textarea"
                  rows={3}
                  placeholder="Describe your mastermind goals, topics, and team rules..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div className="grp-modal-actions">
                <button
                  type="button"
                  className="grp-modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingGroup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="grp-modal-submit"
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── INSTAGRAM-STYLE GROUP INVITE MODAL ──────────────── */}
      {inviteModalGroup && (
        <div className="grp-modal-backdrop" onClick={() => setInviteModalGroup(null)}>
          <div className="grp-modal-box grp-invite-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="grp-modal-header">
              <div>
                <h3 className="grp-modal-title">Invite to {inviteModalGroup.name}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  Share the group invite link or invite leaders directly like Instagram
                </p>
              </div>
              <button
                type="button"
                className="grp-modal-close"
                onClick={() => setInviteModalGroup(null)}
              >
                <FiX />
              </button>
            </div>

            {/* Invite Link Card */}
            <div className="grp-invite-link-card">
              <div className="grp-invite-link-text">
                <span className="grp-link-label">GROUP INVITE LINK</span>
                <span className="grp-link-url">
                  {window.location.origin}/groups?join={inviteModalGroup.id}
                </span>
              </div>
              <button
                type="button"
                className="grp-copy-link-btn"
                onClick={() => handleCopyLink(inviteModalGroup)}
              >
                <FiLink />
                <span>Copy Link</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grp-share-actions-row">
              <button
                type="button"
                className="grp-share-pill-btn grp-wa-btn"
                onClick={() => {
                  const url = `${window.location.origin}/groups?join=${inviteModalGroup.id}`;
                  const text = `Join my direct selling group "${inviteModalGroup.name}" on Fortaa: ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <FaWhatsapp className="grp-wa-icon" />
                <span>Share via WhatsApp</span>
              </button>
              <button
                type="button"
                className="grp-share-pill-btn"
                onClick={() => handleNativeShare(inviteModalGroup)}
              >
                <FiShare2 />
                <span>Share Link</span>
              </button>
            </div>

            {/* Suggested Leaders list to invite */}
            {leadersList && leadersList.length > 0 && (
              <div className="grp-invite-leaders-section">
                <span className="grp-invite-leaders-title">Suggested Leaders to Invite</span>
                <div className="grp-invite-leaders-list">
                  {leadersList.slice(0, 6).map((leader) => {
                    const isInvited = invitedLeaderIds.includes(leader.id);
                    return (
                      <div key={leader.id} className="grp-invite-leader-row">
                        <div className="grp-invite-leader-left">
                          <img
                            src={leader.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                            alt={leader.name}
                            className="grp-invite-leader-avatar"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://randomuser.me/api/portraits/lego/1.jpg';
                            }}
                          />
                          <div className="grp-invite-leader-info">
                            <span className="grp-invite-leader-name">{leader.name}</span>
                            <span className="grp-invite-leader-meta">
                              {leader.role || leader.company_brand || 'Direct Seller'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`grp-send-invite-btn ${isInvited ? 'sent' : ''}`}
                          disabled={isInvited}
                          onClick={() => handleSendDirectInvite(leader, inviteModalGroup)}
                        >
                          {isInvited ? 'Sent ✓' : 'Invite'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <UserMobileBottomNav active="Groups" />
    </div>
    </>
  );
}
