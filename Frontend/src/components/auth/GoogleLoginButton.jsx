import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  loadGoogleScript,
  authenticateWithBackend,
  decodeGoogleToken,
} from '../../services/googleAuth.service';

export default function GoogleLoginButton({
  buttonText = 'Continue with Google',
  accountType = 'Individual / Professional',
  onSuccess,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hiddenBtnRef = useRef(null);

  // Client ID from Vite environment
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '620993789654-2q0r7h7hpddu1vd8lvrghftsj4pl3sss.apps.googleusercontent.com';

  // Handle Google Token from popup / One-Tap
  const handleGoogleCredentialResponse = React.useCallback(
    async (response) => {
      if (!response?.credential) {
        toast.error('No credential received from Google.');
        return;
      }

      setLoading(true);
      try {
        const decoded = decodeGoogleToken(response.credential);
        const userName = decoded?.name || 'User';

        toast.loading(`Signing in as ${userName}...`, { id: 'google-auth-toast' });

        // Send to Fortaa Backend (checks if user exists, logs in or registers)
        const result = await authenticateWithBackend(response.credential, {
          accountType,
        });

        toast.success(
          result.isNewUser
            ? `Welcome to Fortaa, ${result.user?.name || userName}!`
            : `Welcome back, ${result.user?.name || userName}!`,
          { id: 'google-auth-toast' }
        );

        if (onSuccess) {
          onSuccess(result.user);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('[Google Login Error]:', err);
        toast.error(err.message || 'Google authentication failed', { id: 'google-auth-toast' });
      } finally {
        setLoading(false);
      }
    },
    [accountType, navigate, onSuccess]
  );

  useEffect(() => {
    let isMounted = true;

    async function initGIS() {
      if (!clientId) return;

      try {
        await loadGoogleScript();
        if (!isMounted || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Optionally render the official Google button invisibly to trigger standard popup
        if (hiddenBtnRef.current) {
          window.google.accounts.id.renderButton(hiddenBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
          });
        }
      } catch (err) {
        console.warn('[Google Auth Init Warning]:', err.message);
      }
    }

    initGIS();

    return () => {
      isMounted = false;
    };
  }, [clientId, handleGoogleCredentialResponse]);

  // Button Click Handler
  const handleCustomButtonClick = () => {
    if (loading) return;

    if (!clientId) {
      // Guide user that Client ID needs to be configured in .env
      toast(
        'Google Client ID abhi set nahi hai. Google Cloud Console se Client ID lekar VITE_GOOGLE_CLIENT_ID me daal dijiye.',
        {
          icon: 'ℹ️',
          duration: 5000,
        }
      );
      return;
    }

    if (window.google?.accounts?.id) {
      // Trigger Google prompt or click hidden rendered button
      if (hiddenBtnRef.current?.querySelector('div[role="button"]')) {
        hiddenBtnRef.current.querySelector('div[role="button"]').click();
      } else {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If one-tap is suppressed, trigger hidden button
            const btn = hiddenBtnRef.current?.querySelector('div[role="button"]');
            if (btn) btn.click();
          }
        });
      }
    } else {
      toast.error('Google service is still loading, please try again in a moment.');
    }
  };

  return (
    <>
      {/* Hidden container where GIS renders official popup trigger */}
      <div
        ref={hiddenBtnRef}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="btn-social btn-social-google"
        onClick={handleCustomButtonClick}
        disabled={loading}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid #EA4335',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Connecting...
          </span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            {buttonText}
          </>
        )}
      </button>
    </>
  );
}
