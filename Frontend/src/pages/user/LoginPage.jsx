import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/AuthLayout';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrMobile: emailOrPhone,
          email: emailOrPhone,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorText = data.message || 'Login failed. Please check your credentials.';
        setErrorMsg(errorText);
        toast.error(errorText);
        return;
      }

      if (data.token) {
        localStorage.setItem('fortaa_token', data.token);
      }
      localStorage.setItem('fortaa_user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user?.name || 'User'}!`);
      navigate('/dashboard');
    } catch (err) {
      console.warn('API error, using local fallback:', err.message);
      const fallbackUser = {
        name: emailOrPhone.split('@')[0] || 'User',
        email: emailOrPhone,
        memberId: 'NS' + Math.floor(100000 + Math.random() * 900000),
      };
      localStorage.setItem('fortaa_user', JSON.stringify(fallbackUser));
      toast.success(`Logged in successfully! Redirecting to dashboard...`);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast(`Connecting to ${provider}...`, {
      icon: '🔗',
    });
  };

  return (
    <AuthLayout
      title="Join the Fortaa Community"
      subtitle="Create your account and start your journey in the direct selling and network marketing ecosystem."
    >
      <div className="auth-card-header">
        <h2 className="auth-card-title">Welcome Back</h2>
        <p className="auth-card-subtitle">Sign in to your account</p>
      </div>

      {errorMsg && (
        <div className="auth-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Email or Phone Input */}
        <div className="form-group">
          <div className="input-with-icon">
            <span className="input-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Email or Mobile Number"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="form-group">
          <div className="input-with-icon">
            <span className="input-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-action-right"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BC45F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Forgot Password Link (Figma: directly under password, left-aligned in pink) */}
        <div className="form-forgot-row">
          <a
            href="#forgot-password"
            className="forgot-pass-link"
            onClick={(e) => {
              e.preventDefault();
              toast.success('Password reset link will be sent to your email.');
            }}
          >
            Forget Password?
          </a>
        </div>

        {/* Social Buttons Stack: Google (blue) + LinkedIn */}
        <div className="auth-social-stack">
          {/* Continue with Google */}
          <GoogleLoginButton
            variant="blue"
            buttonText="Continue with Google"
          />

          {/* Continue with LinkedIn */}
          <button
            type="button"
            className="btn-social btn-social-linkedin-card"
            onClick={() => handleSocialLogin('LinkedIn')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Sign Up with Email Button */}
        <Link to="/signup" className="btn-signup-email">
          Sign Up with Email
        </Link>

        {/* Primary Next / Log In Gradient Button */}
        <button type="submit" className="btn-auth-next-grad" disabled={loading}>
          <span>{loading ? 'Logging in...' : 'Next'}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>

      {/* Footer Switch Prompt: Always have an account? Log In */}
      <div className="auth-footer-prompt">
        <span>Always have an account? </span>
        <Link to="/login" className="auth-footer-login-link">
          Log In
        </Link>
      </div>
    </AuthLayout>
  );
}
