import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiCheck,
  FiX,
  FiPlusCircle,
} from 'react-icons/fi';
import { BsThreeDotsVertical } from 'react-icons/bs';
import UserHeader from '../../components/layout/UserHeader';
import { fetchCurrentUser } from '../../services/user.service';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import AuthGateModal from '../../components/auth/AuthGateModal';
import GroupMembersModal from '../../components/modals/GroupMembersModal';
import { fetchGroups, joinGroup, leaveGroup, createGroup } from '../../services/group.service';
import './GroupsPage.css';

// Figma Design preset groups matching user's screenshot exactly
const FIGMA_PRESET_GROUPS = [
  {
    id: 'f1',
    name: 'Albert Flores',
    sub: 'Business Leader',
    category: 'Leadership',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    members: '1.2k members',
    is_member: true,
  },
  {
    id: 'f2',
    name: 'Darlene Robertson',
    sub: 'Silver Leader',
    category: 'Direct Selling',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    members: '940 members',
    is_member: true,
  },
  {
    id: 'f3',
    name: 'Floyd Miles',
    sub: 'Team Leader',
    category: 'Motivation',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    members: '3.4k members',
    is_member: true,
  },
  {
    id: 'f4',
    name: 'Brooklyn Simmons',
    sub: 'Business Leader',
    category: 'Leadership',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    members: '2.1k members',
    is_member: true,
  },
  {
    id: 'f5',
    name: 'Esther Howard',
    sub: 'Silver Leader',
    category: 'Direct Selling',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    members: '860 members',
    is_member: true,
  },
  {
    id: 'f6',
    name: 'Dianne Russell',
    sub: 'Team Leader',
    category: 'Motivation',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    members: '1.8k members',
    is_member: true,
  },
  {
    id: 'f7',
    name: 'Devon Lane',
    sub: 'Business Leader',
    category: 'Leadership',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    members: '1.5k members',
    is_member: true,
  },
  {
    id: 'f8',
    name: 'Cameron Williamson',
    sub: 'Business Leader',
    category: 'Leadership',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    members: '4.2k members',
    is_member: false,
  },
  {
    id: 'f9',
    name: 'Savannah Nguyen',
    sub: 'Silver Leader',
    category: 'Direct Selling',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    members: '720 members',
    is_member: false,
  },
  {
    id: 'f10',
    name: 'Leslie Alexander',
    sub: 'Team Leader',
    category: 'Motivation',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    members: '2.9k members',
    is_member: false,
  },
  {
    id: 'f11',
    name: 'Eleanor Pena',
    sub: 'Business Leader',
    category: 'Leadership',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
    members: '1.1k members',
    is_member: false,
  },
];

const CATEGORIES = ['Leadership', 'Direct Selling', 'Motivation', 'Wellness', 'Marketing'];

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' (Group) | 'my-groups' (My Group)
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Active menu dropdown for "My Group" rows
  const [activeMenuGroupId, setActiveMenuGroupId] = useState(null);
  const menuRef = useRef(null);

  // Group Details / Members Modal
  const [viewingGroup, setViewingGroup] = useState(null);

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Leadership');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuGroupId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current user resolution
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }
  const [currentUserId, setCurrentUserId] = useState(() => storedUser.id || storedUser._id || null);

  useEffect(() => {
    if (!currentUserId) {
      fetchCurrentUser().then((me) => {
        if (me?.id) setCurrentUserId(me.id);
      }).catch(() => {});
    }
  }, [currentUserId]);

  // Load groups from backend and merge with preset groups
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchGroups(currentUserId);
      const backendList = Array.isArray(data) ? data : [];

      const backendIds = new Set(backendList.map((g) => String(g.id)));
      const combined = [
        ...backendList,
        ...FIGMA_PRESET_GROUPS.filter((fg) => !backendIds.has(String(fg.id))),
      ];
      setGroups(combined);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups(FIGMA_PRESET_GROUPS);
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
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: true } : g))
      );
      toast.success(`Joined ${group.name}! 🎉`);
      if (typeof group.id === 'number') {
        await joinGroup(currentUserId, group.id);
      }
    } catch (err) {
      console.error('Join error:', err);
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
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: false } : g))
      );
      toast(`Left ${group.name}`, { icon: '👋' });
      if (typeof group.id === 'number') {
        await leaveGroup(currentUserId, group.id);
      }
    } catch (err) {
      console.error('Leave error:', err);
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_member: true } : g))
      );
      toast.error('Failed to leave group');
    } finally {
      setActionLoadingId(null);
    }
  };

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
        sub: `${newGroupCategory} Leader`,
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
    } catch (err) {
      console.error('Failed to create group:', err);
      toast.error(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (activeTab === 'my-groups' && !g.is_member) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (g.name || '').toLowerCase().includes(q);
        const matchSub = (g.sub || '').toLowerCase().includes(q);
        const matchDesc = (g.description || '').toLowerCase().includes(q);
        const matchCat = (g.category || '').toLowerCase().includes(q);
        if (!matchName && !matchSub && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [groups, activeTab, searchQuery]);

  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));

  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="group" targetName="" />
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

              {/* Title above Card matching Figma */}
              <h2 className="grp-section-title">
                {activeTab === 'explore' ? 'Group' : 'My Group'}
              </h2>

              {/* Main Figma Card */}
              <div className="grp-figma-card">
                {/* Header Bar with Tabs & Create Button */}
                <div className="grp-figma-card-header">
                  <div className="grp-figma-tabs">
                    <button
                      type="button"
                      className={`grp-figma-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                      onClick={() => setActiveTab('explore')}
                    >
                      <span className="grp-figma-tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="12" r="5" />
                          <circle cx="16" cy="12" r="5" />
                        </svg>
                      </span>
                      <span>Group</span>
                    </button>

                    <button
                      type="button"
                      className={`grp-figma-tab-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
                      onClick={() => setActiveTab('my-groups')}
                    >
                      <span className="grp-figma-tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="12" r="5" />
                          <circle cx="16" cy="12" r="5" />
                        </svg>
                      </span>
                      <span>My Group</span>
                    </button>
                  </div>

                  <div className="grp-figma-header-right">
                    <div className="grp-figma-search">
                      <FiSearch className="grp-figma-search-icon" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="grp-figma-search-input"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="grp-figma-search-clear"
                          onClick={() => setSearchQuery('')}
                        >
                          <FiX size={12} />
                        </button>
                      )}
                    </div>

                    {activeTab === 'my-groups' && (
                      <button
                        type="button"
                        className="grp-figma-create-btn"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <FiPlusCircle size={15} />
                        <span>Create Group</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* List of Group Rows */}
                <div className="grp-figma-list">
                  {loading ? (
                    <div className="grp-loading-box">
                      <div className="grp-spinner" />
                      <span>Loading groups...</span>
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="grp-empty-box" style={{ padding: '40px 16px', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '15px' }}>
                        {activeTab === 'my-groups'
                          ? "You haven't joined any groups yet."
                          : 'No groups found matching your search.'}
                      </p>
                      {activeTab === 'my-groups' ? (
                        <button
                          type="button"
                          className="grp-figma-create-btn"
                          style={{ marginTop: '16px' }}
                          onClick={() => setShowCreateModal(true)}
                        >
                          <FiPlusCircle size={15} />
                          <span>Create Your First Group</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="grp-figma-joined-btn"
                          style={{ marginTop: '16px' }}
                          onClick={() => setSearchQuery('')}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const groupAvatar = group.icon_url || group.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name || 'Group')}&background=6220FE&color=fff`;
                      const groupSub = group.sub || (group.category ? `${group.category} Leader` : 'Business Leader');
                      const isMember = Boolean(group.is_member);
                      const isActionLoading = actionLoadingId === group.id;
                      const isMenuOpen = activeMenuGroupId === group.id;

                      return (
                        <div key={group.id} className="grp-figma-row">
                          <div className="grp-figma-row-left">
                            <img
                              src={groupAvatar}
                              alt={group.name}
                              className="grp-figma-avatar"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name || 'Group')}&background=6220FE&color=fff`;
                              }}
                            />
                            <div className="grp-figma-info">
                              <span className="grp-figma-name">{group.name}</span>
                              <span className="grp-figma-sub">{groupSub}</span>
                            </div>
                          </div>

                          <div className="grp-figma-row-right">
                            {activeTab === 'explore' ? (
                              <button
                                type="button"
                                className={`grp-figma-joined-btn ${!isMember ? 'not-joined' : ''}`}
                                disabled={isActionLoading}
                                onClick={() => {
                                  if (isMember) {
                                    handleLeave(group);
                                  } else {
                                    handleJoin(group);
                                  }
                                }}
                              >
                                {isActionLoading ? '...' : (isMember ? 'Joined' : 'Join')}
                              </button>
                            ) : (
                              <div className="grp-figma-actions-wrap">
                                <button
                                  type="button"
                                  className="grp-figma-view-btn"
                                  onClick={() => setViewingGroup(group)}
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  className="grp-figma-dots-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuGroupId(isMenuOpen ? null : group.id);
                                  }}
                                  title="Group Options"
                                >
                                  <BsThreeDotsVertical size={16} />
                                </button>

                                {/* Manage Group Dropdown Menu matching Figma Image 2 */}
                                {isMenuOpen && (
                                  <div className="grp-figma-dropdown-menu" ref={menuRef}>
                                    <div className="grp-dropdown-heading">Manage Group</div>
                                    <button
                                      type="button"
                                      className="grp-dropdown-item-btn"
                                      onClick={() => {
                                        setActiveMenuGroupId(null);
                                        setViewingGroup(group);
                                      }}
                                    >
                                      Manage Group
                                    </button>
                                    <button
                                      type="button"
                                      className="grp-dropdown-item-btn"
                                      onClick={() => {
                                        setActiveMenuGroupId(null);
                                        navigate(`/messages?groupId=${group.id}`);
                                      }}
                                    >
                                      View Group
                                    </button>
                                    <button
                                      type="button"
                                      className="grp-dropdown-item-btn danger"
                                      onClick={() => {
                                        setActiveMenuGroupId(null);
                                        handleLeave(group);
                                      }}
                                    >
                                      Leave Group
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="grp-modal-backdrop" onClick={() => setShowCreateModal(false)}>
            <div className="grp-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="grp-modal-header">
                <div>
                  <h3 className="grp-modal-title">Create Mastermind Group</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                    Start a community for your direct selling team, share scripts, and scale together
                  </p>
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
                    {CATEGORIES.map((cat) => (
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

        {/* Group Details & Members Modal */}
        {viewingGroup && (
          <GroupMembersModal
            isOpen={Boolean(viewingGroup)}
            onClose={() => setViewingGroup(null)}
            group={viewingGroup}
            currentUserId={currentUserId}
            onSelectUserForChat={(user) => {
              setViewingGroup(null);
              navigate(`/messages?userId=${user.user_id}`);
            }}
          />
        )}

        {/* Mobile Bottom Navigation */}
        <UserMobileBottomNav active="Groups" />
      </div>
    </>
  );
}
