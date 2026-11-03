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
  variant = 'default',
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

        if (result.token) {
          localStorage.setItem('fortaa_token', result.token);
        }
        if (result.user) {
          localStorage.setItem('fortaa_user', JSON.stringify(result.user));
        }

        if (onSuccess) {
          onSuccess(result);
        } else {
          // Naya user (pehle se registered nahi hai) -> Complete Profile page par redirect
          if (result.isNewUser) {
            toast.success(`Google verified! Welcome to Fortaa, complete your details, ${result.user?.name || userName}.`, {
              id: 'google-auth-toast',
            });
            navigate('/complete-profile');
          } else {
            // User pehle se register hai -> Seedhe User Dashboard par redirect
            toast.success(`Welcome back, ${result.user?.name || userName}!`, {
              id: 'google-auth-toast',
            });
            navigate('/dashboard');
          }
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

  // Button Click Handler using Google OAuth2 Token Client (Reliable Popup)
  const handleCustomButtonClick = async () => {
    if (loading) return;

    if (!clientId) {
      toast.error('Google Client ID is not configured.');
      return;
    }

    try {
      await loadGoogleScript();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not available');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.warn('[Google OAuth Popup Closed/Cancelled]:', tokenResponse);
            return;
          }

          setLoading(true);
          toast.loading('Signing in with Google...', { id: 'google-auth-toast' });

          try {
            // Fetch verified user profile directly from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await userInfoRes.json();

            if (!profile.email) {
              throw new Error('Google did not return an email address');
            }

            // Authenticate with Fortaa backend
            const result = await authenticateWithBackend(null, {
              email: profile.email,
              name: profile.name || profile.email.split('@')[0],
              picture: profile.picture || null,
              accountType,
            });

            if (result.token) {
              localStorage.setItem('fortaa_token', result.token);
            }
            if (result.user) {
              localStorage.setItem('fortaa_user', JSON.stringify(result.user));
            }

            if (onSuccess) {
              onSuccess(result);
            } else if (result.isNewUser) {
              toast.success(`Google verified! Welcome, ${result.user?.name || profile.name}.`, {
                id: 'google-auth-toast',
              });
              navigate('/complete-profile');
            } else {
              toast.success(`Welcome back, ${result.user?.name || profile.name}!`, {
                id: 'google-auth-toast',
              });
              navigate('/dashboard');
            }
          } catch (err) {
            console.error('[Google Login Error]:', err);
            toast.error(err.message || 'Google authentication failed', { id: 'google-auth-toast' });
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('[Google Script Error]:', err);
      toast.error('Google service could not be loaded. Please refresh and try again.');
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

      {variant === 'blue' ? (
        <button
          type="button"
          className="btn-social btn-social-google-blue"
          onClick={handleCustomButtonClick}
          disabled={loading}
        >
          <span className="btn-social-icon-circle">
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
            </svg>
          </span>
          <span>{loading ? 'Connecting...' : buttonText}</span>
        </button>
      ) : variant === 'purple' ? (
        <button
          type="button"
          className="btn-desk-social btn-desk-google-purple"
          onClick={handleCustomButtonClick}
          disabled={loading}
        >
          <span className="btn-social-icon-circle">
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
            </svg>
          </span>
          <span>{loading ? 'Connecting...' : buttonText}</span>
        </button>
      ) : (
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
      )}
    </>
  );
}
