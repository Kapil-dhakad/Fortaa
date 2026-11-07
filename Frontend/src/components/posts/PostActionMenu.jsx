import React, { useEffect } from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineShare,
} from 'react-icons/hi';
import './PostActionMenu.css';

export default function PostActionMenu({
  isOpen,
  onClose,
  post,
  onAboutAccount,
  onGoToPost,
  onShare,
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

  return (
    <div className="pam-backdrop" onClick={onClose}>
      <div
        className="pam-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="pam-menu-list">
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
