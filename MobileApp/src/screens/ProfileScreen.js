import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';

const POST_TABS = ['All posts', 'Network', 'Followers', 'Groups', 'Following'];

export default function ProfileScreen({
  user,
  onNavigateToMessages,
  onNavigateToNotifications,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostTab, setActivePostTab] = useState('All posts');

  const userName = user?.name || 'Nilesh';
  const userCompany = user?.company_brand || 'shivkripa traders';
  const userRole = user?.designation || user?.accountType || 'Marketing';
  const userHandle = user?.email
    ? `@${user.email.split('@')[0]}`
    : '@kapildhakad1709';
  const userEmail = user?.email || 'kapildhakad1709@gmail.com';
  const userCity = user?.city || 'Bhopal';

  return (
    <View style={styles.container}>
      {/* 1. Purple Header Bar */}
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={() => {}}
        onLogout={onLogout}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Cover Banner Card (Purple Mountain Background) */}
        <View style={styles.coverCard}>
          <Image
            source={require('../../assets/dashboard/profile_cover_purple.png')}
            style={styles.coverBgImg}
            resizeMode="cover"
          />

          {/* Edit Profile Button in Top Right */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => Alert.alert('Edit Profile', 'Profile editor opening...')}
            activeOpacity={0.85}
          >
            <Feather name="edit-3" size={13} color="#1E1B4B" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Avatar with Verified Tick */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {(userName[0] || 'N').toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
            <View style={styles.verifiedTick}>
              <Feather name="check" size={9} color="#5321E8" />
            </View>
          </View>

          {/* User Details */}
          <Text style={styles.profileName}>{userName}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.companyBadgePill}>
              <Text style={styles.diamondIcon}>💎</Text>
              <Text style={styles.companyBadgeText}>{userCompany}</Text>
              <Text style={styles.dividerPipe}> | </Text>
              <Text style={styles.roleBadgeText}>{userRole}</Text>
            </View>
          </View>

          <Text style={styles.userHandleText}>{userHandle}</Text>
        </View>

        {/* 3. Profile Complete Prompt */}
        <TouchableOpacity style={styles.promptCard} activeOpacity={0.8}>
          <Text style={styles.lightningIcon}>⚡</Text>
          <View style={styles.promptTextWrap}>
            <Text style={styles.promptText}>
              <Text style={styles.promptBold}>Complete your profile</Text> — Add photo, bio &
              skills to get{' '}
              <Text style={styles.promptBold}>3x more visibility</Text> in the network
            </Text>
          </View>
          <Text style={styles.promptLink}>Complete →</Text>
        </TouchableOpacity>

        {/* 4. Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Feather name="users" size={14} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="user-check" size={14} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="link" size={14} color="#059669" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Network</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="message-square" size={14} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* 5. About Me Section */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>About Me</Text>

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.addBioPlaceholder}>
              + Add a short bio or leadership quote...
            </Text>
          </TouchableOpacity>

          <View style={styles.infoMetaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaValue}>{userCity}</Text>
          </View>

          <View style={styles.infoMetaRow}>
            <Text style={styles.metaIcon}>✉️</Text>
            <Text style={styles.metaValue}>{userEmail}</Text>
          </View>

          <View style={styles.sectionDivider} />

          {/* Skills */}
          <Text style={styles.subHeading}>Skills</Text>
          <TouchableOpacity
            style={styles.addSkillBtn}
            onPress={() => Alert.alert('Add Skills', 'Add your key professional skills')}
            activeOpacity={0.7}
          >
            <Text style={styles.addSkillText}>+ Add Skills</Text>
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          {/* My Achievements */}
          <Text style={styles.subHeading}>My Achievements</Text>
          <View style={styles.achieveRow}>
            <View style={styles.achievePill}>
              <View style={styles.achieveDot} />
              <Text style={styles.achieveText}>Top performer</Text>
            </View>
            <View style={styles.achievePill}>
              <View style={styles.achieveDot} />
              <Text style={styles.achieveText}>Community Star</Text>
            </View>
          </View>
        </View>

        {/* 6. Posts Section with Tabs */}
        <View style={styles.postsSectionCard}>
          {/* Posts Tab Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.postsTabContent}
          >
            {POST_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.postsTab}
                onPress={() => setActivePostTab(tab)}
              >
                <Text style={[styles.postsTabText, activePostTab === tab && styles.postsTabTextActive]}>
                  {tab}
                </Text>
                {activePostTab === tab && <View style={styles.postsTabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.postsTabDivider} />

          {/* Empty State */}
          <View style={styles.postsEmptyState}>
            <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={styles.postsEmptyIconBg}>
              <Feather name="edit-3" size={32} color="#8B5CF6" />
            </LinearGradient>
            <Text style={styles.postsEmptyTitle}>No posts published yet</Text>
            <Text style={styles.postsEmptySubtitle}>
              Share your ideas, success stories and{'\n'}updates with your network
            </Text>
            <TouchableOpacity
              style={styles.createPostDashBtn}
              onPress={() => Alert.alert('Create Post', 'Go to Dashboard to create a post')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#DC3AEE', '#5321E8']}
                style={styles.createPostDashGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="layout" size={14} color="#fff" />
                <Text style={styles.createPostDashText}>Create a Post on Dashboard →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 10,
  },

  /* Cover Banner Card */
  coverCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    padding: 16,
    backgroundColor: '#0F092A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    minHeight: 180,
  },
  coverBgImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  editProfileBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  editProfileText: { fontSize: 11, fontWeight: '700', color: '#1E1B4B' },

  avatarWrap: { position: 'relative', width: 68, height: 68, marginBottom: 10, marginTop: 8 },
  avatarRing: { width: 68, height: 68, borderRadius: 34, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarInitial: { fontSize: 24, fontWeight: '900', color: '#fff' },
  verifiedTick: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5321E8',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', marginBottom: 8 },
  companyBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 10, 54, 0.85)',
    borderWidth: 1,
    borderColor: '#6D28D9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  diamondIcon: { fontSize: 11 },
  companyBadgeText: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' },
  dividerPipe: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  roleBadgeText: { fontSize: 11.5, fontWeight: '600', color: '#C4B5FD' },
  userHandleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  /* Prompt Card */
  promptCard: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lightningIcon: { fontSize: 16 },
  promptTextWrap: { flex: 1 },
  promptText: { fontSize: 11.5, color: '#4C1D95', lineHeight: 16 },
  promptBold: { fontWeight: '700' },
  promptLink: { fontSize: 11.5, fontWeight: '700', color: '#6D28D9' },

  /* Stats Row */
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500' },

  /* About Me Section */
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
  },
  aboutHeading: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  addBioPlaceholder: { fontSize: 12.5, fontStyle: 'italic', color: '#64748B', marginBottom: 6 },
  infoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { fontSize: 13 },
  metaValue: { fontSize: 12.5, color: '#334155', fontWeight: '500' },
  sectionDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  subHeading: { fontSize: 13, fontWeight: '700', color: '#111827' },
  addSkillBtn: {
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  addSkillText: { fontSize: 11.5, fontWeight: '700', color: '#6D28D9' },
  achieveRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  achievePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  achieveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' },
  achieveText: { fontSize: 11.5, fontWeight: '600', color: '#6D28D9' },

  /* Posts Section */
  postsSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  postsTabContent: {
    paddingHorizontal: 4,
    paddingTop: 4,
    flexDirection: 'row',
  },
  postsTab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  postsTabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  postsTabTextActive: { color: '#5321E8', fontWeight: '700' },
  postsTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 2.5,
    backgroundColor: '#5321E8',
    borderRadius: 2,
  },
  postsTabDivider: { height: 1, backgroundColor: '#F3F4F6' },

  /* Posts Empty State */
  postsEmptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  postsEmptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  postsEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  postsEmptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  createPostDashBtn: { borderRadius: 25, overflow: 'hidden', marginTop: 6 },
  createPostDashGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createPostDashText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
