import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUserPlus, FiLogIn, FiCheckCircle } from 'react-icons/fi';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import './AuthGateModal.css';

export default function AuthGateModal({
  type = 'general', // 'profile' | 'post' | 'group' | 'general'
  targetName = '',
}) {
  const navigate = useNavigate();

  // Prevent background scrolling while modal is active
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  const currentPath =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search + window.location.hash
      : '/dashboard';
  const encodedRedirect = encodeURIComponent(currentPath);

  const handleRegister = () => {
    navigate(`/signup?redirect=${encodedRedirect}`);
  };

  const handleLogin = () => {
    navigate(`/login?redirect=${encodedRedirect}`);
  };

  // Determine dynamic messaging based on content type
  let heading = 'Join Fortaa to view this content';
  let badgeLabel = '🔒 Exclusive Community Content';
  let desc = 'Please log in or create a free account to view this content and interact with leaders.';

  if (type === 'profile') {
    heading = targetName ? `Join Fortaa to view ${targetName}'s Profile` : "Join Fortaa to view this Leader's Profile";
    badgeLabel = '👤 Leader Profile Protected';
    desc = 'Sign in or register to view full bio, achievements, team downline, and connect directly with top direct sellers.';
  } else if (type === 'post') {
    heading = targetName ? `Join Fortaa to view ${targetName}'s Post` : 'Join Fortaa to view this Community Post';
    badgeLabel = '📝 Community Post Protected';
    desc = 'Sign in or create a free account to read full posts, vote on polls, engage in discussions, and share insights.';
  } else if (type === 'group') {
    heading = targetName ? `Join Fortaa to access "${targetName}"` : 'Join Fortaa to access this Mastermind Group';
    badgeLabel = '👥 Mastermind Group Protected';
    desc = 'Sign in or create a free account to collaborate with members, exchange strategies, and grow your direct sales team.';
  }

  return (
    <div className="agm-backdrop" role="dialog" aria-modal="true">
      <div className="agm-modal-card">
        {/* Glowing Top Aura */}
        <div className="agm-glow-aura" />

        {/* Brand Header */}
        <div className="agm-brand-row">
          <img src={logoIconImg} alt="Fortaa" className="agm-brand-icon" />
          <img src={logoTextImg} alt="FORTAA" className="agm-brand-text" />
        </div>

        {/* Lock & Badge */}
        <div className="agm-lock-badge">
          <FiLock className="agm-lock-icon" />
          <span>{badgeLabel}</span>
        </div>

        {/* Title & Description */}
        <h2 className="agm-title">{heading}</h2>
        <p className="agm-desc">{desc}</p>

        {targetName && (
          <div className="agm-target-chip">
            <span className="agm-chip-dot" />
            <span>Shared with you on Fortaa</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="agm-actions">
          <button type="button" className="agm-btn-primary" onClick={handleRegister}>
            <FiUserPlus className="agm-btn-icon" />
            <span>Create Free Account / Register</span>
          </button>

          <button type="button" className="agm-btn-secondary" onClick={handleLogin}>
            <FiLogIn className="agm-btn-icon" />
            <span>Already have an account? Log In</span>
          </button>
        </div>

        {/* Perks Checklist */}
        <div className="agm-perks-list">
          <div className="agm-perk-item">
            <FiCheckCircle className="agm-perk-check" />
            <span>100% Free registration for direct sellers</span>
          </div>
          <div className="agm-perk-item">
            <FiCheckCircle className="agm-perk-check" />
            <span>Access 10,000+ verified leaders & masterminds</span>
          </div>
          <div className="agm-perk-item">
            <FiCheckCircle className="agm-perk-check" />
            <span>Instant messaging, daily training & team growth tools</span>
          </div>
        </div>

        {/* Bottom micro notice */}
        <p className="agm-footer-note">
          By signing up, you agree to Fortaa's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
