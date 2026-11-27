import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeUnreadCounts } from '../services/unreadCountService';

export default function MenuBottomSheet({
  visible,
  onClose,
  user,
  onSelectItem,
  onLogout,
}) {
  const userName = user?.name || 'Nilesh';
  const userRole = user?.designation || user?.accountType || 'Marketing';
  const userAvatar = user?.avatarUrl || user?.avatar_url;

  const [unreadCounts, setUnreadCounts] = useState({ notificationCount: 0, messageCount: 0 });

  useEffect(() => {
    const unsub = subscribeUnreadCounts((counts) => setUnreadCounts(counts));
    return () => unsub();
  }, []);

  const menuItems = [
    { key: 'home', label: 'Home', icon: 'home', iconFamily: 'Feather' },
    { key: 'profile', label: 'My Profile', icon: 'user', iconFamily: 'Feather' },
    { key: 'leaders', label: 'Leaders', icon: 'users', iconFamily: 'Feather' },
    { key: 'notifications', label: 'Notifications', icon: 'bell', iconFamily: 'Feather' },
    { key: 'promotions', label: 'Promotions', icon: 'tag', iconFamily: 'Feather' },
    { key: 'messages', label: 'Messages', icon: 'message-square', iconFamily: 'Feather' },
    { key: 'groups', label: 'Groups', icon: 'users', iconFamily: 'Feather' },
    { key: 'settings', label: 'Settings', icon: 'settings', iconFamily: 'Feather' },
    { key: 'support', label: 'Support', icon: 'headphones', iconFamily: 'Feather' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.sheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.handleBar} />

          {/* User Profile Mini Header */}
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userMeta}
              onPress={() => {
                onClose();
                onSelectItem('profile');
              }}
              activeOpacity={0.8}
            >
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('../../assets/dashboard/user_avatar_rahul.png')}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              )}
              <View style={styles.nameWrap}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userRole}>{userRole}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 2-Column Grid of Navigation Cards */}
          <ScrollView contentContainerStyle={styles.gridContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuCard}
                onPress={() => {
                  onClose();
                  onSelectItem(item.key);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconBox}>
                  <Feather name={item.icon} size={18} color="#FFFFFF" />
                  {item.key === 'notifications' && unreadCounts.notificationCount > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>
                        {unreadCounts.notificationCount > 99 ? '99+' : unreadCounts.notificationCount}
                      </Text>
                    </View>
                  )}
                  {item.key === 'messages' && unreadCounts.messageCount > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>
                        {unreadCounts.messageCount > 99 ? '99+' : unreadCounts.messageCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer: Log Out Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                onClose();
                onLogout();
              }}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#E11D48" />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  nameWrap: {
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  menuCard: {
    width: '48.2%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2E0362',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#F60808',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 11,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    height: 44,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
  },
});
