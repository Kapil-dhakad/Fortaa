import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
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
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="adm-login-error-banner" role="alert">
            <FiAlertCircle className="adm-login-error-icon" />
            <span className="adm-login-error-text">{errorMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <form className="adm-login-form" onSubmit={handleSubmit} autoComplete="off">
          {/* Email Field */}
          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="admin-email">
              Email
            </label>
            <div className="adm-input-wrap">
              <FiMail className="adm-input-icon" />
              <input
                id="admin-email"
                type="email"
                className="adm-form-input"
                placeholder=""
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="off"
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
              <FiLock className="adm-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="adm-form-input"
                placeholder=""
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="adm-toggle-pw-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="adm-form-row">
            <label className="adm-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
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
        </div>
      </div>
    </div>
  );
}
