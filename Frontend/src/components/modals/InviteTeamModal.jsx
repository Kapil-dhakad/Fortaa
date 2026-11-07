import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiX,
  FiCopy,
  FiCheck,
  FiShare2,
  FiUsers,
  FiSend,
  FiShield,
  FiAward,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaLinkedinIn,
  FaFacebookF,
} from 'react-icons/fa';
import './InviteTeamModal.css';

export default function InviteTeamModal({ isOpen, onClose, currentUser = {} }) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  if (!isOpen) return null;

  // Determine user code and link
  const referralCode =
    currentUser.memberId ||
    currentUser.member_id ||
    currentUser.referral_code ||
    (currentUser.id ? `FT-${currentUser.id}` : 'FORTAA-VIP');

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
      : `https://fortaa.com/signup?ref=${referralCode}`;

  const shareText = `🚀 Join my business team on Fortaa - India's #1 Social & Direct Selling Platform! Connect with top leaders, grow your sales, and get exclusive business training. Register here: ${referralLink}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralCode);
      }
      setCodeCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      toast.error('Could not copy code');
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join my Fortaa team!')}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedInShare = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
    window.open(liUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Fortaa Team',
          text: shareText,
          url: referralLink,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="itm-overlay" onClick={onClose}>
      <div className="itm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="itm-header">
          <div className="itm-header-left">
            <div className="itm-icon-badge">
              <FiUsers />
            </div>
            <div>
              <h2 className="itm-title">Invite Your Team</h2>
              <p className="itm-subtitle">
                Expand your direct selling network & earn team override bonuses
              </p>
            </div>
          </div>
          <button type="button" className="itm-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Content Body */}
        <div className="itm-body">
          {/* Referral Link Box */}
          <div className="itm-section">
            <label className="itm-label">YOUR PERSONAL INVITATION LINK</label>
            <div className="itm-input-group">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="itm-input"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`itm-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <FiCheck /> Copied!
                  </>
                ) : (
                  <>
                    <FiCopy /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Code Badge */}
          <div className="itm-code-card">
            <div className="itm-code-info">
              <span className="itm-code-label">Referral Code</span>
              <span className="itm-code-val">{referralCode}</span>
            </div>
            <button
              type="button"
              className="itm-code-copy-btn"
              onClick={handleCopyCode}
            >
              {codeCopied ? <FiCheck color="#10B981" /> : <FiCopy />}
              <span>{codeCopied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Share Via Channels */}
          <div className="itm-section">
            <label className="itm-label">FAST SHARE TO CHANNELS</label>
            <div className="itm-share-grid">
              <button
                type="button"
                className="itm-share-card itm-whatsapp"
                onClick={handleWhatsAppShare}
              >
                <div className="itm-share-icon wa-icon">
                  <FaWhatsapp />
                </div>
                <div className="itm-share-text">
                  <span className="itm-share-name">WhatsApp</span>
                  <span className="itm-share-hint">Direct Message / Status</span>
                </div>
              </button>

              <button
                type="button"
                className="itm-share-card itm-telegram"
                onClick={handleTelegramShare}
              >
                <div className="itm-share-icon tg-icon">
                  <FaTelegramPlane />
                </div>
                <div className="itm-share-text">
                  <span className="itm-share-name">Telegram</span>
                  <span className="itm-share-hint">Broadcast & Groups</span>
                </div>
              </button>

              <button
                type="button"
                className="itm-share-card itm-linkedin"
                onClick={handleLinkedInShare}
              >
                <div className="itm-share-icon in-icon">
                  <FaLinkedinIn />
                </div>
                <div className="itm-share-text">
                  <span className="itm-share-name">LinkedIn</span>
                  <span className="itm-share-hint">Professional Feed</span>
                </div>
              </button>

              <button
                type="button"
                className="itm-share-card itm-facebook"
                onClick={handleFacebookShare}
              >
                <div className="itm-share-icon fb-icon">
                  <FaFacebookF />
                </div>
                <div className="itm-share-text">
                  <span className="itm-share-name">Facebook</span>
                  <span className="itm-share-hint">Post & Stories</span>
                </div>
              </button>
            </div>
          </div>

          {/* Highlights / Benefits */}
          <div className="itm-perks-row">
            <div className="itm-perk-item">
              <div className="itm-perk-icon"><FiTrendingUp /></div>
              <div>
                <strong>Instant Placement</strong>
                <span>Auto-linked to your sponsor downline</span>
              </div>
            </div>
            <div className="itm-perk-item">
              <div className="itm-perk-icon"><FiAward /></div>
              <div>
                <strong>Leader Rank Points</strong>
                <span>Earn team commission PV on registrations</span>
              </div>
            </div>
            <div className="itm-perk-item">
              <div className="itm-perk-icon"><FiShield /></div>
              <div>
                <strong>Verified Network</strong>
                <span>Direct 1-on-1 team chat and mentoring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="itm-footer">
          <button type="button" className="itm-btn-secondary" onClick={onClose}>
            Done
          </button>
          <button
            type="button"
            className="itm-btn-primary"
            onClick={handleNativeShare}
          >
            <FiShare2 /> Share with Device
          </button>
        </div>
      </div>
    </div>
  );
}
