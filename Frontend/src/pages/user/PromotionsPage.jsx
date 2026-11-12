import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import './PromotionsPage.css';

// Promo megaphone graphic
import sidebarMegaphoneImg from '../../assets/dashboard/sidebar_megaphone_3d.png';

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notified, setNotified] = useState(false);

  // Current logged in user
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }

  const [emailInput, setEmailInput] = useState(storedUser.email || '');

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setNotified(true);
    toast.success('Awesome! We will notify you the moment Promotions go live! 🚀');
  };

  return (
    <div className="promo-page-root">
      {/* Global User Header */}
      <UserHeader
        user={storedUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="promo-main-layout">
        {/* Left Sidebar */}
        <UserSidebar
          activeTab="Promotions"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="promo-content-container">
          <div className="promo-coming-soon-card">
            {/* Pill Badge */}
            <div className="promo-pill-badge">
              <span className="promo-pulse-dot" />
              <span>COMING SOON</span>
            </div>

            {/* 3D Illustration */}
            <div className="promo-icon-wrap">
              <img
                src={sidebarMegaphoneImg}
                alt="Promotions"
                className="promo-megaphone-img"
              />
            </div>

            {/* Title & Subtitle */}
            <h1 className="promo-title">Promotions & Exclusive Deals</h1>
            <p className="promo-desc">
              We are crafting an exclusive promotion ecosystem for Fortaa network leaders.
              Soon you will be able to unlock high-impact brand deals, sponsored team growth campaigns,
              and special performance incentives.
            </p>

            {/* Teaser Feature Cards */}
            <div className="promo-features-grid">
              <div className="promo-feature-card">
                <span className="promo-feature-icon">🎯</span>
                <h4 className="promo-feature-name">Brand Partnerships</h4>
                <p className="promo-feature-text">
                  Direct brand collaborations and certified affiliate opportunities.
                </p>
              </div>

              <div className="promo-feature-card">
                <span className="promo-feature-icon">🏆</span>
                <h4 className="promo-feature-name">Leader Incentives</h4>
                <p className="promo-feature-text">
                  Milestone rewards and bonuses for top team builders.
                </p>
              </div>

              <div className="promo-feature-card">
                <span className="promo-feature-icon">🚀</span>
                <h4 className="promo-feature-name">Sponsored Boosts</h4>
                <p className="promo-feature-text">
                  Amplify your profile and business reach to verified leaders.
                </p>
              </div>

              <div className="promo-feature-card">
                <span className="promo-feature-icon">🎁</span>
                <h4 className="promo-feature-name">Exclusive Offers</h4>
                <p className="promo-feature-text">
                  Special discounts on business tools, seminars, and masterclasses.
                </p>
              </div>
            </div>

            {/* Notify Form */}
            <div className="promo-action-box">
              {notified ? (
                <div className="promo-notified-badge">
                  <span>✅ You are on the priority VIP list! We will notify you soon.</span>
                </div>
              ) : (
                <form className="promo-notify-form" onSubmit={handleNotifyMe}>
                  <input
                    type="email"
                    className="promo-email-input"
                    placeholder="Enter your email to get early access..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button type="submit" className="promo-notify-btn">
                    Notify Me 🔔
                  </button>
                </form>
              )}

              <button
                type="button"
                className="promo-back-btn"
                onClick={() => navigate('/dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <UserMobileBottomNav active="Promotions" />
    </div>
  );
}
