import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUserProfileApi, toggleFollowApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function LeaderProfileModal({
  visible,
  onClose,
  leaderId: leaderIdProp,
  leaderName: leaderNameProp,
  leader, // full leader object (optional — from LeadersScreen card tap)
  currentUser,
  onOpenChat,
}) {
  // Support both direct leader object AND leaderId+leaderName props
  const leaderId = leaderIdProp || leader?.id;
  const leaderName = leaderNameProp || leader?.name;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (visible) {
      if (leaderId) {
        // If we have a leader object, pre-populate profile immediately
        if (leader) {
          setProfile({
            id: leader.id,
            name: leader.name,
            designation: leader.designation || leader.accountTypeName || leader.role,
            company_brand: leader.companyBrand || leader.company_brand,
            location: leader.city || leader.location,
            bio: leader.bio || '',
            followers_count: leader.followers_count !== undefined ? leader.followers_count : (leader.followers ?? 0),
            following_count: leader.following_count !== undefined ? leader.following_count : (leader.following ?? 0),
            posts_count: leader.posts_count !== undefined ? leader.posts_count : (leader.posts ?? 0),
            avatar_url: leader.avatarUrl || leader.avatar_url || leader.avatar,
            cover_url: leader.cover_url || leader.cover,
            skills: leader.skills,
            is_following: leader.is_following || leader.follow_status === 'accepted',
          });
          setIsFollowing(!!(leader.is_following || leader.follow_status === 'accepted'));
        }
        loadProfile();
      }
    } else {
      setProfile(null);
    }
  }, [visible, leaderId]);

  const loadProfile = async () => {
    if (!leaderId) return;
    try {
      setLoading(!leader); // Only show full loading if no pre-data
      const data = await fetchUserProfileApi(leaderId);
      if (data) {
        setProfile(data);
        setIsFollowing(!!data.is_following);
      } else if (!leader) {
        // Fallback basic profile
        setProfile({
          id: leaderId,
          name: leaderName || 'Fortaa Leader',
          designation: 'Senior Leader',
          company_brand: 'Business Enterprise',
          location: 'India',
          bio: 'Building network excellence and empowering leaders on Fortaa.',
          followers_count: 142,
          following_count: 88,
          posts_count: 24,
        });
      }
    } catch (err) {
      console.warn('Load leader profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in to follow leaders.');
      return;
    }
    const nextStatus = !isFollowing;
    setIsFollowing(nextStatus);
    try {
      await toggleFollowApi(leaderId, currentUser.id);
      Alert.alert(
        nextStatus ? 'Follow Request Sent ✨' : 'Unfollowed',
        nextStatus
          ? `You are now following ${profile?.name || leaderName || 'this leader'}!`
          : `Unfollowed ${profile?.name || leaderName || 'this leader'}.`
      );
    } catch (err) {
      console.warn('Follow error:', err);
    }
  };

  if (!visible) return null;

  const displayName = profile?.name || leaderName || 'Fortaa Leader';
  const displayRole = profile?.designation || profile?.role || 'Senior Leader';
  const displayCompany = profile?.company_brand || profile?.business_name || profile?.companyBrand || 'Enterprise';
  const displayAvatar = profile?.avatar_url || profile?.avatarUrl;
  const initial = displayName[0].toUpperCase();

  const skillsList = Array.isArray(profile?.skills)
    ? profile.skills
    : typeof profile?.skills === 'string'
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Leadership', 'Marketing', 'Direct Sales', 'Team Building'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.sheetHandle} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={20} color="#1E1B4B" />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#5321E8" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Cover Banner Card */}
              <View style={styles.coverCard}>
                <Image
                  source={require('../../assets/dashboard/profile_cover_purple.png')}
                  style={styles.coverImg}
                  resizeMode="cover"
                />

                {/* Avatar with Ring */}
                <View style={styles.avatarWrap}>
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={styles.avatarImg} />
                  ) : (
                    <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </LinearGradient>
                  )}
                  {/* Verified Tick */}
                  <View style={styles.verifiedBadge}>
                    <Feather name="check" size={11} color="#5321E8" />
                  </View>
                </View>

                {/* Name & Role on Cover */}
                <Text style={styles.profileName}>{displayName}</Text>

                {/* Company & Role Badge */}
                <View style={styles.roleBadgePill}>
                  <Text style={styles.roleBadgeCompany}>💎 {displayCompany}</Text>
                  <Text style={styles.roleBadgePipe}>|</Text>
                  <Text style={styles.roleBadgeDesignation}>{displayRole}</Text>
                </View>
              </View>

              {/* Stats Bar (Followers, Following, Posts) */}
              <View style={styles.statsBar}>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{profile?.followers_count || 142}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{profile?.following_count || 88}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{profile?.posts_count || 24}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>

              {/* Main Action Buttons: Follow / Following & Message */}
              {currentUser?.id && Number(currentUser.id) !== Number(leaderId) && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.btnFollow, isFollowing && styles.btnFollowing]}
                    onPress={handleToggleFollow}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isFollowing ? 'checkmark-circle' : 'person-add'}
                      size={16}
                      color={isFollowing ? '#5321E8' : '#FFFFFF'}
                    />
                    <Text style={[styles.btnFollowText, isFollowing && styles.btnFollowingText]}>
                      {isFollowing ? 'Following' : 'Follow Request'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnMessage}
                    onPress={() => {
                      onClose();
                      if (onOpenChat) onOpenChat(profile || { id: leaderId, name: displayName });
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="message-circle" size={16} color="#5321E8" />
                    <Text style={styles.btnMessageText}>Message</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bio Section */}
              <View style={styles.bioCard}>
                <Text style={styles.sectionHeaderTitle}>About</Text>
                <Text style={styles.bioText}>
                  {profile?.bio ||
                    'Professional Network Leader dedicated to building high-performance sales distribution teams and mentorship across India.'}
                </Text>

                {profile?.location ? (
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={14} color="#64748B" />
                    <Text style={styles.locationText}>{profile.location}</Text>
                  </View>
                ) : null}
              </View>

              {/* Skills Chips */}
              <View style={styles.skillsCard}>
                <Text style={styles.sectionHeaderTitle}>Skills & Expertise</Text>
                <View style={styles.chipsWrap}>
                  {skillsList.map((skill, idx) => (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '85%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 12,
  },
  coverCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    padding: 16,
    backgroundColor: '#0F092A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  coverImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  avatarWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: 10,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#334155',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5321E8',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 10, 54, 0.85)',
    borderWidth: 1,
    borderColor: '#6D28D9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeCompany: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' },
  roleBadgePipe: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  roleBadgeDesignation: { fontSize: 11.5, fontWeight: '600', color: '#C4B5FD' },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCol: { alignItems: 'center' },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#F1F5F9' },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnFollow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#5321E8',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#5321E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnFollowing: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5321E8',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnFollowText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  btnFollowingText: { color: '#5321E8' },
  btnMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  btnMessageText: { fontSize: 13.5, fontWeight: '700', color: '#5321E8' },

  bioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  bioText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },

  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
