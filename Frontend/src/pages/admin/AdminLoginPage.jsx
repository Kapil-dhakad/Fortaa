import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin } from '../../services/admin.service';
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If admin is already logged in, redirect straight to /admin
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fortaa_admin') || 'null');
      if (stored && stored.role === 'admin') {
        navigate('/admin', { replace: true });
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginAdmin(email.trim(), password);

      if (res && res.success && res.user && res.user.role === 'admin') {
        // Save admin session in localStorage
        localStorage.setItem('fortaa_admin', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('fortaa_admin_token', res.token);
        }
        // Redirect to admin dashboard
        navigate('/admin', { replace: true });
      } else {
        // OWASP Generic Error: "Invalid email or password"
        setErrorMsg(res?.message || 'Invalid email or password');
      }
    } catch {
      setErrorMsg('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-page">
      <div className="adm-login-container">
        {/* Brand Card */}
        <div className="adm-login-header">
          <div className="adm-login-brand-pill">
            <img src={logoIconImg} alt="Fortaa" className="adm-login-logo" />
            <span className="adm-login-brand-title">FORTAA</span>
          </div>
          <h1 className="adm-login-title">Admin Console</h1>
          <p className="adm-login-subtitle">
            Enter your administrative credentials to access the console
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="adm-login-error-banner" role="alert">
            <span className="adm-login-error-icon">⚠️</span>
            <span className="adm-login-error-text">{errorMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <form className="adm-login-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="admin-email">
              Admin Email
            </label>
            <div className="adm-input-wrap">
              <span className="adm-input-icon">✉️</span>
              <input
                id="admin-email"
                type="email"
                className="adm-form-input"
                placeholder="admin@fortaa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="admin-password">
              Password
            </label>
            <div className="adm-input-wrap">
              <span className="adm-input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="adm-form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="adm-toggle-pw-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Remember me & Security Note */}
          <div className="adm-form-row">
            <label className="adm-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
            <span className="adm-sec-badge">🔒 256-bit Secure</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="adm-login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="adm-btn-loading">
                <span className="adm-spinner"></span> Authenticating...
              </span>
            ) : (
              'Sign In to Admin Console →'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="adm-login-footer">
          <Link to="/" className="adm-back-link">
            ← Return to Fortaa Public Website
          </Link>
          <p className="adm-disclaimer">
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
