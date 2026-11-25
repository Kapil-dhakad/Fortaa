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
  ActivityIndicator,
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

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const filterTabs = ['All', 'Unread', 'Direct', 'Group'];

  // Default sample conversations matching Screenshot 4
  const defaultConversations = [
    {
      id: '1',
      name: 'kapil',
      role: 'Silver Leader',
      avatarType: 'kapil',
      lastMessage: 'Hello',
      time: '17:25',
    },
    {
      id: '2',
      name: 'Fortaa',
      role: 'Member',
      avatarType: 'fortaa',
      lastMessage: 'hyl',
      time: '19:37',
    },
    {
      id: '3',
      name: 'Success Mindset & Moti...',
      role: 'Member',
      avatarType: 'group',
      lastMessage: 'Welcome to the group!',
      time: '14:04',
      isGroup: true,
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

          <TouchableOpacity style={styles.chatActionBtn}>
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
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: CONVERSATIONS LIST (Screenshot 4 Match)
  // ─────────────────────────────────────────────────────────────
  const filteredList = conversationList.filter((item) => {
    if (activeFilter === 'Unread') return false;
    if (activeFilter === 'Direct') return !item.isGroup;
    if (activeFilter === 'Group') return item.isGroup;
    return true;
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
        </View>

        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Feather name="sliders" size={18} color="#6114D6" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
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
    paddingTop: Platform.OS === 'ios' ? 44 : 26,
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
});
