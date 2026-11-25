import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getConversationsApi,
  getChatHistoryApi,
  sendMessageApi,
} from '../services/api';

export default function MessagesScreen({
  currentUser,
  activeChatPartner,
  onBackToConversations,
}) {
  const [selectedPartner, setSelectedPartner] = useState(activeChatPartner || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter Popup State (Matches Web & Image 4)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'name'

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatOptionsOpen, setChatOptionsOpen] = useState(false);
  const [groupMembersModalOpen, setGroupMembersModalOpen] = useState(false);
  const flatListRef = useRef(null);

  const filterTabs = ['All', 'Unread', 'Direct', 'Group'];

  // Default sample conversations matching Screenshot 4 + Groups
  const defaultConversations = [
    {
      id: '1',
      name: 'kapil',
      role: 'Silver Leader',
      avatarType: 'kapil',
      lastMessage: 'Hello',
      time: '17:25',
      isOnline: true,
      unread: false,
    },
    {
      id: '2',
      name: 'Fortaa',
      role: 'Member',
      avatarType: 'fortaa',
      lastMessage: 'hyl',
      time: '19:37',
      isOnline: true,
      unread: false,
    },
    {
      id: '3',
      name: 'Success Mindset & Motivation',
      role: 'Member',
      avatarType: 'group',
      lastMessage: 'Welcome to the group!',
      time: '14:04',
      isGroup: true,
      membersCount: 3,
      unread: true,
    },
    {
      id: '4',
      name: 'Priya Sharma',
      role: 'Gold Leader',
      avatarType: 'kapil',
      lastMessage: 'Check out the new leadership compensation plan',
      time: '11:20',
      isOnline: true,
      unread: true,
    },
    {
      id: '5',
      name: 'Diamond Leaders Club',
      role: 'Diamond Leader',
      avatarType: 'group',
      lastMessage: 'Meeting tomorrow at 6 PM sharp',
      time: '09:15',
      isGroup: true,
      membersCount: 18,
      unread: false,
    },
  ];

  const [conversationList, setConversationList] = useState(defaultConversations);

  // Sync if activeChatPartner prop passed from outside
  useEffect(() => {
    if (activeChatPartner) {
      setSelectedPartner(activeChatPartner);
    }
  }, [activeChatPartner]);

  // Fetch real chat history if partner selected
  useEffect(() => {
    if (selectedPartner?.id && currentUser?.id) {
      getChatHistoryApi(currentUser.id, selectedPartner.id).then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history);
        } else {
          // Default initial greetings
          setMessages([
            {
              id: 'm1',
              sender_id: selectedPartner.id,
              text: selectedPartner.lastMessage || 'Hello! Welcome to Fortaa.',
              created_at: new Date().toISOString(),
              is_read: true,
            },
          ]);
        }
      });
    }
  }, [selectedPartner?.id, currentUser?.id]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !selectedPartner) return;

    const tempMsg = {
      id: String(Date.now()),
      sender_id: currentUser?.id || 999,
      receiver_id: selectedPartner.id,
      text,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setSending(true);

    try {
      if (currentUser?.id && selectedPartner.id) {
        await sendMessageApi({
          senderId: currentUser.id,
          receiverId: selectedPartner.id,
          text,
        });
      }
    } catch (err) {
      console.warn('Message send error:', err);
    } finally {
      setSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: LIVE CHAT VIEW
  // ─────────────────────────────────────────────────────────────
  if (selectedPartner) {
    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Top Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setSelectedPartner(null);
              if (onBackToConversations) onBackToConversations();
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="#1E1B4B" />
          </TouchableOpacity>

          <View style={styles.chatHeaderAvatar}>
            <Image
              source={
                selectedPartner.avatarType === 'fortaa'
                  ? require('../../assets/figma/logo_icon_img.png')
                  : require('../../assets/dashboard/user_avatar_rahul.png')
              }
              style={styles.chatHeaderAvatarImg}
            />
          </View>

          <View style={styles.chatHeaderMeta}>
            <Text style={styles.chatPartnerName} numberOfLines={1}>
              {selectedPartner.name}
            </Text>
            <Text style={styles.chatPartnerRole}>
              {selectedPartner.role || 'Active Member'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={() => setChatOptionsOpen(true)}
            activeOpacity={0.7}
          >
            <Feather name="more-vertical" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Message Bubbles List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === (currentUser?.id || 999);

            return (
              <View
                style={[
                  styles.bubbleRow,
                  isMe ? styles.bubbleRowMe : styles.bubbleRowPartner,
                ]}
              >
                {isMe ? (
                  <LinearGradient
                    colors={['#BE84FC', '#6420D6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bubbleMe}
                  >
                    <Text style={styles.bubbleMeText}>{item.text}</Text>
                    <View style={styles.bubbleTimeRow}>
                      <Text style={styles.bubbleTimeMe}>Just now</Text>
                      <Feather name="check" size={11} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.bubblePartner}>
                    <Text style={styles.bubblePartnerText}>{item.text}</Text>
                    <Text style={styles.bubbleTimePartner}>Just now</Text>
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Bottom Input Bar */}
        <View style={styles.chatInputBar}>
          <TouchableOpacity
            style={styles.chatAttachBtn}
            onPress={() => Alert.alert('Attach File', 'Select image or document to share')}
            activeOpacity={0.7}
          >
            <Feather name="plus-circle" size={20} color="#64748B" />
          </TouchableOpacity>

          <TextInput
            style={styles.chatTextInput}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.chatSendBtn,
              !inputText.trim() && styles.chatSendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Chat 3-Dots Action Modal */}
        <Modal
          visible={chatOptionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setChatOptionsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setChatOptionsOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.optionsCard}>
                  {selectedPartner.isGroup ? (
                    <>
                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          setGroupMembersModalOpen(true);
                        }}
                      >
                        <Feather name="users" size={18} color="#4F46E5" style={styles.optionsIcon} />
                        <Text style={styles.optionsText}>View Group Members</Text>
                      </TouchableOpacity>
                      <View style={styles.optionsDivider} />

                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          setMessages([]);
                          Alert.alert('Chat Cleared', 'All messages have been cleared');
                        }}
                      >
                        <Feather name="trash-2" size={18} color="#64748B" style={styles.optionsIcon} />
                        <Text style={styles.optionsText}>Clear Chat</Text>
                      </TouchableOpacity>
                      <View style={styles.optionsDivider} />

                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          setSelectedPartner(null);
                          Alert.alert('Left Group', `You left ${selectedPartner.name}`);
                        }}
                      >
                        <Feather name="log-out" size={18} color="#EF4444" style={styles.optionsIcon} />
                        <Text style={[styles.optionsText, styles.textDanger]}>Leave Group</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          Alert.alert('Profile', `${selectedPartner.name} · ${selectedPartner.role}`);
                        }}
                      >
                        <Feather name="user" size={18} color="#4F46E5" style={styles.optionsIcon} />
                        <Text style={styles.optionsText}>View Profile</Text>
                      </TouchableOpacity>
                      <View style={styles.optionsDivider} />

                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          Alert.alert('Notifications Muted', `Muted notifications for ${selectedPartner.name}`);
                        }}
                      >
                        <Feather name="bell-off" size={18} color="#64748B" style={styles.optionsIcon} />
                        <Text style={styles.optionsText}>Mute Notifications</Text>
                      </TouchableOpacity>
                      <View style={styles.optionsDivider} />

                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          setMessages([]);
                          Alert.alert('Chat Cleared', 'All messages have been cleared');
                        }}
                      >
                        <Feather name="trash-2" size={18} color="#64748B" style={styles.optionsIcon} />
                        <Text style={styles.optionsText}>Clear Chat</Text>
                      </TouchableOpacity>
                      <View style={styles.optionsDivider} />

                      <TouchableOpacity
                        style={styles.optionsItem}
                        onPress={() => {
                          setChatOptionsOpen(false);
                          Alert.alert('User Blocked', `${selectedPartner.name} has been blocked.`);
                        }}
                      >
                        <Feather name="slash" size={18} color="#EF4444" style={styles.optionsIcon} />
                        <Text style={[styles.optionsText, styles.textDanger]}>Block User</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <View style={styles.optionsThickDivider} />
                  <TouchableOpacity
                    style={styles.optionsCancel}
                    onPress={() => setChatOptionsOpen(false)}
                  >
                    <Text style={styles.optionsCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Group Members Modal */}
        <Modal
          visible={groupMembersModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setGroupMembersModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setGroupMembersModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.membersCard}>
                  <View style={styles.membersHeader}>
                    <Text style={styles.membersHeaderTitle}>
                      {selectedPartner.name} Members
                    </Text>
                    <TouchableOpacity
                      onPress={() => setGroupMembersModalOpen(false)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="x" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.membersList}>
                    {[
                      { name: 'Nilesh (You)', role: 'Admin', online: true },
                      { name: 'Kapil Dhakad', role: 'Silver Leader', online: true },
                      { name: 'Priya Sharma', role: 'Gold Leader', online: true },
                      { name: 'Rahul Verma', role: 'Team Leader', online: false },
                      { name: 'Anita Singh', role: 'Business Leader', online: false },
                    ].map((m, idx) => (
                      <View key={idx} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{m.name.charAt(0)}</Text>
                          {m.online && <View style={styles.memberOnlineDot} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberRole}>{m.role}</Text>
                        </View>
                        {m.role === 'Admin' && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.membersCloseBtn}
                    onPress={() => setGroupMembersModalOpen(false)}
                  >
                    <Text style={styles.membersCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: CONVERSATIONS LIST (Screenshot 4 Match + Filters)
  // ─────────────────────────────────────────────────────────────
  const isFilterActive = filterRole !== 'All' || filterStatus !== 'All' || sortBy !== 'recent';

  const filteredList = conversationList
    .filter((item) => {
      // 1. Search text filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(query);
        const matchMsg = (item.lastMessage || '').toLowerCase().includes(query);
        const matchRole = (item.role || '').toLowerCase().includes(query);
        if (!matchName && !matchMsg && !matchRole) return false;
      }

      // 2. Tab filter
      if (activeFilter === 'Unread' && !item.unread) return false;
      if (activeFilter === 'Direct' && item.isGroup) return false;
      if (activeFilter === 'Group' && !item.isGroup) return false;

      // 3. Popup Role filter
      if (filterRole !== 'All' && item.role !== filterRole) return false;

      // 4. Popup Status filter
      if (filterStatus === 'Online' && !item.isOnline) return false;
      if (filterStatus === 'Unread' && !item.unread) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar with Filter Sliders Icon (Screenshot 4) */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search message"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Feather name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, isFilterActive && styles.filterBtnActive]}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.7}
        >
          <Feather
            name="sliders"
            size={18}
            color={isFilterActive ? '#FFFFFF' : '#6114D6'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Filter Pills Row: All, Unread, Direct, Group */}
      <View style={styles.filterPillsRow}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Conversations List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.convListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.convCard}
            onPress={() => setSelectedPartner(item)}
            activeOpacity={0.75}
          >
            {/* Avatar */}
            <View style={styles.convAvatarWrap}>
              {item.avatarType === 'fortaa' ? (
                <View style={styles.fortaaAvatarBox}>
                  <Image
                    source={require('../../assets/figma/logo_icon_img.png')}
                    style={styles.fortaaLogoImg}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Image
                  source={require('../../assets/dashboard/user_avatar_rahul.png')}
                  style={styles.convAvatarImg}
                />
              )}
            </View>

            {/* Middle Meta */}
            <View style={styles.convMeta}>
              <Text style={styles.convName}>{item.name}</Text>
              <View style={styles.roleBadgeRow}>
                <Feather name="briefcase" size={11} color="#6114D6" />
                <Text style={styles.roleBadgeText}>{item.role}</Text>
              </View>
              <Text style={styles.lastMessageText} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>

            {/* Right Time & Arrow */}
            <View style={styles.convRight}>
              <Text style={styles.convTimeText}>{item.time}</Text>
              <Feather name="chevron-right" size={18} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Filter Popup Modal (Screenshot 4 & Web Filter Popup) */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.filterModalCard}>
                <View style={styles.filterModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="sliders" size={18} color="#4F46E5" />
                    <Text style={styles.filterModalTitle}>Chat Filters</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsFilterModalOpen(false)}
                    style={{ padding: 4 }}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Section 1: Role */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Filter by Role</Text>
                  <View style={styles.filterChipRow}>
                    {['All', 'Member', 'Silver Leader', 'Gold Leader', 'Diamond Leader'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.filterChip,
                          filterRole === r && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterRole(r)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filterRole === r && styles.filterChipTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Section 2: Status */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Status</Text>
                  <View style={styles.filterChipRow}>
                    {['All', 'Online', 'Unread'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.filterChip,
                          filterStatus === s && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus(s)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filterStatus === s && styles.filterChipTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Section 3: Sort Order */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sort Order</Text>
                  <View style={styles.filterChipRow}>
                    {[
                      { id: 'recent', label: 'Recent First' },
                      { id: 'name', label: 'Name (A-Z)' },
                    ].map((sb) => (
                      <TouchableOpacity
                        key={sb.id}
                        style={[
                          styles.filterChip,
                          sortBy === sb.id && styles.filterChipActive,
                        ]}
                        onPress={() => setSortBy(sb.id)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            sortBy === sb.id && styles.filterChipTextActive,
                          ]}
                        >
                          {sb.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Modal Footer Actions */}
                <View style={styles.filterModalFooter}>
                  <TouchableOpacity
                    style={styles.filterResetBtn}
                    onPress={() => {
                      setFilterRole('All');
                      setFilterStatus('All');
                      setSortBy('recent');
                    }}
                  >
                    <Text style={styles.filterResetBtnText}>Reset All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterApplyBtn}
                    onPress={() => setIsFilterModalOpen(false)}
                  >
                    <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44),
  },

  /* Search & Filter Row */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E1B4B',
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#6114D6',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* Conversation Cards */
  convListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  convAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  convAvatarImg: {
    width: '100%',
    height: '100%',
  },
  fortaaAvatarBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5321E8',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fortaaLogoImg: {
    width: 30,
    height: 30,
  },
  convMeta: {
    flex: 1,
    gap: 2,
  },
  convName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '600',
  },
  lastMessageText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  convRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  convTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Live Chat View */
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44),
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  chatHeaderAvatarImg: {
    width: '100%',
    height: '100%',
  },
  chatHeaderMeta: {
    flex: 1,
  },
  chatPartnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  chatPartnerRole: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  chatActionBtn: {
    padding: 6,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    width: '100%',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowPartner: {
    justifyContent: 'flex-start',
  },
  bubbleMe: {
    maxWidth: '80%',
    borderRadius: 14,
    borderBottomRightRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMeText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTimeMe: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bubblePartner: {
    maxWidth: '80%',
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubblePartnerText: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 18,
  },
  bubbleTimePartner: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1E1B4B',
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
  },
  chatAttachBtn: {
    padding: 6,
  },
  filterBtnActive: {
    backgroundColor: '#6114D6',
    borderColor: '#6114D6',
  },

  /* Modals Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  /* 3-Dots Options Card */
  optionsCard: {
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
  optionsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  optionsIcon: {
    width: 22,
    textAlign: 'center',
  },
  optionsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  textDanger: {
    color: '#EF4444',
  },
  optionsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  optionsThickDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  optionsCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  optionsCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },

  /* Group Members Modal */
  membersCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  membersHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  membersList: {
    paddingVertical: 10,
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  memberOnlineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  memberRole: {
    fontSize: 11.5,
    color: '#64748B',
  },
  adminBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  membersCloseBtn: {
    marginTop: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  membersCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Filter Modal Card */
  filterModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    gap: 16,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterSection: {
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  filterResetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterResetBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterApplyBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  filterApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
