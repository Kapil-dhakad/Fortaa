import React, { useEffect } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineBadgeCheck,
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import './AboutAccountModal.css';

export default function AboutAccountModal({
  isOpen,
  onClose,
  post,
  onViewProfile,
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

  const authorName = post.author_name || 'Fortaa Leader';
  const authorAvatar = post.author_avatar || userAvatarRahul;
  const authorRole = post.author_role || 'Senior Leader';
  const joinDateText = post.created_at
    ? `Member since ${new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'Member since 2026';

  return (
    <div className="aam-backdrop" onClick={onClose}>
      <div
        className="aam-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="aam-header">
          <h3 className="aam-title">About this account</h3>
          <button
            type="button"
            className="aam-close-btn"
            onClick={onClose}
            title="Close"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="aam-profile-card">
          <div className="aam-avatar-wrap">
            <img src={authorAvatar} alt={authorName} className="aam-avatar" />
            <span className="aam-online-dot" />
          </div>
          <h4 className="aam-author-name">{authorName}</h4>
          <span className="aam-author-role">{authorRole}</span>
          <p className="aam-subtitle">
            To help keep our network authentic and transparent, we show verified account information for leaders on Fortaa.
          </p>
        </div>

        {/* Info Items List */}
        <div className="aam-info-list">
          <div className="aam-info-row">
            <div className="aam-icon-circle">
              <HiOutlineCalendar />
            </div>
            <div className="aam-info-text">
              <span className="aam-info-label">Date joined</span>
              <span className="aam-info-value">{joinDateText}</span>
            </div>
          </div>

          <div className="aam-info-row">
            <div className="aam-icon-circle">
              <HiOutlineLocationMarker />
            </div>
            <div className="aam-info-text">
              <span className="aam-info-label">Account based in</span>
              <span className="aam-info-value">India</span>
            </div>
          </div>

          <div className="aam-info-row">
            <div className="aam-icon-circle">
              <HiOutlineBriefcase />
            </div>
            <div className="aam-info-text">
              <span className="aam-info-label">Designation / Role</span>
              <span className="aam-info-value">{authorRole}</span>
            </div>
          </div>

          <div className="aam-info-row">
            <div className="aam-icon-circle">
              <HiOutlineBadgeCheck />
            </div>
            <div className="aam-info-text">
              <span className="aam-info-label">Verification</span>
              <span className="aam-info-value">Verified Community Leader</span>
            </div>
          </div>

          <div className="aam-info-row">
            <div className="aam-icon-circle">
              <HiOutlineUsers />
            </div>
            <div className="aam-info-text">
              <span className="aam-info-label">Platform status</span>
              <span className="aam-info-value">Active Fortaa Partner</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="aam-footer">
          <button
            type="button"
            className="aam-btn-primary"
            onClick={() => {
              onClose();
              if (onViewProfile) onViewProfile(post);
            }}
          >
            <span>View Full Profile</span>
            <HiOutlineArrowRight />
          </button>
          <button
            type="button"
            className="aam-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
