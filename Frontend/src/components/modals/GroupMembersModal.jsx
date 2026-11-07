import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FiX,
  FiSearch,
  FiUsers,
  FiMessageSquare,
  FiShield,
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { fetchGroupMembers } from '../../services/group.service';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import './GroupMembersModal.css';

export default function GroupMembersModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onlineUserIds = [],
  onSelectUserForChat = null,
}) {
  const [members, setMembers] = useState([]);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const groupId = group?.group_id || (group?.user_id && String(group.user_id).startsWith('group_')
    ? parseInt(String(group.user_id).replace('group_', ''), 10)
    : group?.id);

  useEffect(() => {
    if (!isOpen || !groupId) return;

    let isMounted = true;
    setLoading(true);

    fetchGroupMembers(groupId)
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setMembers(data.members || []);
          if (data.group) setGroupDetails(data.group);
        } else {
          toast.error(data.message || 'Failed to load group members');
        }
      })
      .catch((err) => {
        console.error('[GroupMembersModal Error]:', err);
        if (isMounted) toast.error('Could not load group members');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, groupId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter((m) => {
      const nameMatch = (m.name || '').toLowerCase().includes(q);
      const roleMatch = (m.level_title || m.role || '').toLowerCase().includes(q);
      const emailMatch = (m.email || '').toLowerCase().includes(q);
      return nameMatch || roleMatch || emailMatch;
    });
  }, [members, searchQuery]);

  if (!isOpen) return null;

  const currentGroup = groupDetails || group || {};
  const totalCount = members.length;

  return (
    <div className="gmm-overlay" onClick={onClose}>
      <div className="gmm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gmm-header">
          <div className="gmm-header-left">
            <div className="gmm-icon-wrap">
              {currentGroup.icon_url || currentGroup.avatar_url ? (
                <img
                  src={currentGroup.icon_url || currentGroup.avatar_url}
                  alt={currentGroup.name}
                  className="gmm-icon-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="gmm-icon-fallback"
                style={{
                  display:
                    currentGroup.icon_url || currentGroup.avatar_url ? 'none' : 'flex',
                }}
              >
                <FiUsers />
              </div>
            </div>
            <div className="gmm-header-info">
              <div className="gmm-title-row">
                <h3 className="gmm-title">{currentGroup.name || 'Group Members'}</h3>
                <span className="gmm-cat-badge">
                  {currentGroup.category || currentGroup.role || 'Group'}
                </span>
              </div>
              <p className="gmm-subtitle">
                <FiUsers className="gmm-sub-icon" /> {totalCount} {totalCount === 1 ? 'member' : 'members'} in this group
              </p>
            </div>
          </div>
          <button
            type="button"
            className="gmm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Search Bar */}
        <div className="gmm-search-wrap">
          <FiSearch className="gmm-search-icon" />
          <input
            type="text"
            className="gmm-search-input"
            placeholder="Search member by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="gmm-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Members List */}
        <div className="gmm-body">
          {loading ? (
            <div className="gmm-loading-state">
              <div className="gmm-spinner" />
              <p>Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="gmm-empty-state">
              <FiUsers className="gmm-empty-icon" />
              <h4>No members found</h4>
              <p>Try searching with another name or filter.</p>
            </div>
          ) : (
            <div className="gmm-list">
              {filteredMembers.map((member) => {
                const isMe = String(member.user_id) === String(currentUserId);
                const isOnline = onlineUserIds.includes(String(member.user_id));
                const isAdmin = member.role === 'admin';

                return (
                  <div key={member.user_id} className="gmm-member-card">
                    {/* Avatar with Online status */}
                    <div className="gmm-avatar-wrap">
                      <img
                        src={member.avatar_url || userAvatarRahul}
                        alt={member.name}
                        className="gmm-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarRahul;
                        }}
                      />
                      <span
                        className={`gmm-online-dot ${
                          isOnline ? 'online' : 'offline'
                        }`}
                        title={isOnline ? 'Online now' : 'Offline'}
                      />
                    </div>

                    {/* Member Meta */}
                    <div className="gmm-meta">
                      <div className="gmm-name-row">
                        <span className="gmm-name">{member.name}</span>
                        {isMe && <span className="gmm-you-pill">You</span>}
                        {isAdmin && (
                          <span className="gmm-admin-badge" title="Group Admin">
                            <FaCrown /> Admin
                          </span>
                        )}
                      </div>
                      <div className="gmm-role-row">
                        <span className="gmm-level-text">
                          {member.level_title || 'Leader'}
                        </span>
                        {member.company_brand && (
                          <>
                            <span className="gmm-divider">•</span>
                            <span className="gmm-company-text">
                              {member.company_brand}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action: Send 1-on-1 message */}
                    {!isMe && onSelectUserForChat && (
                      <button
                        type="button"
                        className="gmm-msg-btn"
                        title={`Message ${member.name}`}
                        onClick={() => {
                          onClose();
                          onSelectUserForChat({
                            user_id: member.user_id,
                            name: member.name,
                            avatar_url: member.avatar_url,
                            role: member.level_title || 'Leader',
                            company_brand: member.company_brand || 'Fortaa',
                            category: 'Direct',
                          });
                        }}
                      >
                        <FiMessageSquare />
                        <span>Message</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gmm-footer">
          <div className="gmm-footer-hint">
            <FiShield /> Group messages are encrypted & read receipts tracked for all members
          </div>
          <button type="button" className="gmm-done-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
