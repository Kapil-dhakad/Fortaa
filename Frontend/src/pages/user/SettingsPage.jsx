import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import { fetchUserProfile, updateUserProfile } from '../../services/user.service';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
  // Notification settings
  emailNotifications: true,
  pushNotifications: true,
  newConnectionAlerts: true,
  teamActivity: false,
  eventReminders: true,
  marketingUpdates: false,

  // Privacy settings
  profileVisibility: 'public', // 'public' | 'connections' | 'private'
  showMyActivity: true,
  allowMessages: true,
};

export default function SettingsPage() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active sub-tab: 'notifications' | 'privacy'
  const [activeTab, setActiveTab] = useState(() => {
    if (location.hash === '#privacy') return 'privacy';
    return 'notifications';
  });

  // Stored user
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }

  // Settings state persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fortaa_user_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      const initialVisibility = storedUser?.profile_visibility || storedUser?.profileVisibility || parsed?.profileVisibility || 'public';
      return { ...DEFAULT_SETTINGS, ...parsed, profileVisibility: initialVisibility };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Fetch latest settings from server profile on mount
  useEffect(() => {
    const uid = storedUser?.id || storedUser?._id;
    if (uid) {
      fetchUserProfile(uid)
        .then((prof) => {
          if (prof?.profile_visibility) {
            setSettings((prev) => ({
              ...prev,
              profileVisibility: prof.profile_visibility,
            }));
          }
        })
        .catch(() => {});
    }
  }, [storedUser?.id, storedUser?._id]);

  // Keep hash in sync with tab via hashchange event
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#privacy') setActiveTab('privacy');
      else if (window.location.hash === '#notifications') setActiveTab('notifications');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleVisibilityChange = (value) => {
    setSettings((prev) => ({
      ...prev,
      profileVisibility: value,
    }));
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('fortaa_user_settings', JSON.stringify(settings));

      const uid = storedUser?.id || storedUser?._id;
      if (uid) {
        try {
          await updateUserProfile(uid, {
            profileVisibility: settings.profileVisibility,
          });
          const updatedUser = {
            ...storedUser,
            profile_visibility: settings.profileVisibility,
            profileVisibility: settings.profileVisibility,
          };
          localStorage.setItem('fortaa_user', JSON.stringify(updatedUser));
        } catch (apiErr) {
          console.warn('Could not save privacy settings to server:', apiErr);
        }
      }

      toast.success(
        activeTab === 'notifications'
          ? 'Notification settings saved successfully! 🔔'
          : `Privacy settings updated to ${settings.profileVisibility === 'public' ? 'Public' : settings.profileVisibility === 'connections' ? 'Connections Only' : 'Private'}! 🔒`
      );
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleCancel = () => {
    // Reset to last saved
    try {
      const saved = localStorage.getItem('fortaa_user_settings');
      setSettings(saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS);
      toast('Changes reverted', { icon: '↩️' });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="set-page-root">
      {/* Global Header */}
      <UserHeader
        user={storedUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="set-main-layout">
        {/* Left Sidebar */}
        <UserSidebar
          activeTab="Settings"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Content Container */}
        <main className="set-content-container">
          <div className="set-card-box">
            {/* Top Tab Switcher */}
            <div className="set-tabs-header">
              <button
                type="button"
                className={`set-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notification Settings</span>
              </button>

              <button
                type="button"
                className={`set-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => handleTabChange('privacy')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Privacy Settings</span>
              </button>
            </div>

            {/* TAB 1: NOTIFICATION SETTINGS (Image 2) */}
            {activeTab === 'notifications' && (
              <div className="set-section-body">
                <div className="set-section-title-row">
                  <h1 className="set-main-title">Notification Setting</h1>
                </div>

                <div className="set-items-list">
                  {/* 1. Email Notification */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Email Notification</h3>
                        <p className="set-item-sub">Receive updates via email</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={() => handleToggle('emailNotifications')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* 2. Push Notifications */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Push Notifications</h3>
                        <p className="set-item-sub">Get notified on your device</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={() => handleToggle('pushNotifications')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* 3. New Connection Alerts */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">New Connection Alerts</h3>
                        <p className="set-item-sub">When someone connect with you</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.newConnectionAlerts}
                        onChange={() => handleToggle('newConnectionAlerts')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* 4. Team Activity */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Team Activity</h3>
                        <p className="set-item-sub">Update from your team</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.teamActivity}
                        onChange={() => handleToggle('teamActivity')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* 5. Event Reminders */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                          <circle cx="12" cy="15" r="2" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Event Reminders</h3>
                        <p className="set-item-sub">Upcoming events and webinars</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.eventReminders}
                        onChange={() => handleToggle('eventReminders')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* 6. Marketing Updates */}
                  <div className="set-item-row">
                    <div className="set-item-left">
                      <div className="set-item-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A2CE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </div>
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Marketing Updates</h3>
                        <p className="set-item-sub">Product and promotional offers</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.marketingUpdates}
                        onChange={() => handleToggle('marketingUpdates')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="set-actions-row">
                  <button type="button" className="set-cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="set-save-btn" onClick={handleSave}>
                    Save Change
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PRIVACY SETTINGS (Image 3) */}
            {activeTab === 'privacy' && (
              <div className="set-section-body">
                <div className="set-section-title-row">
                  <button
                    type="button"
                    className="set-back-title-btn"
                    onClick={() => handleTabChange('notifications')}
                    title="Back to Notifications"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className="set-main-title">Privacy Settings</span>
                  </button>
                </div>

                {/* Profile Visibility */}
                <div className="set-privacy-block">
                  <h2 className="set-sub-heading">Profile Visibility</h2>

                  <div className="set-visibility-grid">
                    {/* Option 1: Public */}
                    <div
                      className={`set-vis-card ${settings.profileVisibility === 'public' ? 'selected' : ''}`}
                      onClick={() => handleVisibilityChange('public')}
                    >
                      <div className="set-radio-circle">
                        {settings.profileVisibility === 'public' && <div className="set-radio-dot" />}
                      </div>
                      <div className="set-vis-meta">
                        <h4 className="set-vis-title">Public</h4>
                        <p className="set-vis-desc">(Visible to everyone)</p>
                      </div>
                    </div>

                    {/* Option 2: Connections Only */}
                    <div
                      className={`set-vis-card ${settings.profileVisibility === 'connections' ? 'selected' : ''}`}
                      onClick={() => handleVisibilityChange('connections')}
                    >
                      <div className="set-radio-circle">
                        {settings.profileVisibility === 'connections' && <div className="set-radio-dot" />}
                      </div>
                      <div className="set-vis-meta">
                        <h4 className="set-vis-title">Connections Only</h4>
                        <p className="set-vis-desc">(Visible to your Connections)</p>
                      </div>
                    </div>

                    {/* Option 3: Only Me */}
                    <div
                      className={`set-vis-card ${settings.profileVisibility === 'private' ? 'selected' : ''}`}
                      onClick={() => handleVisibilityChange('private')}
                    >
                      <div className="set-radio-circle">
                        {settings.profileVisibility === 'private' && <div className="set-radio-dot" />}
                      </div>
                      <div className="set-vis-meta">
                        <h4 className="set-vis-title">Only Me</h4>
                        <p className="set-vis-desc">(Private)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Toggles */}
                <div className="set-items-list set-privacy-toggles-list">
                  {/* Show My Activity */}
                  <div className="set-item-row set-item-row-plain">
                    <div className="set-item-left">
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Show My Activity</h3>
                        <p className="set-item-sub">Allow others to see when I am active on the platform</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showMyActivity}
                        onChange={() => handleToggle('showMyActivity')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>

                  {/* Allow Messages */}
                  <div className="set-item-row set-item-row-plain">
                    <div className="set-item-left">
                      <div className="set-item-meta">
                        <h3 className="set-item-title">Allow Messages</h3>
                        <p className="set-item-sub">Allow direct messages from non- connections</p>
                      </div>
                    </div>
                    <label className="set-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowMessages}
                        onChange={() => handleToggle('allowMessages')}
                      />
                      <span className="set-toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="set-actions-row">
                  <button type="button" className="set-cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="set-save-btn" onClick={handleSave}>
                    Save Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <UserMobileBottomNav active="Settings" />
    </div>
  );
}
