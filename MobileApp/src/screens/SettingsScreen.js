import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';
import { changePasswordApi } from '../services/api';

export default function SettingsScreen({
  user,
  onNavigateToMessages,
  onNavigateToNotifications,
  onNavigateToProfile,
  onLogout,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'privacy' | 'account'

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newConnectionAlerts, setNewConnectionAlerts] = useState(true);
  const [teamActivity, setTeamActivity] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState('public'); // 'public' | 'connections' | 'private'
  const [showMyActivity, setShowMyActivity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  // Change Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveNotifications = () => {
    Alert.alert('Settings Saved 🔔', 'Your notification preferences have been updated.');
  };

  const handleSavePrivacy = () => {
    const visibilityLabel =
      profileVisibility === 'public'
        ? 'Public'
        : profileVisibility === 'connections'
        ? 'Connections Only'
        : 'Private';
    Alert.alert('Privacy Updated 🔒', `Profile visibility is now set to ${visibilityLabel}.`);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await changePasswordApi({
        currentPassword,
        newPassword,
        userId: user?.id,
      });
      Alert.alert('Success 🎉', 'Password changed successfully!');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Password Change Failed', err.message || 'Please verify current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Local cache and temporary media have been cleared.');
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <UserHeader
        user={user}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      {/* Sub Header Title with Back Button */}
      <View style={styles.titleBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#1E1B4B" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleInfo}>
          <Text style={styles.screenHeading}>Settings</Text>
          <Text style={styles.screenSub}>Manage your account preferences & privacy</Text>
        </View>
      </View>

      {/* 2. Top Tabs Switcher (Matching Web Responsive) */}
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.7}
        >
          <Feather
            name="bell"
            size={16}
            color={activeTab === 'notifications' ? '#5321E8' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'privacy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.7}
        >
          <Feather
            name="lock"
            size={16}
            color={activeTab === 'privacy' ? '#5321E8' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          onPress={() => setActiveTab('account')}
          activeOpacity={0.7}
        >
          <Feather
            name="shield"
            size={16}
            color={activeTab === 'account' ? '#5321E8' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>
            Security
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* ─── TAB 1: NOTIFICATION SETTINGS ─── */}
        {activeTab === 'notifications' && (
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Notification Alerts</Text>
              <Text style={styles.sectionSubtitle}>Choose which notifications you receive</Text>
            </View>

            {/* Email Notification */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="mail" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDesc}>Receive critical account & network updates via email</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={emailNotifications ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            {/* Push Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="smartphone" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Real-time alerts on your device for likes & comments</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={pushNotifications ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            {/* Connection Alerts */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="user-plus" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>New Connection Alerts</Text>
                <Text style={styles.settingDesc}>When other leaders request to connect with you</Text>
              </View>
              <Switch
                value={newConnectionAlerts}
                onValueChange={setNewConnectionAlerts}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={newConnectionAlerts ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            {/* Team Activity */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="users" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Team Activity</Text>
                <Text style={styles.settingDesc}>Rank upgrades, new joiners in your downline</Text>
              </View>
              <Switch
                value={teamActivity}
                onValueChange={setTeamActivity}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={teamActivity ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            {/* Event Reminders */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="calendar" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Event Reminders</Text>
                <Text style={styles.settingDesc}>Alerts for registered webinars and business meetings</Text>
              </View>
              <Switch
                value={eventReminders}
                onValueChange={setEventReminders}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={eventReminders ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            {/* Marketing Updates */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="tag" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Promotions & Newsletters</Text>
                <Text style={styles.settingDesc}>Product offers and Fortaa feature announcements</Text>
              </View>
              <Switch
                value={marketingUpdates}
                onValueChange={setMarketingUpdates}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={marketingUpdates ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            <TouchableOpacity
              style={styles.btnSaveSettings}
              onPress={handleSaveNotifications}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSaveText}>Save Notification Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TAB 2: PRIVACY SETTINGS ─── */}
        {activeTab === 'privacy' && (
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Profile Visibility</Text>
              <Text style={styles.sectionSubtitle}>Control who can see your profile and leader details</Text>
            </View>

            {/* Public Option */}
            <TouchableOpacity
              style={[
                styles.visibilityCard,
                profileVisibility === 'public' && styles.visibilityCardSelected,
              ]}
              onPress={() => setProfileVisibility('public')}
              activeOpacity={0.7}
            >
              <View style={styles.visibilityCardRow}>
                <View style={styles.visibilityIconBox}>
                  <Feather name="globe" size={20} color="#5321E8" />
                </View>
                <View style={styles.visibilityMeta}>
                  <Text style={styles.visibilityTitle}>Public</Text>
                  <Text style={styles.visibilityDesc}>
                    Anyone on Fortaa can view your profile, company, and public posts
                  </Text>
                </View>
                <View style={[styles.radioCircle, profileVisibility === 'public' && styles.radioCircleSelected]}>
                  {profileVisibility === 'public' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Connections Only Option */}
            <TouchableOpacity
              style={[
                styles.visibilityCard,
                profileVisibility === 'connections' && styles.visibilityCardSelected,
              ]}
              onPress={() => setProfileVisibility('connections')}
              activeOpacity={0.7}
            >
              <View style={styles.visibilityCardRow}>
                <View style={styles.visibilityIconBox}>
                  <Feather name="users" size={20} color="#5321E8" />
                </View>
                <View style={styles.visibilityMeta}>
                  <Text style={styles.visibilityTitle}>Connections Only</Text>
                  <Text style={styles.visibilityDesc}>
                    Only members you have accepted connections with can view your profile
                  </Text>
                </View>
                <View style={[styles.radioCircle, profileVisibility === 'connections' && styles.radioCircleSelected]}>
                  {profileVisibility === 'connections' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Private Option */}
            <TouchableOpacity
              style={[
                styles.visibilityCard,
                profileVisibility === 'private' && styles.visibilityCardSelected,
              ]}
              onPress={() => setProfileVisibility('private')}
              activeOpacity={0.7}
            >
              <View style={styles.visibilityCardRow}>
                <View style={styles.visibilityIconBox}>
                  <Feather name="lock" size={20} color="#5321E8" />
                </View>
                <View style={styles.visibilityMeta}>
                  <Text style={styles.visibilityTitle}>Private</Text>
                  <Text style={styles.visibilityDesc}>
                    Hide your profile from leader directory and public search
                  </Text>
                </View>
                <View style={[styles.radioCircle, profileVisibility === 'private' && styles.radioCircleSelected]}>
                  {profileVisibility === 'private' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Activity Toggles */}
            <View style={[styles.settingRow, { marginTop: 14 }]}>
              <View style={styles.settingIconBox}>
                <Feather name="activity" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Show Activity Status</Text>
                <Text style={styles.settingDesc}>Allow connections to see when you are active online</Text>
              </View>
              <Switch
                value={showMyActivity}
                onValueChange={setShowMyActivity}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={showMyActivity ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Feather name="message-circle" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Direct Messages</Text>
                <Text style={styles.settingDesc}>Allow messages from leaders outside your network</Text>
              </View>
              <Switch
                value={allowMessages}
                onValueChange={setAllowMessages}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={allowMessages ? '#5321E8' : '#CBD5E1'}
              />
            </View>

            <TouchableOpacity
              style={styles.btnSaveSettings}
              onPress={handleSavePrivacy}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSaveText}>Save Privacy Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TAB 3: ACCOUNT & SECURITY ─── */}
        {activeTab === 'account' && (
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Account Security</Text>
              <Text style={styles.sectionSubtitle}>Manage password and session safety</Text>
            </View>

            <TouchableOpacity
              style={styles.accountActionRow}
              onPress={() => setPasswordModalOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconBox}>
                <Feather name="key" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingDesc}>Update your login credentials securely</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountActionRow}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconBox}>
                <Feather name="database" size={20} color="#5321E8" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Clear Cache</Text>
                <Text style={styles.settingDesc}>Free up local storage used for feed images</Text>
              </View>
              <Feather name="trash-2" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountActionRow, { borderBottomWidth: 0 }]}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="log-out" size={20} color="#EF4444" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Log Out</Text>
                <Text style={styles.settingDesc}>Sign out from this device</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerVersion}>
          <Text style={styles.footerVersionText}>FORTAA Mobile v1.0.0 · Build 2026</Text>
        </View>
      </ScrollView>

      {/* ─── CHANGE PASSWORD MODAL ─── */}
      <Modal
        visible={passwordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                placeholder="At least 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.btnModalSave}
                onPress={handleChangePassword}
                disabled={isUpdatingPassword}
                activeOpacity={0.85}
              >
                <Text style={styles.btnModalSaveText}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 12,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: { flex: 1 },
  screenHeading: { fontSize: 20, fontWeight: '800', color: '#1E1B4B' },
  screenSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 600,
    alignSelf: 'center',
    width: Platform.OS === 'web' ? 'calc(100% - 32px)' : undefined,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#F3F0FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#5321E8',
    fontWeight: '700',
  },

  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  sectionSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextWrap: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  settingDesc: { fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 16 },

  btnSaveSettings: {
    backgroundColor: '#5321E8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnSaveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  visibilityCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  visibilityCardSelected: {
    borderColor: '#5321E8',
    backgroundColor: '#FAF5FF',
  },
  visibilityCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityMeta: { flex: 1 },
  visibilityTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  visibilityDesc: { fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 16 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#5321E8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5321E8',
  },

  accountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },

  footerVersion: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerVersionText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1E1B4B' },
  modalBody: { gap: 10 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  btnModalSave: {
    backgroundColor: '#5321E8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnModalSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
