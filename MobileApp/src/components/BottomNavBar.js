import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BottomNavBar({ activeTab, onSelectTab, unreadCount = 0 }) {
  const tabs = [
    { key: 'dashboard', label: 'Home', icon: 'home' },
    { key: 'leaders', label: 'Leaders', icon: 'users' },
    { key: 'messages', label: 'Messages', icon: 'message-circle', badge: unreadCount },
    { key: 'profile', label: 'Profile', icon: 'user' },
  ];

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#BE84FC', '#6420D6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeIconCircle}
                >
                  <Feather name={tab.icon} size={20} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={styles.iconBox}>
                  <Feather name={tab.icon} size={22} color="#64748B" />
                  {tab.badge && tab.badge > 0 ? (
                    <View style={styles.badgeBox}>
                      <Text style={styles.badgeText}>
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 4,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 64,
    shadowColor: '#34285B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECE7FA',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  iconBox: {
    position: 'relative',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconCircle: {
    width: 38,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6420D6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#6114D6',
  },
  badgeBox: {
    position: 'absolute',
    top: 2,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
