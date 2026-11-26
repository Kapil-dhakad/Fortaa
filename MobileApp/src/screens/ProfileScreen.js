import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';
import EditProfileModal from '../components/EditProfileModal';
import { fetchUserProfileApi, fetchUserStatsApi, fetchUserPostsApi } from '../services/api';

const { width } = Dimensions.get('window');

const POST_TABS = ['All posts', 'Network', 'Followers', 'Groups', 'Following'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ProfileScreen({
  user,
  onUpdateUser,
  onNavigateToMessages,
  onNavigateToNotifications,
  onNavigateToSettings,
  onLogout,
}) {
  const [profileUser, setProfileUser] = useState(user || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostTab, setActivePostTab] = useState('All posts');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, network: 0 });
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load profile + stats
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [profile, fetchedStats, posts] = await Promise.all([
        fetchUserProfileApi(user.id),
        fetchUserStatsApi(user.id),
        fetchUserPostsApi(user.id),
      ]);
      if (profile) setProfileUser((prev) => ({ ...prev, ...profile }));
      if (fetchedStats) setStats(fetchedStats);
      setMyPosts(Array.isArray(posts) ? posts : []);
    } catch (e) {
      console.warn('ProfileScreen loadProfile error:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) setProfileUser(user);
    loadProfile();
  }, [user, loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleProfileUpdated = (updated) => {
    setProfileUser(updated);
    if (onUpdateUser) onUpdateUser(updated);
    loadProfile();
  };

  const userName = profileUser?.name || 'Fortaa Leader';
  const userCompany =
    profileUser?.companyBrand ||
    profileUser?.company_brand ||
    profileUser?.businessName ||
    'Business Enterprise';
  const userRole = profileUser?.designation || profileUser?.accountType || 'Senior Leader';
  const userHandle = profileUser?.username
    ? `@${profileUser.username}`
    : profileUser?.email
    ? `@${profileUser.email.split('@')[0]}`
    : '@leader';
  const userEmail = profileUser?.email || '';
  const userCity = profileUser?.location || profileUser?.city || 'India';
  const userBio = profileUser?.bio || '';
  const userAvatar = profileUser?.avatarUrl || profileUser?.avatar_url;
  const skills = Array.isArray(profileUser?.skills)
    ? profileUser.skills
    : typeof profileUser?.skills === 'string'
    ? profileUser.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const followerCount = stats.followers || profileUser?.followers_count || profileUser?.followersCount || 0;
  const followingCount = stats.following || profileUser?.following_count || profileUser?.followingCount || 0;
  const postsCount = myPosts.length || stats.posts || profileUser?.posts_count || 0;
  const networkCount = stats.network || profileUser?.network_count || 0;

  // Filter posts by tab
  const filteredPosts = myPosts; // For now show all; can filter by tab later

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5321E8']} />}
      >
        {/* 2. Cover Banner Card */}
        <View style={styles.coverCard}>
          <Image
            source={require('../../assets/dashboard/profile_cover_purple.png')}
            style={styles.coverBgImg}
            resizeMode="cover"
          />

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.85}
          >
            <Feather name="edit-3" size={13} color="#1E1B4B" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Settings button */}
          {onNavigateToSettings && (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={onNavigateToSettings}
              activeOpacity={0.85}
            >
              <Feather name="settings" size={14} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Avatar with Verified Tick */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.avatarRealImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{(userName[0] || 'N').toUpperCase()}</Text>
                )}
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
        {!userBio || !userAvatar ? (
          <TouchableOpacity
            style={styles.promptCard}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.lightningIcon}>⚡</Text>
            <View style={styles.promptTextWrap}>
              <Text style={styles.promptText}>
                <Text style={styles.promptBold}>Complete your profile</Text> — Add photo, bio &
                skills to get{' '}
                <Text style={styles.promptBold}>3x more visibility</Text> in the network
              </Text>
            </View>
            <Text style={styles.promptLink}>Edit →</Text>
          </TouchableOpacity>
        ) : null}

        {/* 4. Stats Row — REAL DATA */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Feather name="users" size={14} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>{followerCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="user-check" size={14} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{followingCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="link" size={14} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{networkCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Network</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="file-text" size={14} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{postsCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* 5. About Me Section */}
        <View style={styles.aboutCard}>
          <View style={styles.aboutHeaderRow}>
            <Text style={styles.aboutHeading}>About Me</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(true)}>
              <Feather name="edit-2" size={15} color="#5321E8" />
            </TouchableOpacity>
          </View>

          {userBio ? (
            <Text style={styles.bioText}>{userBio}</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditModalOpen(true)} activeOpacity={0.7}>
              <Text style={styles.addBioPlaceholder}>
                + Add a short bio or leadership quote...
              </Text>
            </TouchableOpacity>
          )}

          {userCity ? (
            <View style={styles.infoMetaRow}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaValue}>{userCity}</Text>
            </View>
          ) : null}

          {userEmail ? (
            <View style={styles.infoMetaRow}>
              <Text style={styles.metaIcon}>✉️</Text>
              <Text style={styles.metaValue}>{userEmail}</Text>
            </View>
          ) : null}

          {/* Mobile number if available */}
          {(profileUser?.mobileNumber || profileUser?.mobile_number) ? (
            <View style={styles.infoMetaRow}>
              <Text style={styles.metaIcon}>📱</Text>
              <Text style={styles.metaValue}>{profileUser.mobileNumber || profileUser.mobile_number}</Text>
            </View>
          ) : null}

          <View style={styles.sectionDivider} />

          {/* Skills */}
          <View style={styles.aboutHeaderRow}>
            <Text style={styles.subHeading}>Skills & Expertise</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(true)}>
              <Feather name="plus-circle" size={15} color="#5321E8" />
            </TouchableOpacity>
          </View>

          {skills.length > 0 ? (
            <View style={styles.skillsChipsWrap}>
              {skills.map((s, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{s}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addSkillBtn}
              onPress={() => setEditModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addSkillText}>+ Add Skills</Text>
            </TouchableOpacity>
          )}

          {/* Social Links */}
          {(profileUser?.socialLinks?.linkedin || profileUser?.socialLinks?.instagram || profileUser?.websiteSocial) ? (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.subHeading}>Social Links</Text>
              <View style={styles.socialLinksRow}>
                {profileUser?.socialLinks?.linkedin ? (
                  <View style={styles.socialLinkPill}>
                    <Ionicons name="logo-linkedin" size={14} color="#0A66C2" />
                    <Text style={styles.socialLinkText} numberOfLines={1}>LinkedIn</Text>
                  </View>
                ) : null}
                {profileUser?.socialLinks?.instagram ? (
                  <View style={styles.socialLinkPill}>
                    <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                    <Text style={styles.socialLinkText}>Instagram</Text>
                  </View>
                ) : null}
                {profileUser?.websiteSocial ? (
                  <View style={styles.socialLinkPill}>
                    <Feather name="globe" size={14} color="#5321E8" />
                    <Text style={styles.socialLinkText} numberOfLines={1}>Website</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}
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

          {/* Posts List or Empty */}
          {postsLoading ? (
            <ActivityIndicator size="small" color="#5321E8" style={{ marginVertical: 32 }} />
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <View key={post.id} style={styles.postItem}>
                {post.media_url ? (
                  <Image source={{ uri: post.media_url }} style={styles.postThumb} />
                ) : null}
                <View style={styles.postItemBody}>
                  <Text style={styles.postItemText} numberOfLines={3}>
                    {post.content || post.text || ''}
                  </Text>
                  <View style={styles.postItemMeta}>
                    <Text style={styles.postItemTime}>{timeAgo(post.created_at)}</Text>
                    <View style={styles.postItemStats}>
                      <Ionicons name="heart" size={12} color="#EF4444" />
                      <Text style={styles.postItemStatText}>{post.likes_count || 0}</Text>
                      <Feather name="message-circle" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
                      <Text style={styles.postItemStatText}>{post.comments_count || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
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
                onPress={() => Alert.alert('Create Post', 'Go to Dashboard tab to create a post')}
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
          )}
        </View>

        {/* 7. Quick Actions */}
        <View style={styles.quickActionsRow}>
          {onNavigateToSettings && (
            <TouchableOpacity style={styles.quickActionBtn} onPress={onNavigateToSettings} activeOpacity={0.8}>
              <Feather name="settings" size={16} color="#5321E8" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setEditModalOpen(true)} activeOpacity={0.8}>
            <Feather name="edit" size={16} color="#5321E8" />
            <Text style={styles.quickActionText}>Edit Profile</Text>
          </TouchableOpacity>
          {onLogout && (
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.logoutBtn]}
              onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: onLogout },
              ])}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={16} color="#EF4444" />
              <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ─── EDIT PROFILE MODAL ─── */}
      <EditProfileModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={profileUser}
        onProfileUpdated={handleProfileUpdated}
      />
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
    right: 56,
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
  settingsBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

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
    overflow: 'hidden',
  },
  avatarRealImg: { width: '100%', height: '100%' },
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
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bioText: { fontSize: 13, color: '#334155', lineHeight: 18, marginBottom: 6 },
  skillsChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillPill: {
    backgroundColor: '#F3F0FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  skillPillText: { fontSize: 12, color: '#5321E8', fontWeight: '600' },
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
  socialLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  socialLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  socialLinkText: { fontSize: 12, color: '#334155', fontWeight: '500' },

  /* Posts Section */
  postsSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  postsTabContent: { paddingHorizontal: 4, paddingTop: 4, flexDirection: 'row' },
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

  /* Post List Item */
  postItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
    alignItems: 'flex-start',
  },
  postThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  postItemBody: { flex: 1 },
  postItemText: { fontSize: 13, color: '#111827', lineHeight: 18, marginBottom: 6 },
  postItemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postItemTime: { fontSize: 11, color: '#9CA3AF' },
  postItemStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  postItemStatText: { fontSize: 11, color: '#6B7280', marginLeft: 2 },

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
  postsEmptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  createPostDashBtn: { borderRadius: 25, overflow: 'hidden', marginTop: 6 },
  createPostDashGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createPostDashText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Quick Actions */
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    minWidth: 100,
  },
  quickActionText: { fontSize: 13, fontWeight: '600', color: '#5321E8' },
  logoutBtn: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
});
