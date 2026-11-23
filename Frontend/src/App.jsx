import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import './index.css';

// Route-level Code Splitting for Ultra-Fast Mobile & Desktop Page Loads
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/user/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/user/ForgotPasswordPage'));
const SignUpPage = lazy(() => import('./pages/user/SignUpPage'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const CompleteProfilePage = lazy(() => import('./pages/user/CompleteProfilePage'));
const AllPostsPage = lazy(() => import('./pages/user/AllPostsPage'));
const MessagesPage = lazy(() => import('./pages/user/MessagesPage'));
const FollowingPage = lazy(() => import('./pages/user/FollowingPage'));
const LeadersPage = lazy(() => import('./pages/user/LeadersPage'));
const LeaderProfilePage = lazy(() => import('./pages/user/LeaderProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUserDashboard = lazy(() => import('./pages/admin/AdminUserDashboard'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const PromotionsPage = lazy(() => import('./pages/user/PromotionsPage'));
const SettingsPage = lazy(() => import('./pages/user/SettingsPage'));
const GroupsPage = lazy(() => import('./pages/user/GroupsPage'));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage'));
const SupportChatPage = lazy(() => import('./pages/user/SupportChatPage'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      flexDirection: 'column',
      gap: '14px',
      background: '#FAF8FD',
    }}>
      <div style={{
        width: '38px',
        height: '38px',
        border: '3.5px solid #EDE8F5',
        borderTopColor: '#8637EF',
        borderRadius: '50%',
        animation: 'fortaaSpin 0.75s linear infinite',
      }} />
      <span style={{ fontSize: '13px', color: '#6326AE', fontWeight: 600, letterSpacing: '0.02em' }}>
        Loading Fortaa...
      </span>
      <style>{`@keyframes fortaaSpin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('fortaa_user') || 'null');
  } catch {
    user = null;
  }
  const isAuth = Boolean(user && (user.id || user.email));

  if (!isAuth) {
    const redirect = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function AdminProtectedRoute({ children }) {
  let admin = null;
  try {
    admin = JSON.parse(localStorage.getItem('fortaa_admin') || 'null');
  } catch {
    admin = null;
  }
  const isAdmin = Boolean(admin && admin.role === 'admin');

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Toast popups temporarily commented out for smooth Instagram/LinkedIn style experience
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#6D28D9',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#ffffff',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '2px 4px 2px 8px',
                      marginLeft: '10px',
                      color: '#9CA3AF',
                      fontSize: '15px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      lineHeight: 1,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                    title="Dismiss"
                    aria-label="Close notification"
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
          <Route path="/all-posts" element={<AllPostsPage />} />
          <Route path="/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
          <Route path="/leaders" element={<LeadersPage />} />
          <Route path="/leaders/:id" element={<LeaderProfilePage />} />
          <Route path="/leader/:id" element={<LeaderProfilePage />} />
          <Route path="/leader-profile" element={<LeaderProfilePage />} />
          <Route path="/network" element={<LeadersPage />} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportChatPage /></ProtectedRoute>} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/users" element={<AdminProtectedRoute><AdminUserDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/user-dashboard" element={<AdminProtectedRoute><AdminUserDashboard /></AdminProtectedRoute>} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
