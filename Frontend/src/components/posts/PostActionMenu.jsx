import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineShare,
  HiOutlineLink,
  HiOutlineExclamationCircle,
  HiOutlineUserRemove,
  HiOutlineUserAdd,
  HiOutlineTrash,
} from 'react-icons/hi';
import './PostActionMenu.css';

export default function PostActionMenu({
  isOpen,
  onClose,
  post,
  currentUserId,
  isFollowed = false,
  isPending = false,
  onToggleFollow,
  onAboutAccount,
  onGoToPost,
  onShare,
  onDeletePost,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const isSelf = post.user_id && currentUserId && Number(post.user_id) === Number(currentUserId);
  const targetId = post.user_id ? Number(post.user_id) : null;
  const authorName = post.author_name || 'Leader';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/all-posts?post=${post.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Link copied to clipboard! 📋'))
        .catch(() => toast.success('Link copied! 📋'));
    } else {
      toast.success('Link copied! 📋');
    }
    onClose();
  };

  const handleReport = () => {
    onClose();
    toast.success('Post reported. Thank you for keeping our community safe.', { icon: '🛡️' });
  };

  return (
    <div className="pam-backdrop" onClick={onClose}>
      <div
        className="pam-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="pam-menu-list">
          {/* Report Option (Red alert style) */}
          {!isSelf && (
            <button
              type="button"
              className="pam-menu-item pam-item-danger"
              onClick={handleReport}
            >
              <HiOutlineExclamationCircle className="pam-item-icon" />
              <span>Report</span>
            </button>
          )}

          {/* Follow / Unfollow (or Delete if own post) */}
          {isSelf ? (
            <button
              type="button"
              className="pam-menu-item pam-item-danger"
              onClick={() => {
                onClose();
                if (onDeletePost) onDeletePost(post.id);
              }}
            >
              <HiOutlineTrash className="pam-item-icon" />
              <span>Delete post</span>
            </button>
          ) : targetId ? (
            isFollowed ? (
              <button
                type="button"
                className="pam-menu-item pam-item-danger"
                onClick={() => {
                  onClose();
                  if (onToggleFollow) onToggleFollow(targetId, authorName);
                }}
              >
                <HiOutlineUserRemove className="pam-item-icon" />
                <span>Unfollow @{authorName}</span>
              </button>
            ) : isPending ? (
              <button
                type="button"
                className="pam-menu-item pam-item-warning"
                onClick={() => {
                  onClose();
                  if (onToggleFollow) onToggleFollow(targetId, authorName);
                }}
              >
                <HiOutlineUserRemove className="pam-item-icon" />
                <span>Cancel follow request</span>
              </button>
            ) : (
              <button
                type="button"
                className="pam-menu-item pam-item-primary"
                onClick={() => {
                  onClose();
                  if (onToggleFollow) onToggleFollow(targetId, authorName);
                }}
              >
                <HiOutlineUserAdd className="pam-item-icon" />
                <span>Follow @{authorName}</span>
              </button>
            )
          ) : null}

          {/* Copy Link */}
          <button
            type="button"
            className="pam-menu-item"
            onClick={handleCopyLink}
          >
            <HiOutlineLink className="pam-item-icon" />
            <span>Copy link</span>
          </button>

          {/* Share */}
          <button
            type="button"
            className="pam-menu-item"
            onClick={() => {
              onClose();
              if (onShare) onShare(post);
            }}
          >
            <HiOutlineShare className="pam-item-icon" />
            <span>Share</span>
          </button>

          {/* Go to post */}
          <button
            type="button"
            className="pam-menu-item"
            onClick={() => {
              onClose();
              if (onGoToPost) onGoToPost(post);
            }}
          >
            <HiOutlinePhotograph className="pam-item-icon" />
            <span>Go to post</span>
          </button>

          {/* About this account */}
          <button
            type="button"
            className="pam-menu-item pam-item-highlight"
            onClick={() => {
              onClose();
              if (onAboutAccount) onAboutAccount(post);
            }}
          >
            <HiOutlineInformationCircle className="pam-item-icon" />
            <span>About this account</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            className="pam-menu-item pam-item-cancel"
            onClick={onClose}
          >
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
