import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import './index.css';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/user/LoginPage';
import SignUpPage from './pages/user/SignUpPage';
import UserDashboard from './pages/user/UserDashboard';
import ProfilePage from './pages/user/ProfilePage';
import CompleteProfilePage from './pages/user/CompleteProfilePage';
import AllPostsPage from './pages/user/AllPostsPage';
import MessagesPage from './pages/user/MessagesPage';
import FollowingPage from './pages/user/FollowingPage';
import LeadersPage from './pages/user/LeadersPage';
import LeaderProfilePage from './pages/user/LeaderProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserDashboard from './pages/admin/AdminUserDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/all-posts" element={<AllPostsPage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/leaders" element={<LeadersPage />} />
        <Route path="/leaders/:id" element={<LeaderProfilePage />} />
        <Route path="/leader/:id" element={<LeaderProfilePage />} />
        <Route path="/leader-profile" element={<LeaderProfilePage />} />
        <Route path="/network" element={<LeadersPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUserDashboard />} />
        <Route path="/admin/user-dashboard" element={<AdminUserDashboard />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
