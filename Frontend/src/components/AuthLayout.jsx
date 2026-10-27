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
          <Link to="/" className="auth-back-link">
            ← Back to Home
          </Link>
        </header>

        {/* Main 2-Column Content */}
        <div className="auth-content-grid">
          {/* Left Column: Visuals & Highlights */}
          <div className="auth-left-panel">
            <div className="auth-left-text">
              <h1 className="auth-hero-title">{title}</h1>
              <p className="auth-hero-subtitle">{subtitle}</p>
            </div>

            {/* Illustration Card */}
            <div className="auth-illustration-card">
              <img
                src={authIllustration}
                alt="More Connections, More Opportunities"
                className="auth-illustration-img"
              />
            </div>

            {/* Bottom 4 Feature Pills */}
            <div className="auth-feature-pills">
              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="9" y1="22" x2="9" y2="22.01" />
                    <line x1="15" y1="22" x2="15" y2="22.01" />
                    <line x1="9" y1="6" x2="9" y2="6.01" />
                    <line x1="15" y1="6" x2="15" y2="6.01" />
                    <line x1="9" y1="10" x2="9" y2="10.01" />
                    <line x1="15" y1="10" x2="15" y2="10.01" />
                    <line x1="9" y1="14" x2="9" y2="14.01" />
                    <line x1="15" y1="14" x2="15" y2="14.01" />
                    <line x1="9" y1="18" x2="9" y2="18.01" />
                    <line x1="15" y1="18" x2="15" y2="18.01" />
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
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </span>
                <span className="pill-label">Products</span>
              </div>

              <div className="auth-feature-pill">
                <span className="pill-icon-box pill-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
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
