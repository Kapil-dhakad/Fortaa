import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiX,
  FiSearch,
  FiUsers,
  FiPlus,
  FiCheck,
  FiMessageSquare,
  FiLogOut,
  FiShield,
  FiCompass,
  FiTag,
} from 'react-icons/fi';
import {
  fetchGroups,
  joinGroup,
  leaveGroup,
  createGroup,
} from '../../services/group.service';
import './JoinGroupModal.css';

const CATEGORIES = [
  'All',
  'Leadership',
  'Motivation',
  'Direct Selling',
  'Wellness',
  'Marketing',
];

export default function JoinGroupModal({
  isOpen,
  onClose,
  currentUser = {},
  onGroupJoined = null,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'myGroups' | 'create'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Create Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Leadership');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const effectiveUserId = currentUser?.id || currentUser?._id || 1;

  // Load groups on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetchGroups(effectiveUserId)
      .then((data) => {
        if (isMounted) {
          setGroups(data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load groups:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveUserId]);

  // Handle Join
  const handleJoin = async (group) => {
    if (!effectiveUserId) {
      toast.error('Please login to join groups');
      return;
    }

    try {
      setActionLoadingId(group.id);
      await joinGroup(effectiveUserId, group.id);

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === group.id) {
            const count = (g.actual_members_count || 1) + 1;
            return {
              ...g,
              is_member: true,
              actual_members_count: count,
              members: `${count} members`,
            };
          }
          return g;
        })
      );

      toast.success(`You joined "${group.name}"!`);
      if (onGroupJoined) {
        onGroupJoined(group);
      }
    } catch (err) {
      toast.error(err.message || 'Could not join group');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Leave
  const handleLeave = async (group) => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;

    try {
      setActionLoadingId(group.id);
      await leaveGroup(effectiveUserId, group.id);

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === group.id) {
            const count = Math.max(1, (g.actual_members_count || 2) - 1);
            return {
              ...g,
              is_member: false,
              actual_members_count: count,
              members: `${count} members`,
            };
          }
          return g;
        })
      );

      toast.success(`Left "${group.name}"`);
    } catch (err) {
      toast.error(err.message || 'Could not leave group');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Go to Group Chat
  const handleOpenChat = (group) => {
    onClose();
    // Navigate to messages with preselected group chat
    navigate(`/messages?userId=group_${group.id}`);
  };

  // Handle Create Group Submit
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    const cleanName = newGroupName.trim();
    if (!cleanName) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setCreating(true);
      const created = await createGroup({
        name: cleanName,
        category: newGroupCategory,
        description: newGroupDescription.trim(),
        userId: effectiveUserId,
      });

      toast.success(`Group "${cleanName}" created successfully! 🎉`);
      setNewGroupName('');
      setNewGroupDescription('');

      // Add to local state & switch to my groups
      const freshGroup = {
        ...created,
        is_member: true,
        actual_members_count: 1,
        members: '1 member',
      };
      setGroups((prev) => [freshGroup, ...prev]);
      setActiveTab('myGroups');
    } catch (err) {
      toast.error(err.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Tab filter
      if (activeTab === 'myGroups' && !g.is_member) return false;

      // Category filter
      if (selectedCategory !== 'All' && g.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (g.name || '').toLowerCase().includes(query);
        const matchesDesc = (g.description || '').toLowerCase().includes(query);
        const matchesCat = (g.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [groups, activeTab, selectedCategory, searchQuery]);

  const joinedCount = groups.filter((g) => g.is_member).length;

  if (!isOpen) return null;

  return (
    <div className="jgm-overlay" onClick={onClose}>
      <div className="jgm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="jgm-header">
          <div className="jgm-header-left">
            <div className="jgm-icon-badge">
              <FiUsers />
            </div>
            <div>
              <h2 className="jgm-title">Community Groups</h2>
              <p className="jgm-subtitle">
                Collaborate, share masterminds, and network with high-performing leaders
              </p>
            </div>
          </div>
          <button type="button" className="jgm-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="jgm-nav-tabs">
          <button
            type="button"
            className={`jgm-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <FiCompass />
            <span>Explore Groups</span>
          </button>
          <button
            type="button"
            className={`jgm-tab-btn ${activeTab === 'myGroups' ? 'active' : ''}`}
            onClick={() => setActiveTab('myGroups')}
          >
            <FiCheck />
            <span>My Groups</span>
            {joinedCount > 0 && <span className="jgm-tab-count">{joinedCount}</span>}
          </button>
          <button
            type="button"
            className={`jgm-tab-btn jgm-tab-create ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FiPlus />
            <span>Create Group</span>
          </button>
        </div>

        {/* Search & Categories Bar (for Explore & MyGroups) */}
        {activeTab !== 'create' && (
          <div className="jgm-filter-section">
            <div className="jgm-search-box">
              <FiSearch className="jgm-search-icon" />
              <input
                type="text"
                placeholder="Search groups by name, topic or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jgm-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="jgm-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="jgm-categories-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`jgm-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="jgm-body">
          {activeTab === 'create' ? (
            /* CREATE GROUP FORM */
            <form onSubmit={handleCreateGroupSubmit} className="jgm-create-form">
              <div className="jgm-form-group">
                <label className="jgm-form-label">
                  Group Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fortaa Delhi Diamond Achievers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="jgm-form-input"
                  maxLength={100}
                  required
                />
              </div>

              <div className="jgm-form-group">
                <label className="jgm-form-label">Category</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="jgm-form-select"
                >
                  <option value="Leadership">Leadership</option>
                  <option value="Direct Selling">Direct Selling</option>
                  <option value="Motivation">Motivation</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Marketing">Marketing</option>
                  <option value="General">General Networking</option>
                </select>
              </div>

              <div className="jgm-form-group">
                <label className="jgm-form-label">Group Purpose & Description</label>
                <textarea
                  placeholder="Describe the mission, goals, or who should join this mastermind..."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="jgm-form-textarea"
                  rows={4}
                  maxLength={300}
                />
              </div>

              <div className="jgm-create-actions">
                <button
                  type="button"
                  className="jgm-btn-secondary"
                  onClick={() => setActiveTab('explore')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                  className="jgm-btn-primary"
                >
                  {creating ? 'Creating Group...' : 'Create & Launch Group'}
                </button>
              </div>
            </form>
          ) : loading ? (
            /* LOADING STATE */
            <div className="jgm-loading-state">
              <div className="jgm-spinner" />
              <p>Loading community groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            /* EMPTY STATE */
            <div className="jgm-empty-state">
              <div className="jgm-empty-icon">
                <FiUsers />
              </div>
              <h3>
                {activeTab === 'myGroups'
                  ? "You haven't joined any groups yet"
                  : 'No groups found'}
              </h3>
              <p>
                {activeTab === 'myGroups'
                  ? 'Browse the Explore tab to discover active groups and join conversations!'
                  : 'Try adjusting your search query or category filters.'}
              </p>
              {activeTab === 'myGroups' && (
                <button
                  type="button"
                  className="jgm-btn-primary"
                  onClick={() => setActiveTab('explore')}
                >
                  Explore Groups
                </button>
              )}
            </div>
          ) : (
            /* GROUPS LIST */
            <div className="jgm-cards-list">
              {filteredGroups.map((group) => {
                const isMember = Boolean(group.is_member);
                const isOperating = actionLoadingId === group.id;

                return (
                  <div key={group.id} className="jgm-card">
                    {/* Group Icon */}
                    <div className="jgm-card-icon-wrap">
                      {group.icon_url ? (
                        <img
                          src={group.icon_url}
                          alt={group.name}
                          className="jgm-card-icon-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="jgm-card-icon-fallback"
                        style={{ display: group.icon_url ? 'none' : 'flex' }}
                      >
                        <FiUsers />
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="jgm-card-info">
                      <div className="jgm-card-top-line">
                        <h4 className="jgm-card-title">{group.name}</h4>
                        <span className="jgm-cat-badge">{group.category || 'General'}</span>
                      </div>

                      <p className="jgm-card-desc">
                        {group.description || 'Connect and collaborate with community leaders.'}
                      </p>

                      <div className="jgm-card-meta">
                        <span className="jgm-meta-members">
                          <FiUsers /> {group.members || `${group.actual_members_count || 1} members`}
                        </span>
                        {isMember && (
                          <span className="jgm-meta-joined-pill">
                            <FiCheck /> Member
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Actions */}
                    <div className="jgm-card-actions">
                      {isMember ? (
                        <>
                          <button
                            type="button"
                            className="jgm-chat-btn"
                            title="Open group chat in Messages"
                            onClick={() => handleOpenChat(group)}
                          >
                            <FiMessageSquare /> Chat
                          </button>
                          <button
                            type="button"
                            disabled={isOperating}
                            className="jgm-leave-btn"
                            title="Leave group"
                            onClick={() => handleLeave(group)}
                          >
                            <FiLogOut />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isOperating}
                          className="jgm-join-btn"
                          onClick={() => handleJoin(group)}
                        >
                          {isOperating ? 'Joining...' : '+ Join Group'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="jgm-footer">
          <div className="jgm-footer-tip">
            <FiShield /> Joined groups appear directly in your Messages under "Group"
          </div>
          <button type="button" className="jgm-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
