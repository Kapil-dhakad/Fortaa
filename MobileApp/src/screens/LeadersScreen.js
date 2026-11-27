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
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getLeadersApi, toggleFollowApi } from '../services/api';
import UserHeader from '../components/UserHeader';
import LeaderProfileModal from '../components/LeaderProfileModal';

const { width } = Dimensions.get('window');
// 2 columns with 10px screen padding on sides and 8px gap between cards
const CARD_WIDTH = (width - 20 - 8) / 2;

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
    const isFollowing =
      followingIds.has(item.id) || followingIds.has(Number(item.id)) || item.follow_status === 'accepted';
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

    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => setSelectedLeader(item)}
        activeOpacity={0.92}
      >
        {/* Banner with Scenic Image & Overlay */}
        <View style={styles.leadCardBanner}>
          <Image
            source={{ uri: coverBanner }}
            style={styles.leadBannerImg}
            resizeMode="cover"
          />

          {/* Tier Badge at top-left (e.g. ⭐ Crown Director, ⭐ Consultant, 💎 Diamond Leader) */}
          <LinearGradient
            colors={tier.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.leadLevelBadge}
          >
            <Text style={styles.leadBadgeIcon}>{tier.icon}</Text>
            <Text style={styles.leadBadgeText} numberOfLines={1}>
              {roleName.length > 15 ? roleName.substring(0, 14) + '…' : roleName}
            </Text>
          </LinearGradient>

          {/* Dismiss X Button at top-right */}
          <TouchableOpacity
            style={styles.leadCardDismissBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss(item.id);
            }}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Feather name="x" size={11} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Circular Avatar (74px x 74px, top: 28px, left: 8px, 3px white border) */}
          <View style={styles.leadCardAvatarWrap}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.leadCardAvatarImg}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.leadCardBody}>
          {/* Leader Name */}
          <Text style={styles.leadCardName} numberOfLines={1}>
            {item.name || 'Fortaa Leader'}
          </Text>

          {/* Level & Company row with icon (e.g. ⭐ Consultant • Stream Energy) */}
          <View style={styles.leadCardLevelRow}>
            <Text style={styles.leadLevelIconSm}>{tier.icon}</Text>
            <Text style={styles.leadCardLevelText} numberOfLines={1}>
              {roleName}
              {company ? ` • ${company}` : ''}
            </Text>
          </View>

          {/* Stats Row (3 Columns: Followers, Following, Post) */}
          <View style={styles.leadCardStatsRow}>
            <View style={styles.leadCardStatCol}>
              <Text style={styles.leadCardStatVal}>{formatCount(followers)}</Text>
              <Text style={styles.leadCardStatLbl}>Followers</Text>
            </View>
            <View style={styles.leadCardStatCol}>
              <Text style={styles.leadCardStatVal}>{formatCount(following)}</Text>
              <Text style={styles.leadCardStatLbl}>Following</Text>
            </View>
            <View style={styles.leadCardStatCol}>
              <Text style={styles.leadCardStatVal}>{formatCount(posts)}</Text>
              <Text style={styles.leadCardStatLbl}>Post</Text>
            </View>
          </View>

          {/* Optional Quote / Bio */}
          {item.bio ? (
            <Text style={styles.leadCardQuote} numberOfLines={1}>
              “{item.bio}”
            </Text>
          ) : null}

          {/* Actions: Follow & Message Side by Side */}
          <View style={styles.leadCardActionsRow}>
            <TouchableOpacity
              style={styles.actionBtnWrap}
              onPress={(e) => {
                e.stopPropagation();
                handleFollow(item);
              }}
              activeOpacity={0.85}
            >
              {isFollowing ? (
                <View style={[styles.leadBtnFollow, styles.leadBtnFollowing]}>
                  <Text style={styles.leadBtnFollowingText}>Following ✓</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#9F21FE', '#4F24FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.leadBtnFollow}
                >
                  <Text style={styles.leadBtnFollowText}>Follow</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnWrap}
              onPress={(e) => {
                e.stopPropagation();
                if (onOpenChat) onOpenChat(item);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.leadBtnMessage}>
                <Text style={styles.leadBtnMessageText}>Message</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Standard Header */}
      <UserHeader
        user={currentUser}
        searchQuery=""
        onSearchChange={() => {}}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      {/* Category Filter Tabs (Pills) */}
      <View style={styles.filterPillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContent}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.pillBtnText, isActive && styles.pillBtnTextActive]}>
                  {tab.icon ? `${tab.icon} ` : ''}
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color="#A0A5B9" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, posts, companies, products, opportunities..."
            placeholderTextColor="#A0A5B9"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Feather name="x" size={14} color="#A0A5B9" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Sliders Toggle Button */}
        <TouchableOpacity
          style={styles.filterToggleBtn}
          onPress={() => {
            // Cycle through category tabs on toggle click
            const currentIndex = CATEGORY_TABS.findIndex((t) => t.id === activeTab);
            const nextIndex = (currentIndex + 1) % CATEGORY_TABS.length;
            setActiveTab(CATEGORY_TABS[nextIndex].id);
          }}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={16} color="#6220FE" />
        </TouchableOpacity>
      </View>

      {/* Main Grid Content */}
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
                <Feather name="users" size={32} color="#8B5CF6" />
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

  // Category Filter Pills
  filterPillsWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  filterPillsContent: {
    paddingHorizontal: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillBtnActive: {
    backgroundColor: '#6220FE',
    borderColor: '#6220FE',
  },
  pillBtnText: {
    fontSize: 12,
    color: '#232356',
    fontWeight: '500',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Search & Filter Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  searchBox: {
    flex: 1,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: '#232356',
    paddingVertical: 0,
  },
  filterToggleBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DFFD',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 28,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  // Card (Exact Web Frame 109 match: 195px x 268px)
  leadCard: {
    width: CARD_WIDTH,
    backgroundColor: '#F7FBFE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE7F6',
    overflow: 'hidden',
    shadowColor: '#232356',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Banner (104px height, relative)
  leadCardBanner: {
    height: 104,
    position: 'relative',
    backgroundColor: '#E2E8F0',
    overflow: 'visible',
  },
  leadBannerImg: {
    width: '100%',
    height: '100%',
  },

  // Tier Badge at top-left
  leadLevelBadge: {
    position: 'absolute',
    top: 7,
    left: 8,
    height: 18,
    borderRadius: 5,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
    maxWidth: CARD_WIDTH - 40,
  },
  leadBadgeIcon: {
    fontSize: 9,
    color: '#FFFFFF',
  },
  leadBadgeText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Dismiss X Button at top-right
  leadCardDismissBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // Avatar Wrap (74px x 74px, top: 28px, left: 8px, 3px white border)
  leadCardAvatarWrap: {
    position: 'absolute',
    top: 28,
    left: 8,
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  leadCardAvatarImg: {
    width: '100%',
    height: '100%',
  },

  // Card Body
  leadCardBody: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#F7FBFE',
    gap: 3,
  },
  leadCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232356',
    marginTop: 2,
  },

  // Level & Company row (⭐ Crown Director • RoyalVanta Global)
  leadCardLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  leadLevelIconSm: {
    fontSize: 10,
    color: '#232356',
  },
  leadCardLevelText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#232356',
    flex: 1,
  },

  // Stats Row (Followers, Following, Post)
  leadCardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: '#ECE7F6',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7F6',
    marginVertical: 2,
  },
  leadCardStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  leadCardStatVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#232356',
  },
  leadCardStatLbl: {
    fontSize: 9,
    color: '#4B5563',
  },

  // Quote
  leadCardQuote: {
    fontSize: 11,
    color: '#232356',
    fontStyle: 'italic',
    marginVertical: 1,
  },

  // Actions (Side by Side)
  leadCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  actionBtnWrap: {
    flex: 1,
  },
  leadBtnFollow: {
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8B17F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadBtnFollowing: {
    backgroundColor: '#F3F0FF',
    borderColor: '#8B17F8',
  },
  leadBtnFollowText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leadBtnFollowingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B17F8',
  },
  leadBtnMessage: {
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8B17F8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadBtnMessageText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#8B17F8',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  resetFilterBtn: {
    marginTop: 14,
    backgroundColor: '#6220FE',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
