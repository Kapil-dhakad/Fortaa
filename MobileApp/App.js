import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeadersScreen from './src/screens/LeadersScreen';
import OpportunityScreen from './src/screens/OpportunityScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UserMobileBottomNav from './src/components/UserMobileBottomNav';
import MenuBottomSheet from './src/components/MenuBottomSheet';
import CreatePostModal from './src/components/CreatePostModal';
import {
  subscribeUnreadCounts,
  startUnreadCountPolling,
  stopUnreadCountPolling,
} from './src/services/unreadCountService';
import {
  saveUserSession,
  getUserSession,
  clearUserSession,
} from './src/services/authStorage';

export default function App() {
  // Auth state: 'loading' | 'login' | 'signup' | 'main'
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [user, setUser] = useState(null);

  // Restore persistent login session on app startup
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const savedUser = await getUserSession();
        if (isMounted) {
          if (savedUser && savedUser.id) {
            setUser(savedUser);
            setCurrentScreen('main');
          } else {
            setCurrentScreen('login');
          }
        }
      } catch (err) {
        if (isMounted) setCurrentScreen('login');
      }
    }
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tab State: 'home' | 'network' | 'opportunity' | 'messages' | 'profile' | 'notifications'
  const [activeTab, setActiveTab] = useState('home');
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [isInsideChat, setIsInsideChat] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({ notificationCount: 0, messageCount: 0 });

  useEffect(() => {
    if (user?.id) {
      startUnreadCountPolling(user.id);
    } else {
      stopUnreadCountPolling();
    }
    const unsub = subscribeUnreadCounts((counts) => setUnreadCounts(counts));
    return () => unsub();
  }, [user?.id]);

  const handleLoginSuccess = async (userData) => {
    const finalUser = userData?.user || userData;
    setUser(finalUser);
    await saveUserSession(finalUser);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const handleRegisterSuccess = async (userData) => {
    const finalUser = userData?.user || userData;
    setUser(finalUser);
    await saveUserSession(finalUser);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const handleLogout = async () => {
    stopUnreadCountPolling();
    await clearUserSession();
    setUser(null);
    setCurrentScreen('login');
    setActiveTab('home');
    setMenuSheetOpen(false);
    setActiveChatPartner(null);
    setIsInsideChat(false);
  };

  const handleSelectTab = (tab) => {
    if (tab === 'menu') {
      setMenuSheetOpen(true);
      return;
    }
    setActiveTab(tab);
    if (tab !== 'messages') {
      setActiveChatPartner(null);
    }
  };

  const handleSelectMenuItem = (key) => {
    setMenuSheetOpen(false);
    if (key === 'home') setActiveTab('home');
    else if (key === 'profile') setActiveTab('profile');
    else if (key === 'leaders') setActiveTab('network');
    else if (key === 'messages') setActiveTab('messages');
    else if (key === 'notifications') setActiveTab('notifications');
    else if (key === 'groups') setActiveTab('groups');
    else if (key === 'settings') setActiveTab('settings');
    else if (key === 'promotions') Alert.alert('Promotions', 'Exclusive promotions & offers');
    else if (key === 'support') Alert.alert('Support', '24/7 Live Support: support@fortaa.com');
  };

  // Open direct chat with leader
  const handleOpenChatWithLeader = (leader) => {
    setActiveChatPartner(leader);
    setActiveTab('messages');
  };

  if (currentScreen === 'loading') {
    return (
      <View style={[styles.container, styles.loadingSplash]}>
        <StatusBar style="light" />
        <Image
          source={require('./assets/icon.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. Auth Flow: Login Screen */}
      {currentScreen === 'login' && (
        <LoginScreen
          onNavigateToSignUp={() => setCurrentScreen('signup')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* 2. Auth Flow: Sign Up Screen */}
      {currentScreen === 'signup' && (
        <SignUpScreen
          onNavigateToLogin={() => setCurrentScreen('login')}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}

      {/* 3. Main Authenticated App Flow */}
      {currentScreen === 'main' && (
        <View style={styles.mainWrapper}>
          <View style={styles.tabContent}>
            {/* Screen 1: Home Feed */}
            {activeTab === 'home' && (
              <DashboardScreen
                user={user}
                feedRefreshKey={feedRefreshKey}
                onNavigateTab={(tab) => handleSelectTab(tab)}
                onNavigateToMessages={(partner) => {
                  if (partner && partner.id) {
                    setActiveChatPartner(partner);
                  }
                  setActiveTab('messages');
                }}
                onNavigateToProfile={() => setActiveTab('profile')}
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 2: Network / Leaders */}
            {activeTab === 'network' && (
              <LeadersScreen
                currentUser={user}
                onOpenChat={handleOpenChatWithLeader}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToProfile={() => setActiveTab('profile')}
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 3: Opportunity */}
            {activeTab === 'opportunity' && (
              <OpportunityScreen
                user={user}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToProfile={() => setActiveTab('profile')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 4: Messages */}
            {activeTab === 'messages' && (
              <MessagesScreen
                currentUser={user}
                activeChatPartner={activeChatPartner}
                onBackToConversations={() => {
                  setActiveChatPartner(null);
                  setIsInsideChat(false);
                }}
                onChatPartnerOpen={(partner) => setIsInsideChat(!!partner)}
              />
            )}

            {/* Screen 5: Profile */}
            {activeTab === 'profile' && (
              <ProfileScreen
                user={user}
                onUpdateUser={async (updated) => {
                  setUser(updated);
                  await saveUserSession(updated);
                }}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 6: Notifications */}
            {activeTab === 'notifications' && (
              <NotificationsScreen
                user={user}
                onNavigateBack={() => setActiveTab('dashboard')}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToProfile={() => setActiveTab('profile')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 7: Groups */}
            {activeTab === 'groups' && (
              <GroupsScreen
                user={user}
                onOpenGroupChat={(groupContact) => {
                  setActiveChatPartner(groupContact);
                  setActiveTab('messages');
                }}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToProfile={() => setActiveTab('profile')}
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 8: Settings (Web Mobile Responsive Match) */}
            {activeTab === 'settings' && (
              <SettingsScreen
                user={user}
                onNavigateToMessages={() => setActiveTab('messages')}
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onNavigateToProfile={() => setActiveTab('profile')}
                onLogout={handleLogout}
                onBack={() => setActiveTab('home')}
              />
            )}
          </View>

          {/* Docked Mobile Bottom Navigation Bar with FAB (+) - hidden inside active conversation like WhatsApp */}
          {!(activeTab === 'messages' && isInsideChat) && (
            <UserMobileBottomNav
              activeTab={activeTab === 'notifications' || activeTab === 'groups' ? 'menu' : activeTab}
              onSelectTab={(tab) => {
                setIsInsideChat(false);
                handleSelectTab(tab);
              }}
              onPlusClick={() => setCreatePostModalOpen(true)}
              unreadTotalCount={unreadCounts.notificationCount + unreadCounts.messageCount}
            />
          )}

          {/* Slide-up Menu Drawer Sheet */}
          <MenuBottomSheet
            visible={menuSheetOpen}
            onClose={() => setMenuSheetOpen(false)}
            user={user}
            onSelectItem={handleSelectMenuItem}
            onLogout={handleLogout}
          />

          {/* Global Create Post Modal from FAB (+) */}
          <CreatePostModal
            visible={createPostModalOpen}
            onClose={() => setCreatePostModalOpen(false)}
            user={user}
            onPostCreated={(post) => {
              setFeedRefreshKey((k) => k + 1);
              setActiveTab('home');
              const msg = post?.content ? 'Your post is now live in the network feed!' : 'Post published!';
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.alert(`Post Published 🎉\n${msg}`);
              } else {
                Alert.alert('Post Published 🎉', msg);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingSplash: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E0B4B',
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabContent: {
    flex: 1,
  },
});
