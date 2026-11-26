import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getLeadersApi, toggleFollowApi } from '../services/api';
import UserHeader from '../components/UserHeader';
import LeaderProfileModal from '../components/LeaderProfileModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

const BADGE_COLORS = {
  'Super Admin': { bg: '#FF6B35', text: '#fff' },
  'Diamond Leader': { bg: '#00B4D8', text: '#fff' },
  'Platinum Leader': { bg: '#7B2FBE', text: '#fff' },
  'Gold Leader': { bg: '#F4A261', text: '#fff' },
  'Silver Leader': { bg: '#8D99AE', text: '#fff' },
  Member: { bg: '#4CAF50', text: '#fff' },
  'Business / Company': { bg: '#E91E8C', text: '#fff' },
  'Team Leader': { bg: '#5321E8', text: '#fff' },
  'Individual / Professional': { bg: '#00897B', text: '#fff' },
  default: { bg: '#5321E8', text: '#fff' },
};

const BG_COLORS = [
  ['#1a1a2e', '#16213e'],
  ['#0d1b2a', '#1b4332'],
  ['#2d1b69', '#11998e'],
  ['#1a1a2e', '#6114D6'],
  ['#141e30', '#243b55'],
  ['#200122', '#6f0000'],
  ['#0f2027', '#2c5364'],
  ['#360033', '#0b8793'],
];

const formatCount = (n) => {
  if (!n || n === 0) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
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
  const [filteredLeaders, setFilteredLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Leaders');
  const [followingIds, setFollowingIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Leader Profile Modal
  const [selectedLeader, setSelectedLeader] = useState(null);

  const filterTabs = ['All Leaders', 'Top Leaders', 'Diamond', 'Platinum', 'Team Leader'];

  const fetchLeaders = async () => {
    try {
      const data = await getLeadersApi();
      const list = (data || []).filter(
        (u) => u.id !== currentUser?.id && u.email !== currentUser?.email
      );
      setLeaders(list);
      applyFilter(list, searchQuery, activeFilter);
    } catch (err) {
      console.warn('Error fetching leaders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  const applyFilter = (dataList, query, filter) => {
    let result = dataList;
    if (filter !== 'All Leaders' && filter !== 'All') {
      result = result.filter((u) => {
        const type = (u.accountTypeName || u.designation || '').toLowerCase();
        return type.includes(filter.toLowerCase());
      });
    }
    if (query.trim()) {
      result = result.filter((u) =>
        (u.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (u.designation || '').toLowerCase().includes(query.toLowerCase()) ||
        (u.companyBrand || u.company_brand || '').toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredLeaders(result.filter((u) => !dismissedIds.has(u.id)));
  };

  useEffect(() => {
    applyFilter(leaders, searchQuery, activeFilter);
  }, [searchQuery, activeFilter, dismissedIds, leaders]);

  const handleFollow = async (item) => {
    const id = item.id;
    const wasFollowing = followingIds.has(id);
    // Optimistic update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await toggleFollowApi(id, currentUser?.id);
    } catch (err) {
      // Revert on error
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleDismiss = (id) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const getBadgeStyle = (type) => BADGE_COLORS[type] || BADGE_COLORS['default'];
  const getBgColors = (index) => BG_COLORS[index % BG_COLORS.length];

  const renderLeaderCard = ({ item, index }) => {
    const isFollowing = followingIds.has(item.id);
    const badge = getBadgeStyle(item.accountTypeName || item.designation || 'Member');
    const bgColors = getBgColors(index);
    const followers = item.followers || item.followers_count || 0;
    const following = item.following || item.following_count || 0;
    const posts = item.posts || item.posts_count || 0;
    const avatarUrl = item.avatarUrl || item.avatar_url;

    return (
      <TouchableOpacity
        style={styles.leaderCard}
        onPress={() => setSelectedLeader(item)}
        activeOpacity={0.9}
      >
        {/* Cover Photo Background */}
        <LinearGradient colors={bgColors} style={styles.cardCover}>
          {/* Dismiss X Button */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => handleDismiss(item.id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Feather name="x" size={12} color="#fff" />
          </TouchableOpacity>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.roleBadgeText, { color: badge.text }]} numberOfLines={1}>
              {(item.accountTypeName || item.designation || 'Member').length > 12
                ? (item.accountTypeName || item.designation || 'Member').substring(0, 11) + '…'
                : item.accountTypeName || item.designation || 'Member'}
            </Text>
          </View>

          {/* Avatar overlapping cover bottom */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(item.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.leaderName} numberOfLines={1}>{item.name || 'Leader'}</Text>
          <Text style={styles.leaderRole} numberOfLines={1}>
            {item.designation || item.accountTypeName || 'Member'}
          </Text>
          {(item.companyBrand || item.company_brand) ? (
            <Text style={styles.leaderCompany} numberOfLines={1}>
              {item.companyBrand || item.company_brand}
            </Text>
          ) : null}
          {(item.city || item.location) ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={9} color="#9CA3AF" />
              <Text style={styles.locationText}>{item.city || item.location}</Text>
            </View>
          ) : null}

          {/* Stats Row */}
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
              <Text style={styles.statNum}>{posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={() => handleFollow(item)}
              activeOpacity={0.85}
            >
              {isFollowing ? (
                <>
                  <Feather name="check" size={12} color="#5321E8" />
                  <Text style={[styles.followBtnText, styles.followingBtnText]}> Following</Text>
                </>
              ) : (
                <Text style={styles.followBtnText}>+ Follow</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => onOpenChat && onOpenChat(item)}
              activeOpacity={0.85}
            >
              <Feather name="message-circle" size={13} color="#5321E8" />
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

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {filteredLeaders.length} Leaders Found
        </Text>
        <TouchableOpacity onPress={fetchLeaders} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={15} color="#5321E8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#5321E8" />
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
              tintColor="#5321E8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="users" size={48} color="#C4B5FD" />
              <Text style={styles.emptyText}>No leaders found</Text>
              <Text style={styles.emptySubText}>Try a different filter or search term</Text>
            </View>
          }
        />
      )}

      {/* Leader Profile Modal — opens when card tapped */}
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
  filterScroll: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE9FF' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#E8E0FF',
  },
  filterTabActive: { backgroundColor: '#5321E8', borderColor: '#5321E8' },
  filterTabText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterTabTextActive: { color: '#fff', fontWeight: '700' },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Grid
  listContent: { paddingHorizontal: 10, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  // Leader Card
  leaderCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5321E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCover: {
    height: 90,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  dismissBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    maxWidth: CARD_WIDTH - 40,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  avatarWrapper: { position: 'absolute', bottom: -18, left: 10 },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#fff',
    backgroundColor: '#5321E8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Card Body
  cardBody: { padding: 10, paddingTop: 24 },
  leaderName: { fontSize: 13, fontWeight: '700', color: '#1E1B4B', marginBottom: 1 },
  leaderRole: { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  leaderCompany: { fontSize: 9.5, color: '#9CA3AF', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  locationText: { fontSize: 9, color: '#9CA3AF' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 12, fontWeight: '700', color: '#5321E8' },
  statLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '500' },
  statDivider: { width: 1, height: 20, backgroundColor: '#E0D9FF' },

  // Buttons
  cardActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  followBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  followingBtn: {
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#5321E8',
  },
  followBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  followingBtnText: { color: '#5321E8' },
  msgBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
