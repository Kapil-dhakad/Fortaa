import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/AuthLayout';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Step state: 'request' | 'otp' | 'new-password' | 'success'
  const [step, setStep] = useState('request');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // OTP state (6 separate digits)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Timer state for Resend OTP
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // New password state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Dynamic titles for AuthLayout based on active step
  const getLayoutTitle = () => {
    switch (step) {
      case 'otp':
        return 'Verify Your Account';
      case 'new-password':
        return 'Create New Password';
      case 'success':
        return 'Password Updated';
      case 'request':
      default:
        return 'Reset Your Password';
    }
  };

  const getLayoutSubtitle = () => {
    switch (step) {
      case 'otp':
        return 'Enter the 6-digit code sent to your email or mobile number.';
      case 'new-password':
        return 'Set a strong new password to secure your Fortaa account.';
      case 'success':
        return 'Your password has been changed successfully. You can now log in.';
      case 'request':
      default:
        return 'Enter your registered email or mobile number and we will send you a reset link.';
    }
  };

  // STEP 1: Request OTP / Reset Link
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanInput }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message || 'Unable to find an account with this identifier.';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setMaskedTarget(data.maskedTarget || cleanInput);
      setIsMobile(Boolean(data.isMobile));
      setStep('otp');
      setTimer(45);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success(data.message || 'Verification code sent!');

      // Focus first OTP input after DOM renders
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      console.error('Request OTP error:', err);
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const val = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (val.length > 1) {
      // User pasted into box
      const pastedChars = val.slice(0, 6).split('');
      pastedChars.forEach((ch, i) => {
        if (index + i < 6) {
          newOtp[index + i] = ch;
        }
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + pastedChars.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = val ? val.slice(-1) : '';
    setOtp(newOtp);

    // Auto advance to next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    const targetIdx = Math.min(pasteData.length, 5);
    otpInputsRef.current[targetIdx]?.focus();
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message || 'Incorrect verification code. Please try again.';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setResetToken(data.resetToken);
      setStep('new-password');
      toast.success('Code verified! Please create your new password.');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to resend code.');
        return;
      }

      setTimer(45);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success('New 6-digit code has been sent!');
      if (otpInputsRef.current[0]) {
        otpInputsRef.current[0].focus();
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setErrorMsg('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message || 'Failed to reset password. Please start over.';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setStep('success');
      toast.success('Password reset successfully!');

      // Redirect to login after 2.5s
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error('Reset Password error:', err);
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={getLayoutTitle()} subtitle={getLayoutSubtitle()}>
      <div className="fp-wrapper">
        <div className="fp-card">
          {/* ============================================================== */}
          {/* STEP 1: REQUEST RESET LINK / OTP                                */}
          {/* ============================================================== */}
          {step === 'request' && (
            <>
              <div className="fp-header">
                <h2 className="fp-title">Forget Password?</h2>
                <p className="fp-subtitle">No worry! we'll send you a reset link.</p>
              </div>

              {errorMsg && (
                <div className="fp-banner-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form className="fp-form" onSubmit={handleRequestSubmit}>
                <div className="fp-form-group">
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon-left">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="fp-input"
                      placeholder="Email or Mobile Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="fp-btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fp-spinner" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Desktop Back Link */}
              <div className="fp-back-link-wrap">
                <Link to="/login" className="fp-back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* STEP 2: ENTER OTP & VERIFY                                     */}
          {/* ============================================================== */}
          {step === 'otp' && (
            <>
              <div className="fp-header">
                <h2 className="fp-title">Enter OTP</h2>
                <p className="fp-subtitle">
                  We have sent a 6-digit code to{' '}
                  <span className="fp-subtitle-target">{maskedTarget || identifier}</span>
                </p>
              </div>

              {errorMsg && (
                <div className="fp-banner-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form className="fp-form" onSubmit={handleVerifyOtp}>
                <div className="fp-otp-grid" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`fp-otp-box ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="fp-btn-primary"
                  disabled={loading || otp.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="fp-spinner" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>

                {/* Resend OTP Timer Row */}
                <div className="fp-timer-wrap">
                  {!canResend ? (
                    <span className="fp-timer-text">
                      Resend OTP{' '}
                      <span className="fp-timer-count">
                        00: {timer < 10 ? `0${timer}` : timer} sec
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="fp-btn-resend"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>

              {/* Desktop Back Link */}
              <div className="fp-back-link-wrap">
                <Link to="/login" className="fp-back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* STEP 3: CREATE NEW PASSWORD                                    */}
          {/* ============================================================== */}
          {step === 'new-password' && (
            <>
              <div className="fp-header">
                <h2 className="fp-title">Create New Password</h2>
                <p className="fp-subtitle">Enter your new strong password below.</p>
              </div>

              {errorMsg && (
                <div className="fp-banner-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form className="fp-form" onSubmit={handleResetPassword}>
                <div className="fp-form-group">
                  <label className="fp-form-label">New Password</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon-left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="fp-input"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="fp-input-toggle-right"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="fp-form-group">
                  <label className="fp-form-label">Confirm New Password</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon-left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="fp-input"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="fp-input-toggle-right"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="fp-btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fp-spinner" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Desktop Back Link */}
              <div className="fp-back-link-wrap">
                <Link to="/login" className="fp-back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* STEP 4: SUCCESS CONFIRMATION                                   */}
          {/* ============================================================== */}
          {step === 'success' && (
            <div className="fp-success-card">
              <div className="fp-success-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="fp-title">Password Reset Successfully!</h2>
              <p className="fp-subtitle" style={{ marginBottom: '24px' }}>
                Your password has been changed. You will be redirected to the login page in a moment.
              </p>
              <Link to="/login" className="fp-btn-primary" style={{ textDecoration: 'none' }}>
                Login Now
              </Link>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* MOBILE VIEW PILL (Matching Figma Mobile Frame: Back to Login)    */}
        {/* ============================================================== */}
        <div className="fp-mobile-back-pill">
          <Link to="/login" className="fp-mobile-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
