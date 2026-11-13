import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import { fetchPostLikersApi } from '../../services/dashboard.service';
import './PostLikersModal.css';

export default function PostLikersModal({
  isOpen,
  onClose,
  postId,
  currentUserId,
  followingIds = [],
  onToggleFollow,
  onUserClick,
}) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !postId) return;

    let isMounted = true;
    async function loadLikers() {
      setLoading(true);
      try {
        const list = await fetchPostLikersApi(postId, currentUserId);
        if (isMounted) setLikers(list);
      } catch (err) {
        console.error('Failed to load likers:', err);
        if (isMounted) setLikers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLikers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="plm-backdrop" onClick={onClose}>
      <div className="plm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="plm-header">
          <h3 className="plm-title">Likes</h3>
          <button type="button" className="plm-close-btn" onClick={onClose} aria-label="Close">
            <HiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="plm-body">
          {loading ? (
            <div className="plm-loading">
              <span className="plm-spinner" />
              <span>Loading...</span>
            </div>
          ) : likers.length === 0 ? (
            <div className="plm-empty">
              <span>No likes yet</span>
            </div>
          ) : (
            <div className="plm-list">
              {likers.map((liker) => {
                const isSelf = Number(liker.id) === Number(currentUserId);
                const isFollowing = Array.isArray(followingIds) && followingIds.map(Number).includes(Number(liker.id));

                return (
                  <div key={liker.id} className="plm-user-row">
                    <div
                      className="plm-user-info"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onClose();
                        if (onUserClick) onUserClick(liker.id, liker);
                      }}
                    >
                      <img
                        src={liker.avatar_url || userAvatarImg}
                        alt={liker.name}
                        className="plm-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarImg;
                        }}
                      />
                      <div className="plm-meta">
                        <span className="plm-name">{liker.name || 'Member'}</span>
                        <span className="plm-role">{liker.role || 'Fortaa Leader'}</span>
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        className={`plm-btn-follow ${isFollowing ? 'following' : ''}`}
                        onClick={() => onToggleFollow && onToggleFollow(liker.id, liker.name)}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
