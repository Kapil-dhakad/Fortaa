import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getLeadersApi, toggleFollowApi } from '../services/api';
import UserHeader from '../components/UserHeader';
import LeaderProfileModal from '../components/LeaderProfileModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2;

const CATEGORY_TABS = [
  { id: 'all', label: 'All Leaders', icon: null },
  { id: 'top', label: 'Top Leaders', icon: '👑' },
  { id: 'diamond', label: 'Diamond', icon: '💎' },
  { id: 'platinum', label: 'Platinum', icon: '⭐' },
  { id: 'gold', label: 'Gold', icon: '🏆' },
  { id: 'silver', label: 'Silver', icon: '🥈' },
  { id: 'bronze', label: 'Bronze', icon: '🥉' },
];

const SCENIC_BANNERS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
];

const getLeaderTierInfo = (u) => {
  const roleText = `${u.role || ''} ${u.designation || ''} ${u.accountTypeName || ''}`.toLowerCase();
  if (roleText.includes('diamond')) {
    return {
      key: 'diamond',
      label: 'Diamond Leader',
      icon: '💎',
      gradient: ['#FF416C', '#FF4B2B'],
    };
  }
  if (roleText.includes('platinum')) {
    return {
      key: 'platinum',
      label: 'Platinum Leader',
      icon: '⭐',
      gradient: ['#4A00E0', '#8E2DE2'],
    };
  }
  if (roleText.includes('gold')) {
    return {
      key: 'gold',
      label: 'Gold Leader',
      icon: '🏆',
      gradient: ['#F59E0B', '#D97706'],
    };
  }
  if (roleText.includes('silver')) {
    return {
      key: 'silver',
      label: 'Silver Leader',
      icon: '🥈',
      gradient: ['#D946EF', '#9333EA'],
    };
  }
  if (roleText.includes('bronze')) {
    return {
      key: 'bronze',
      label: 'Bronze Leader',
      icon: '🥉',
      gradient: ['#B45309', '#78350F'],
    };
  }
  if (roleText.includes('admin') || roleText.includes('super admin')) {
    return {
      key: 'admin',
      label: u.designation || 'Admin',
      icon: '🛡️',
      gradient: ['#1E1B4B', '#3B82F6'],
    };
  }

  const rawRole = (u.designation || u.role || u.accountTypeName || '').trim();
  if (rawRole && rawRole.toLowerCase() !== 'user' && rawRole.toLowerCase() !== 'member') {
    return {
      key: 'leader',
      label: rawRole,
      icon: '⭐',
      gradient: ['#6220FE', '#8B5CF6'],
    };
  }

  return {
    key: 'member',
    label: 'Member',
    icon: '👤',
    gradient: ['#64748B', '#475569'],
  };
};

const formatCount = (n) => {
  const num = typeof n === 'number' ? n : parseInt(n, 10);
  if (isNaN(num) || num <= 0) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
};

export default function LeadersScreen({
  currentUser,
  onOpenChat,
  onNavigateToMessages,
  onNavigateToProfile,
  onLogout,
  onNavigateToNotifications,
}) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [followingIds, setFollowingIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [selectedLeader, setSelectedLeader] = useState(null);

  const fetchLeaders = async () => {
    try {
      const data = await getLeadersApi(currentUser?.id);
      const list = (data || []).filter(
        (u) =>
          u.id !== currentUser?.id &&
          String(u.id) !== String(currentUser?.id) &&
          (!currentUser?.email || u.email?.toLowerCase() !== currentUser.email.toLowerCase())
      );

      // Prepopulate follow status from API
      const initFollowing = new Set();
      list.forEach((u) => {
        if (u.follow_status === 'accepted') {
          initFollowing.add(u.id);
          initFollowing.add(Number(u.id));
        }
      });
      setFollowingIds(initFollowing);
      setLeaders(list);
    } catch (err) {
      console.warn('Error fetching leaders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, [currentUser?.id]);

  const filteredLeaders = useMemo(() => {
    let result = leaders.filter((u) => !dismissedIds.has(u.id) && !dismissedIds.has(Number(u.id)));

    // Category Tab Filter
    if (activeTab === 'top') {
      result = [...result].sort((a, b) => {
        const fA = typeof a.followers_count === 'number' ? a.followers_count : 0;
        const fB = typeof b.followers_count === 'number' ? b.followers_count : 0;
        return fB - fA;
      });
    } else if (activeTab !== 'all') {
      result = result.filter((u) => {
        const tier = getLeaderTierInfo(u);
        const roleText = `${u.role || ''} ${u.designation || ''} ${u.accountTypeName || ''}`.toLowerCase();
        return tier.key === activeTab || roleText.includes(activeTab.toLowerCase());
      });
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.designation || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q) ||
          (u.company_brand || u.companyBrand || '').toLowerCase().includes(q) ||
          (u.location || u.city || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [leaders, activeTab, searchQuery, dismissedIds]);

  const handleFollow = async (item) => {
    const id = item.id;
    const wasFollowing = followingIds.has(id) || followingIds.has(Number(id));

    // Optimistic toggle
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) {
        next.delete(id);
        next.delete(Number(id));
      } else {
        next.add(id);
        next.add(Number(id));
      }
      return next;
    });

    // Optimistically update followers_count in leaders list
    setLeaders((prev) =>
      prev.map((l) => {
        if (l.id === id || String(l.id) === String(id)) {
          const currentCount = typeof l.followers_count === 'number' ? l.followers_count : 0;
          return {
            ...l,
            followers_count: wasFollowing ? Math.max(0, currentCount - 1) : currentCount + 1,
            follow_status: wasFollowing ? 'none' : 'accepted',
          };
        }
        return l;
      })
    );

    try {
      await toggleFollowApi(id, currentUser?.id);
    } catch (err) {
      // Revert on error
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.add(id);
          next.add(Number(id));
        } else {
          next.delete(id);
          next.delete(Number(id));
        }
        return next;
      });
    }
  };

  const handleDismiss = (id) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      next.add(Number(id));
      return next;
    });
  };

  const renderLeaderCard = ({ item, index }) => {
    const isFollowing = followingIds.has(item.id) || followingIds.has(Number(item.id)) || item.follow_status === 'accepted';
    const tier = getLeaderTierInfo(item);

    const followers = item.followers_count !== undefined ? item.followers_count : (item.followers ?? 0);
    const following = item.following_count !== undefined ? item.following_count : (item.following ?? 0);
    const posts = item.posts_count !== undefined ? item.posts_count : (item.posts ?? 0);

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=6220FE&color=fff&size=150&bold=true`;
    const avatarUrl =
      item.avatar_url && !item.avatar_url.includes('user_avatar_rahul')
        ? (item.avatar_url.startsWith('http') ? item.avatar_url : `https://fortaa.com${item.avatar_url}`)
        : defaultAvatar;

    const coverBanner =
      item.cover_url && item.cover_url.startsWith('http')
        ? item.cover_url
        : SCENIC_BANNERS[index % SCENIC_BANNERS.length];

    const roleName = item.designation || item.role || item.accountTypeName || tier.label;
    const company = item.company_brand || item.companyBrand || '';
    const location = item.location || item.city || '';

    return (
      <TouchableOpacity
        style={styles.leaderCard}
        onPress={() => setSelectedLeader(item)}
        activeOpacity={0.92}
      >
        {/* Cover Photo Header */}
        <View style={styles.cardCover}>
          <Image
            source={{ uri: coverBanner }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss(item.id);
            }}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Feather name="x" size={13} color="#fff" />
          </TouchableOpacity>

          {/* Tier Badge */}
          <LinearGradient
            colors={tier.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roleBadge}
          >
            <Text style={styles.roleBadgeText} numberOfLines={1}>
              {tier.icon} {tier.label}
            </Text>
          </LinearGradient>

          {/* Avatar Ring overlapping cover bottom */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            </View>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.leaderName} numberOfLines={1}>
            {item.name || 'Fortaa Leader'}
          </Text>

          <Text style={styles.leaderRole} numberOfLines={1}>
            {roleName}
          </Text>

          {company ? (
            <View style={styles.metaRow}>
              <Feather name="briefcase" size={10} color="#8B5CF6" />
              <Text style={styles.leaderCompany} numberOfLines={1}>
                {company}
              </Text>
            </View>
          ) : null}

          {location ? (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={10} color="#9CA3AF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          {/* Real Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{formatCount(followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{formatCount(following)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{formatCount(posts)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={(e) => {
                e.stopPropagation();
                handleFollow(item);
              }}
              activeOpacity={0.85}
            >
              {isFollowing ? (
                <View style={[styles.followBtn, styles.followingBtn]}>
                  <Feather name="check" size={12} color="#5321E8" />
                  <Text style={styles.followingBtnText}> Following</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#6220FE', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.followBtn}
                >
                  <Text style={styles.followBtnText}>+ Follow</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.msgBtn}
              onPress={(e) => {
                e.stopPropagation();
                if (onOpenChat) onOpenChat(item);
              }}
              activeOpacity={0.85}
            >
              <Feather name="message-circle" size={14} color="#5321E8" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <UserHeader
        user={currentUser}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      {/* Category Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.85}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#6220FE', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterTabActiveGradient}
                  >
                    <Text style={styles.filterTabTextActive}>
                      {tab.icon ? `${tab.icon} ` : ''}
                      {tab.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterTabText}>
                    {tab.icon ? `${tab.icon} ` : ''}
                    {tab.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {filteredLeaders.length} {filteredLeaders.length === 1 ? 'Leader' : 'Leaders'} Found
          </Text>
          {activeTab !== 'all' && (
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterPillText}>
                {CATEGORY_TABS.find((t) => t.id === activeTab)?.label || activeTab}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            fetchLeaders();
          }}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={14} color="#6220FE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6220FE" />
          <Text style={styles.loadingText}>Loading leaders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeaders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLeaderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLeaders();
              }}
              tintColor="#6220FE"
              colors={['#6220FE']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Feather name="users" size={36} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyText}>No Leaders Found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? `No matches found for "${searchQuery}".`
                  : 'Try selecting a different tier or refresh.'}
              </Text>
              {(activeTab !== 'all' || searchQuery) && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>Show All Leaders</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Leader Profile Modal */}
      {selectedLeader && (
        <LeaderProfileModal
          visible={!!selectedLeader}
          leader={selectedLeader}
          currentUser={currentUser}
          onClose={() => setSelectedLeader(null)}
          onOpenChat={(leader) => {
            setSelectedLeader(null);
            if (onOpenChat) onOpenChat(leader);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FE' },

  // Filter Tabs
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#E8E0FF',
    overflow: 'hidden',
  },
  filterTabActive: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  filterTabActiveGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterTabTextActive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  activeFilterPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeFilterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6220FE',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 28,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // Leader Card
  leaderCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#6220FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3EFFC',
  },
  cardCover: {
    height: 95,
    position: 'relative',
    backgroundColor: '#1E1B4B',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  dismissBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  roleBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: CARD_WIDTH - 42,
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -18,
    left: 12,
    zIndex: 6,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#6220FE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  // Card Body
  cardBody: {
    padding: 10,
    paddingTop: 24,
  },
  leaderName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  leaderRole: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6220FE',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  leaderCompany: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  locationText: {
    fontSize: 9.5,
    color: '#94A3B8',
    flex: 1,
  },

  // Real Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5FC',
    borderRadius: 10,
    paddingVertical: 7,
    marginTop: 6,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  statLabel: {
    fontSize: 8.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E1F2',
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  followBtn: {
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  followingBtn: {
    backgroundColor: '#F3F0FF',
    borderWidth: 1.5,
    borderColor: '#6220FE',
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  followingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6220FE',
  },
  msgBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6220FE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },

  // Loading & Empty States
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: '#6220FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
