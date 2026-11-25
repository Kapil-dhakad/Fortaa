import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserHeader({
  user,
  searchQuery = '',
  onSearchChange,
  onNavigateToMessages,
  onNavigateToNotifications,
  onNavigateToProfile,
  onLogout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const displayName = user?.name || 'Nilesh';
  const displayRole = user?.designation || user?.accountType || 'Marketing';

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#4E1AD9', '#320CA0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        {/* Top Bar Row: Logo Pill (Left) + Bell, Message, Avatar (Right) */}
        <View style={styles.topRow}>
          {/* Logo Card Pill (White background with Fortaa logo & tagline) */}
          <View style={styles.brandPill}>
            <Image
              source={require('../../assets/figma/logo_icon_img.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <View style={styles.logoTextWrap}>
              <Image
                source={require('../../assets/figma/logo_text_img.png')}
                style={styles.logoWord}
                resizeMode="contain"
              />
              <Text style={styles.logoTagline}>Discover, easy and Grow</Text>
            </View>
          </View>

          {/* Right Action Icons: Bell, Message, Avatar */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onNavigateToNotifications}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onNavigateToMessages}
              activeOpacity={0.7}
            >
              <Feather name="message-square" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* User Profile Avatar with dropdown trigger */}
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => setProfileDropdownOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/dashboard/user_avatar_rahul.png')}
                style={styles.userAvatarImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={17} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, posts, companies, products, opportunities..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => onSearchChange && onSearchChange('')}>
              <Feather name="x" size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Profile Dropdown Menu (Screenshot 5 Match) */}
      {profileDropdownOpen && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setProfileDropdownOpen(false)}
            activeOpacity={1}
          />
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownUserRow}>
              <Image
                source={require('../../assets/dashboard/user_avatar_rahul.png')}
                style={styles.dropdownAvatar}
              />
              <View style={styles.dropdownUserMeta}>
                <Text style={styles.dropdownUserName}>{displayName}</Text>
                <Text style={styles.dropdownUserRole}>{displayRole}</Text>
              </View>
            </View>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileDropdownOpen(false);
                if (onNavigateToProfile) onNavigateToProfile();
              }}
              activeOpacity={0.7}
            >
              <Feather name="user" size={17} color="#475569" />
              <Text style={styles.dropdownItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileDropdownOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Feather name="settings" size={17} color="#475569" />
              <Text style={styles.dropdownItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownLogoutBtn}
              onPress={() => {
                setProfileDropdownOpen(false);
                if (onLogout) onLogout();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.logoutIconBox}>
                <Feather name="log-out" size={16} color="#DC2626" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    zIndex: 100,
    position: 'relative',
  },
  gradientBg: {
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 42),
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  logoIcon: {
    width: 24,
    height: 24,
  },
  logoTextWrap: {
    justifyContent: 'center',
  },
  logoWord: {
    width: 68,
    height: 16,
  },
  logoTagline: {
    fontSize: 7.5,
    color: '#34285B',
    letterSpacing: 0.2,
    fontWeight: '600',
    marginTop: -1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BE84FC',
    overflow: 'hidden',
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
  },

  /* Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E1B4B',
    padding: 0,
  },

  /* Dropdown Menu */
  dropdownOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 84 : 74,
    right: 12,
    zIndex: 9999,
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    width: 210,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ECEAF5',
  },
  dropdownUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  dropdownUserMeta: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dropdownUserRole: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  logoutIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
