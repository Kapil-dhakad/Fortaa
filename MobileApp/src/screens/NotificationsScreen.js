import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';

const { width } = Dimensions.get('window');

const API_BASE = 'http://10.198.121.199:3000/api';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'like',
    actor: 'Kapil Dhakad',
    message: 'liked your post',
    detail: '"Exciting opportunity for network marketing..."',
    time: '2 min ago',
    read: false,
    icon: 'heart',
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
  },
  {
    id: '2',
    type: 'comment',
    actor: 'Priya Sharma',
    message: 'commented on your post',
    detail: '"Great insight! Totally agree with this..."',
    time: '15 min ago',
    read: false,
    icon: 'message-circle',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
  },
  {
    id: '3',
    type: 'follow',
    actor: 'Rahul Verma',
    message: 'started following you',
    detail: 'Team Leader · Bhopal',
    time: '1 hour ago',
    read: false,
    icon: 'user-plus',
    iconBg: '#D1FAE5',
    iconColor: '#10B981',
  },
  {
    id: '4',
    type: 'share',
    actor: 'Anita Singh',
    message: 'shared your post',
    detail: '"Fortaa network is growing fast..."',
    time: '3 hours ago',
    read: true,
    icon: 'share-2',
    iconBg: '#EDE9FE',
    iconColor: '#5321E8',
  },
  {
    id: '5',
    type: 'connect',
    actor: 'Vikram Joshi',
    message: 'sent you a connection request',
    detail: 'Gold Leader · Jaipur',
    time: '5 hours ago',
    read: true,
    icon: 'link',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
  },
  {
    id: '6',
    type: 'story',
    actor: 'Sunita Patel',
    message: 'viewed your story',
    detail: 'Silver Leader',
    time: '8 hours ago',
    read: true,
    icon: 'eye',
    iconBg: '#FCE7F3',
    iconColor: '#EC4899',
  },
  {
    id: '7',
    type: 'system',
    actor: 'Fortaa',
    message: 'Your profile was viewed 24 times',
    detail: 'This week — 3x more than last week',
    time: '1 day ago',
    read: true,
    icon: 'trending-up',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    id: '8',
    type: 'like',
    actor: 'Deepak Mehra',
    message: 'liked your comment',
    detail: '"Absolutely! Network is everything..."',
    time: '2 days ago',
    read: true,
    icon: 'thumbs-up',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
  },
];

export default function NotificationsScreen({ user, onNavigateToMessages, onNavigateToProfile, onLogout }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionStates, setActionStates] = useState({});
  const [selectedNotifAction, setSelectedNotifAction] = useState(null);

  const filters = ['All', 'Unread', 'Likes', 'Comments', 'Follows'];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = (n.actor || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q);
      const matchDetail = (n.detail || '').toLowerCase().includes(q);
      if (!matchActor && !matchMsg && !matchDetail) return false;
    }
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Likes') return n.type === 'like';
    if (activeFilter === 'Comments') return n.type === 'comment';
    if (activeFilter === 'Follows') return n.type === 'follow' || n.type === 'connect';
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    Alert.alert('All Read ✨', 'All notifications marked as read.');
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const toggleReadState = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
    setSelectedNotifAction(null);
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotifAction(null);
  };

  const handleAcceptRequest = (item) => {
    setActionStates((prev) => ({ ...prev, [item.id]: 'accepted' }));
    markRead(item.id);
    Alert.alert('Connection Accepted 🎉', `You and ${item.actor} are now connected!`);
  };

  const handleDeclineRequest = (item) => {
    setActionStates((prev) => ({ ...prev, [item.id]: 'declined' }));
    markRead(item.id);
  };

  const renderNotification = ({ item }) => {
    const actionStatus = actionStates[item.id];

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.85}
      >
        {/* Unread dot */}
        {!item.read && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.notifIcon, { backgroundColor: item.iconBg }]}>
          <Feather name={item.icon} size={18} color={item.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <Text style={styles.notifText} numberOfLines={2}>
            <Text style={styles.notifActor}>{item.actor} </Text>
            <Text style={styles.notifMessage}>{item.message}</Text>
          </Text>
          {item.detail ? (
            <Text style={styles.notifDetail} numberOfLines={1}>{item.detail}</Text>
          ) : null}
          <Text style={styles.notifTime}>{item.time}</Text>

          {/* Action for follow/connect request */}
          {(item.type === 'follow' || item.type === 'connect') && (
            <View style={styles.notifActions}>
              {actionStatus === 'accepted' ? (
                <View style={styles.statusPillAccepted}>
                  <Feather name="check" size={12} color="#059669" />
                  <Text style={styles.statusPillAcceptedText}>Connected</Text>
                </View>
              ) : actionStatus === 'declined' ? (
                <View style={styles.statusPillDeclined}>
                  <Text style={styles.statusPillDeclinedText}>Declined</Text>
                </View>
              ) : (
                <View style={styles.requestBtnsRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptRequest(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDeclineRequest(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 3-Dots Action button */}
        <TouchableOpacity
          style={styles.notifMoreBtn}
          onPress={() => setSelectedNotifAction(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="more-horizontal" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={() => {}}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      {/* Notification Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.pageSubtitle}>{unreadCount} unread notifications</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Feather name="check-circle" size={14} color="#5321E8" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            {f === 'Unread' && unreadCount > 0 ? (
              <View style={styles.filterWithBadge}>
                <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                  {f}
                </Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{unreadCount}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                {f}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      {loading ? (
        <ActivityIndicator size="large" color="#5321E8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <LinearGradient colors={['#F3F0FF', '#EDE9FE']} style={styles.emptyIconBg}>
                  <Feather name="bell-off" size={36} color="#C4B5FD" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No notifications in this category</Text>
            </View>
          }
        />
      )}

      {/* 3-Dots Notification Action Modal */}
      <Modal
        visible={!!selectedNotifAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotifAction(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedNotifAction(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.notifActionCard}>
                {selectedNotifAction && (
                  <>
                    <TouchableOpacity
                      style={styles.notifActionItem}
                      onPress={() => toggleReadState(selectedNotifAction.id)}
                    >
                      <Feather
                        name={selectedNotifAction.read ? 'circle' : 'check-circle'}
                        size={18}
                        color="#4F46E5"
                        style={styles.notifActionIcon}
                      />
                      <Text style={styles.notifActionText}>
                        {selectedNotifAction.read ? 'Mark as unread' : 'Mark as read'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.notifActionDivider} />

                    <TouchableOpacity
                      style={styles.notifActionItem}
                      onPress={() => deleteNotification(selectedNotifAction.id)}
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        color="#EF4444"
                        style={styles.notifActionIcon}
                      />
                      <Text style={[styles.notifActionText, styles.textDanger]}>
                        Delete notification
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.notifActionThickDivider} />

                    <TouchableOpacity
                      style={styles.notifActionCancel}
                      onPress={() => setSelectedNotifAction(null)}
                    >
                      <Text style={styles.notifActionCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FE' },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE9FF',
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B' },
  pageSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#5321E8' },

  filterScroll: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE9FF',
  },
  filterContent: { paddingHorizontal: 12, paddingVertical: 9, gap: 8, flexDirection: 'row' },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#E8E0FF',
  },
  filterTabActive: { backgroundColor: '#5321E8', borderColor: '#5321E8' },
  filterTabText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterTabTextActive: { color: '#fff', fontWeight: '700' },
  filterWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeCount: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeCountText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    position: 'relative',
  },
  notifCardUnread: { backgroundColor: '#FAFAFF' },
  unreadDot: {
    position: 'absolute',
    top: 20,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#5321E8',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  notifActor: { fontWeight: '700', color: '#1E1B4B' },
  notifMessage: { fontWeight: '400' },
  notifDetail: { fontSize: 12, color: '#6B7280', marginTop: 3, fontStyle: 'italic' },
  notifTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },

  notifActions: { marginTop: 6, flexShrink: 0 },
  requestBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#5321E8',
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  declineBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  statusPillAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillAcceptedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  statusPillDeclined: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillDeclinedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  notifMoreBtn: {
    padding: 6,
    marginLeft: 4,
  },

  /* Notification 3-Dots Action Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  notifActionCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  notifActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 14,
  },
  notifActionIcon: {
    width: 22,
    textAlign: 'center',
  },
  notifActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  textDanger: {
    color: '#EF4444',
  },
  notifActionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  notifActionThickDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  notifActionCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  notifActionCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: { marginBottom: 16 },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
});
