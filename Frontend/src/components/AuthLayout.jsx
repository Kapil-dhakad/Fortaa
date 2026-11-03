import { Link } from 'react-router-dom';
import logoIconImg from '../assets/figma/logo_icon_img.png';
import logoTextImg from '../assets/figma/logo_text_img.png';
import authIllustration from '../assets/auth_illustration.png';
import './AuthLayout.css';

export default function AuthLayout({
  title = 'Join the Fortaa Community',
  subtitle = 'Create your account and start your journey in the direct selling and network marketing ecosystem.',
  children,
}) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Top Header / Brand */}
        <header className="auth-header">
          <Link to="/" className="figma-logo" title="Back to Home">
            <img src={logoIconImg} alt="Fortaa F" className="figma-logo-icon" />
            <div className="figma-logo-text-wrap">
              <img src={logoTextImg} alt="FORTAA" className="figma-logo-word" />
              <span className="figma-logo-tagline">Discover, easy and Grow</span>
            </div>
          </Link>

          <div className="auth-header-right">
            {/* Language Selector Pill (Figma: EN v) */}
            <div className="auth-lang-pill" title="Language: English">
              <span>EN</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            <Link to="/" className="auth-back-link">
              ← Back to Home
            </Link>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="auth-content-grid">
          {/* Left Column: Visuals & Highlights */}
          <div className="auth-left-panel">
            <div className="auth-left-text">
              <h1 className="auth-hero-title">
                Join the<br />
                <span className="auth-brand-purple">Fortaa</span> Community
              </h1>
              <p className="auth-hero-subtitle">{subtitle}</p>
            </div>

            {/* Illustration Card (hidden on mobile per Figma) */}
            <div className="auth-illustration-card">
              <img
                src={authIllustration}
                alt="More Connections, More Opportunities"
                className="auth-illustration-img"
              />
            </div>

            {/* Bottom 4 Feature Pills (hidden on mobile per Figma) */}
            <div className="auth-feature-pills">
              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="9" y1="22" x2="9" y2="22.01" />
                    <line x1="15" y1="22" x2="15" y2="22.01" />
                  </svg>
                </span>
                <span className="pill-label">Companies</span>
              </div>

              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="pill-label">Leaders</span>
              </div>

              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  </svg>
                </span>
                <span className="pill-label">Products</span>
              </div>

              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </span>
                <span className="pill-label">Opportunities</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form Container Card */}
          <div className="auth-right-panel">
            <div className="auth-form-card">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
