import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';
import LeaderProfileModal from '../components/LeaderProfileModal';
import {
  fetchNotificationsApi,
  markNotificationsReadApi,
  deleteNotificationApi,
} from '../services/api';

const { width } = Dimensions.get('window');

// Curated Fortaa notifications matching Screenshot 3
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    actor_id: 12,
    actor: 'RAKESH SINGH',
    actor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    type: 'like',
    message: 'liked your story',
    detail: 'Tecnical Achivers • rcm business',
    time: '19h',
    read: false,
    badgeType: 'story_like',
  },
  {
    id: 'n2',
    actor_id: 15,
    actor: 'Kapil',
    actor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    type: 'like',
    message: 'liked your story',
    detail: 'Team Leader • Forever Living',
    time: '1w',
    read: true,
    badgeType: 'story_like',
  },
  {
    id: 'n3',
    actor_id: 15,
    actor: 'Kapil',
    actor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    type: 'reply',
    message: 'replied to your story: "Nice"',
    detail: 'Team Leader • Forever Living',
    time: '1w',
    read: false,
    badgeType: 'story_reply',
  },
  {
    id: 'n4',
    actor_id: 15,
    actor: 'Kapil',
    actor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    type: 'like',
    message: 'liked your story',
    detail: 'Team Leader • Forever Living',
    time: '1w',
    read: true,
    badgeType: 'story_like',
  },
  {
    id: 'n5',
    actor_id: 18,
    actor: 'Ankit Jain',
    actor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    type: 'follow',
    message: 'started following you.',
    detail: 'Team Leader • Forever Living Products (FLP)',
    time: '1w',
    read: true,
    badgeType: 'follow',
  },
  {
    id: 'n6',
    actor_id: 20,
    actor: 'Rajkumar Meena',
    actor_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    type: 'follow',
    message: 'started following you.',
    detail: 'Leader • Ranax Tech',
    time: '1w',
    read: true,
    badgeType: 'follow',
  },
  {
    id: 'n7',
    actor_id: 15,
    actor: 'Kapil',
    actor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    type: 'connect',
    message: 'sent you a follow request.',
    detail: 'Team Leader • Forever Living',
    time: '1w',
    read: true,
    badgeType: 'connect',
  },
];

export default function NotificationsScreen({
  user,
  onNavigateBack,
  onNavigateTab,
  onNavigateToMessages,
  onNavigateToProfile,
  onLogout,
}) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifAction, setSelectedNotifAction] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Fetch real notifications from backend
  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchNotificationsApi(user.id);
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          id: String(item.id),
          actor_id: item.actor_id || item.ref_id,
          actor: item.actor_name || 'Fortaa Leader',
          actor_avatar: item.actor_avatar || null,
          type: item.type || 'system',
          message:
            item.message?.replace(item.actor_name || '', '').trim() ||
            (item.type === 'follow_request'
              ? 'sent you a follow request.'
              : item.type === 'new_follower'
              ? 'started following you.'
              : 'interacted with your profile.'),
          detail: item.actor_role
            ? `${item.actor_role}${item.actor_company ? ` • ${item.actor_company}` : ''}`
            : 'Business Leader',
          time: formatTimeAgo(item.created_at),
          read: !!item.is_read,
          badgeType: item.type,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'now';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user?.id) {
      await markNotificationsReadApi(user.id);
    }
  };

  const handleItemClick = (item) => {
    // Mark as read optimistically
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    // If tapping leader or follow/connect, open leader profile
    if (item.actor_id) {
      setSelectedLeader({ id: item.actor_id, name: item.actor });
    } else if (item.type === 'message' && onNavigateToMessages) {
      onNavigateToMessages();
    } else if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  const handleDeleteNotif = async (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setSelectedNotifAction(null);
    if (user?.id) {
      await deleteNotificationApi(notifId, user.id);
    }
  };

  const getBadgeConfig = (badgeType) => {
    switch (badgeType) {
      case 'story_like':
      case 'like':
        return { icon: 'heart', color: '#FFFFFF', bgColor: '#EF4444' };
      case 'story_reply':
      case 'comment':
      case 'message':
        return { icon: 'notifications', color: '#FFFFFF', bgColor: '#8B5CF6' };
      case 'follow':
      case 'connect':
        return { icon: 'star', color: '#FFFFFF', bgColor: '#10B981' };
      default:
        return { icon: 'notifications', color: '#FFFFFF', bgColor: '#3B82F6' };
    }
  };

  const renderItem = ({ item }) => {
    const badge = getBadgeConfig(item.badgeType || item.type);

    return (
      <TouchableOpacity
        style={[styles.itemCard, !item.read && styles.itemCardUnread]}
        onPress={() => handleItemClick(item)}
        activeOpacity={0.8}
      >
        {/* Far-left Blue Unread Dot (Screenshot 3) */}
        <View style={styles.unreadDotCol}>
          {!item.read && <View style={styles.blueUnreadDot} />}
        </View>

        {/* Left: Avatar with bottom-right badge */}
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => item.actor_id && setSelectedLeader({ id: item.actor_id, name: item.actor })}
          activeOpacity={0.8}
        >
          {item.actor_avatar ? (
            <Image source={{ uri: item.actor_avatar }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{(item.actor || 'U')[0].toUpperCase()}</Text>
            </LinearGradient>
          )}
          <View style={[styles.avatarBadgeCircle, { backgroundColor: badge.bgColor }]}>
            <Ionicons name={badge.icon} size={9} color={badge.color} />
          </View>
        </TouchableOpacity>

        {/* Middle: Content */}
        <View style={styles.contentCol}>
          <Text style={styles.messageText} numberOfLines={2}>
            <Text
              style={styles.actorNameText}
              onPress={() => item.actor_id && setSelectedLeader({ id: item.actor_id, name: item.actor })}
            >
              {item.actor}{' '}
            </Text>
            <Text style={styles.actionDescText}>{item.message}</Text>
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {item.detail}
          </Text>
        </View>

        {/* Right: Time, Purple [View] button & 3-Dots Menu */}
        <View style={styles.rightActionsCol}>
          <Text style={styles.timeText}>{item.time}</Text>

          <TouchableOpacity
            style={styles.btnView}
            onPress={() => handleItemClick(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnViewText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreIconBtn}
            onPress={() => setSelectedNotifAction(item)}
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Global Purple Header */}
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectLeader={(person) => setSelectedLeader({ id: person.id, name: person.name })}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={() => {}}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      {/* 2. Notifications Subheader (Screenshot 3 Parity) */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={onNavigateBack || (() => onNavigateTab && onNavigateTab('dashboard'))}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#1E1B4B" />
        </TouchableOpacity>

        <View style={styles.titleWithBadge}>
          <Text style={styles.subHeaderTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.newBadgePill}>
              <Text style={styles.newBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.refreshCircleBtn}
          onPress={loadNotifications}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={15} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* 3. Notification Items List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5321E8" />
          <Text style={styles.loadingText}>Updating notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="bell-off" size={40} color="#C4B5FD" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>You have no unread notifications.</Text>
            </View>
          }
        />
      )}

      {/* 3-Dots Action Modal */}
      <Modal
        visible={!!selectedNotifAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotifAction(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedNotifAction(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  if (selectedNotifAction) {
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === selectedNotifAction.id ? { ...n, read: !n.read } : n
                      )
                    );
                    setSelectedNotifAction(null);
                  }
                }}
              >
                <Feather
                  name={selectedNotifAction?.read ? 'mail' : 'check'}
                  size={16}
                  color="#5321E8"
                />
                <Text style={styles.modalOptionText}>
                  {selectedNotifAction?.read ? 'Mark as unread' : 'Mark as read'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => selectedNotifAction && handleDeleteNotif(selectedNotifAction.id)}
              >
                <Feather name="trash-2" size={16} color="#EF4444" />
                <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Delete notification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Leader Profile Modal */}
      <LeaderProfileModal
        visible={!!selectedLeader}
        onClose={() => setSelectedLeader(null)}
        leaderId={selectedLeader?.id}
        leaderName={selectedLeader?.name}
        currentUser={user}
        onOpenChat={(targetId) => {
          setSelectedLeader(null);
          if (onNavigateToMessages) onNavigateToMessages(targetId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Subheader (Screenshot 3)
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  newBadgePill: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingVertical: 6,
    paddingBottom: 40,
  },

  // Notification Item Card (Screenshot 3 Parity)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemCardUnread: {
    backgroundColor: '#F8FAFC',
  },

  unreadDotCol: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    marginRight: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarBadgeCircle: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentCol: {
    flex: 1,
    marginRight: 8,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },
  actorNameText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  actionDescText: {
    color: '#334155',
  },
  metaText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  rightActionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  btnView: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
  },
  btnViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5321E8',
  },
  moreIconBtn: {
    padding: 2,
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
