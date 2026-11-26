import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
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

export default function App() {
  // Auth state: 'login' | 'signup' | 'main'
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);

  // Tab State: 'home' | 'network' | 'opportunity' | 'messages' | 'profile' | 'notifications'
  const [activeTab, setActiveTab] = useState('home');
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setActiveTab('home');
    setMenuSheetOpen(false);
    setActiveChatPartner(null);
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
                onNavigateTab={(tab) => handleSelectTab(tab)}
                onNavigateToMessages={() => setActiveTab('messages')}
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
                onBackToConversations={() => setActiveChatPartner(null)}
              />
            )}

            {/* Screen 5: Profile */}
            {activeTab === 'profile' && (
              <ProfileScreen
                user={user}
                onUpdateUser={(updated) => setUser(updated)}
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

          {/* Docked Mobile Bottom Navigation Bar with FAB (+) */}
          <UserMobileBottomNav
            activeTab={activeTab === 'notifications' || activeTab === 'groups' ? 'menu' : activeTab}
            onSelectTab={handleSelectTab}
            onPlusClick={() => setCreatePostModalOpen(true)}
          />

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
              Alert.alert('Post Created 🎉', post.text);
              setActiveTab('home');
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
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabContent: {
    flex: 1,
  },
});
