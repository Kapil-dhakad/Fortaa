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
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import LeaderProfileModal from '../components/LeaderProfileModal';
import {
  getConversationsApi,
  getChatHistoryApi,
  sendMessageApi,
  deleteChatMessageApi,
  uploadChatMediaApi,
} from '../services/api';
import { refreshUnreadCounts } from '../services/unreadCountService';

const { width } = Dimensions.get('window');

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessagesScreen({
  currentUser,
  activeChatPartner,
  onBackToConversations,
  onChatPartnerOpen,
}) {
  const [selectedPartner, setSelectedPartner] = useState(activeChatPartner || null);

  useEffect(() => {
    if (activeChatPartner) {
      setSelectedPartner(activeChatPartner);
    }
  }, [activeChatPartner]);

  useEffect(() => {
    if (onChatPartnerOpen) {
      onChatPartnerOpen(selectedPartner);
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (!selectedPartner) return;
    const keyboardShowSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    return () => {
      keyboardShowSub.remove();
    };
  }, [selectedPartner]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter Popup State
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
  const [selectedLeaderProfile, setSelectedLeaderProfile] = useState(null);

  // Attachment Menu State (+)
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

  // WhatsApp Style Message Action & Reactions State
  const [selectedMsgForMenu, setSelectedMsgForMenu] = useState(null);
  const [reactions, setReactions] = useState({}); // { [msgId]: emoji }
  const [replyingTo, setReplyingTo] = useState(null);

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
        refreshUnreadCounts(currentUser.id);
      });
    }
  }, [selectedPartner?.id, currentUser?.id]);

  // Send Text Message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !selectedPartner) return;

    const myUserId = currentUser?.id || 999;
    const currentReply = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment.name}` : ''),
          name: replyingTo.sender_id === myUserId ? 'You' : selectedPartner.name,
        }
      : null;

    const tempMsg = {
      id: String(Date.now()),
      sender_id: myUserId,
      receiver_id: selectedPartner.id,
      text,
      replyTo: currentReply,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setReplyingTo(null);
    setSending(true);

    try {
      if (currentUser?.id && selectedPartner.id) {
        await sendMessageApi({
          senderId: currentUser.id,
          receiverId: selectedPartner.id,
          text,
          replyTo: currentReply,
        });
      }
    } catch (err) {
      console.warn('Message send error:', err);
    } finally {
      setSending(false);
    }
  };

  // Send Attachment (Image, Video, Document/PDF)
  const sendAttachmentMessage = async (attachment) => {
    setAttachmentMenuOpen(false);
    if (!selectedPartner) return;

    const myUserId = currentUser?.id || 999;
    const currentReply = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment.name}` : ''),
          name: replyingTo.sender_id === myUserId ? 'You' : selectedPartner.name,
        }
      : null;

    const tempMsg = {
      id: String(Date.now()),
      sender_id: myUserId,
      receiver_id: selectedPartner.id,
      text: '',
      attachment,
      replyTo: currentReply,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setReplyingTo(null);

    try {
      if (currentUser?.id && selectedPartner.id) {
        await sendMessageApi({
          senderId: currentUser.id,
          receiverId: selectedPartner.id,
          text: '',
          attachment,
          replyTo: currentReply,
        });
      }
    } catch (err) {
      console.warn('send attachment error:', err);
    }
  };

  // Handle Pick Attachment (Web + Native Universal)
  const handlePickAttachment = async (category) => {
    setAttachmentMenuOpen(false);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      if (category === 'image') input.accept = 'image/*';
      else if (category === 'video') input.accept = 'video/*';
      else input.accept = '.pdf,.doc,.docx,.txt,application/pdf';

      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeFormatted =
          file.size > 1024 * 1024
            ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
            : (file.size / 1024).toFixed(0) + ' KB';

        let fileUrl = '';
        try {
          const res = await uploadChatMediaApi(file);
          if (res && res.url) fileUrl = res.url;
        } catch (err) {}

        if (!fileUrl) {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result || '');
            reader.readAsDataURL(file);
          });
        }

        sendAttachmentMessage({
          type: category,
          url: fileUrl,
          name: file.name,
          size: sizeFormatted,
        });
      };
      input.click();
    } else {
      // Native Mobile (ImagePicker)
      try {
        const mediaTypes = category === 'video' ? ['videos'] : ['images'];
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes,
          quality: 0.8,
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          const filename = asset.fileName || (category === 'video' ? 'video.mp4' : 'photo.jpg');

          let uploadedUrl = asset.uri;
          try {
            const apiRes = await uploadChatMediaApi(asset.uri, category === 'video' ? 'video/mp4' : 'image/jpeg', filename);
            if (apiRes?.url) uploadedUrl = apiRes.url;
          } catch (e) {}

          sendAttachmentMessage({
            type: category === 'video' ? 'video' : 'image',
            url: uploadedUrl,
            name: filename,
            size: '1.5 MB',
          });
        }
      } catch (err) {
        Alert.alert('Error picking media', err.message);
      }
    }
  };

  // Toggle Emoji Reaction on a Message
  const handleToggleReaction = (msgId, emoji) => {
    setReactions((prev) => {
      const cur = prev[msgId];
      if (cur === emoji) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: emoji };
    });
    setSelectedMsgForMenu(null);
  };

  // Reply Message
  const handleReplyMessage = (msg) => {
    setReplyingTo(msg);
    setSelectedMsgForMenu(null);
  };

  // Copy Message
  const handleCopyMessage = (msg) => {
    const textToCopy = msg.text || msg.attachment?.name || '';
    if (textToCopy) {
      if (Platform.OS === 'web' && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(textToCopy);
      }
      Alert.alert('Copied 📋', 'Message copied to clipboard');
    }
    setSelectedMsgForMenu(null);
  };

  // Delete Message (Delete for me / Delete for everyone)
  const handleDeleteMessage = (msg, deleteForEveryone = false) => {
    setSelectedMsgForMenu(null);
    const myUserId = currentUser?.id || 999;

    if (deleteForEveryone) {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(msg.id)
            ? { ...m, is_deleted: true, text: '🚫 This message was deleted', attachment: null }
            : m
        )
      );
      deleteChatMessageApi(msg.id, myUserId, true);
      Alert.alert('Deleted', 'Message deleted for everyone');
    } else {
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(msg.id)));
      deleteChatMessageApi(msg.id, myUserId, false);
      Alert.alert('Deleted', 'Message deleted for you');
    }
  };

  // Filter Conversations List
  const isFilterActive = filterRole !== 'All' || filterStatus !== 'All' || sortBy !== 'recent';

  const filteredList = conversationList
    .filter((item) => {
      if (activeFilter === 'Unread' && !item.unread) return false;
      if (activeFilter === 'Direct' && item.isGroup) return false;
      if (activeFilter === 'Group' && !item.isGroup) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesMsg = (item.lastMessage || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMsg) return false;
      }

      if (filterRole !== 'All' && item.role !== filterRole) return false;
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

  // ─────────────────────────────────────────────────────────────
  // RENDER: LIVE CHAT VIEW
  // ─────────────────────────────────────────────────────────────
  if (selectedPartner) {
    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

          <TouchableOpacity
            style={styles.chatHeaderAvatar}
            onPress={() => setSelectedLeaderProfile(selectedPartner)}
            activeOpacity={0.8}
          >
            <Image
              source={
                selectedPartner.avatar_url || selectedPartner.avatarUrl
                  ? { uri: selectedPartner.avatar_url || selectedPartner.avatarUrl }
                  : selectedPartner.avatarType === 'fortaa'
                  ? require('../../assets/figma/logo_icon_img.png')
                  : require('../../assets/dashboard/user_avatar_rahul.png')
              }
              style={styles.chatHeaderAvatarImg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatHeaderMeta}
            onPress={() => setSelectedLeaderProfile(selectedPartner)}
            activeOpacity={0.8}
          >
            <Text style={styles.chatPartnerName} numberOfLines={1}>
              {selectedPartner.name}
            </Text>
            <Text style={styles.chatPartnerRole}>
              {selectedPartner.role || 'Active Member'}
            </Text>
          </TouchableOpacity>

          {/* Three-dots Button (Opens Popover right near here) */}
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
            const msgReaction = reactions[item.id];

            return (
              <View
                style={[
                  styles.bubbleRow,
                  isMe ? styles.bubbleRowMe : styles.bubbleRowPartner,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.92}
                  onLongPress={() => setSelectedMsgForMenu(item)}
                  delayLongPress={250}
                  style={[
                    styles.bubbleContainer,
                    isMe ? styles.bubbleMeContainer : styles.bubblePartnerContainer,
                  ]}
                >
                  {isMe ? (
                    <LinearGradient
                      colors={['#BE84FC', '#6420D6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubbleMe}
                    >
                      {/* Quoted Reply Preview */}
                      {item.replyTo ? (
                        <View style={styles.quotedMsgBoxMe}>
                          <Text style={styles.quotedSenderNameMe}>{item.replyTo.name}</Text>
                          <Text style={styles.quotedTextMe} numberOfLines={2}>
                            {item.replyTo.text}
                          </Text>
                        </View>
                      ) : null}

                      {/* Attachment Render */}
                      {item.attachment ? (
                        <View style={styles.attachmentWrapper}>
                          {item.attachment.type === 'story_reply' || item.attachment.type === 'story_share' ? (
                            <View style={styles.storyReplyCardWrapper}>
                              <Text style={[styles.storyReplyAuthorLabel, styles.storyReplyAuthorLabelMe]}>
                                Replied to {item.attachment.authorName ? `@${item.attachment.authorName}'s story` : 'story'}
                              </Text>
                              <View style={styles.storyReplyMediaCard}>
                                {item.attachment.mediaUrl ? (
                                  <Image
                                    source={{ uri: item.attachment.mediaUrl }}
                                    style={styles.storyReplyThumbImg}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <LinearGradient
                                    colors={['#6366F1', '#9333EA']}
                                    style={styles.storyReplyTextThumb}
                                  >
                                    <Text style={styles.storyReplyTextThumbContent} numberOfLines={4}>
                                      {item.attachment.textContent || 'Story'}
                                    </Text>
                                  </LinearGradient>
                                )}
                                {item.attachment.mediaType === 'video' && (
                                  <View style={styles.storyReplyVideoBadge}>
                                    <Ionicons name="play" size={14} color="#FFFFFF" />
                                  </View>
                                )}
                              </View>
                            </View>
                          ) : item.attachment.type === 'image' ? (
                            <Image
                              source={{ uri: item.attachment.url }}
                              style={styles.attachmentImage}
                              resizeMode="cover"
                            />
                          ) : item.attachment.type === 'video' ? (
                            <View style={styles.attachmentVideoBox}>
                              <Ionicons name="play-circle" size={40} color="#FFFFFF" />
                              <Text style={styles.attachmentVideoText}>
                                {item.attachment.name || 'Video'}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.attachmentDocBox}>
                              <Feather name="file-text" size={24} color="#FFFFFF" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.attachmentDocName} numberOfLines={1}>
                                  {item.attachment.name}
                                </Text>
                                <Text style={styles.attachmentDocSize}>
                                  {item.attachment.size}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ) : null}

                      {/* Text */}
                      {item.text ? (
                        <Text
                          style={[
                            styles.bubbleMeText,
                            item.is_deleted && styles.deletedTextMe,
                          ]}
                        >
                          {(item.text || '')
                            .replace(/^\[Story Reply\]\s*/i, '')
                            .replace(/^Replied to story:\s*"?/i, '')
                            .replace(/"?$/, '')}
                        </Text>
                      ) : null}

                      <View style={styles.bubbleTimeRow}>
                        <Text style={styles.bubbleTimeMe}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </Text>
                        <Feather name="check" size={11} color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.bubblePartner}>
                      {/* Quoted Reply Preview */}
                      {item.replyTo ? (
                        <View style={styles.quotedMsgBoxPartner}>
                          <Text style={styles.quotedSenderNamePartner}>
                            {item.replyTo.name}
                          </Text>
                          <Text style={styles.quotedTextPartner} numberOfLines={2}>
                            {item.replyTo.text}
                          </Text>
                        </View>
                      ) : null}

                      {/* Attachment Render */}
                      {item.attachment ? (
                        <View style={styles.attachmentWrapper}>
                          {item.attachment.type === 'story_reply' || item.attachment.type === 'story_share' ? (
                            <View style={styles.storyReplyCardWrapper}>
                              <Text style={[styles.storyReplyAuthorLabel, styles.storyReplyAuthorLabelPartner]}>
                                Replied to your story
                              </Text>
                              <View style={styles.storyReplyMediaCard}>
                                {item.attachment.mediaUrl ? (
                                  <Image
                                    source={{ uri: item.attachment.mediaUrl }}
                                    style={styles.storyReplyThumbImg}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <LinearGradient
                                    colors={['#6366F1', '#9333EA']}
                                    style={styles.storyReplyTextThumb}
                                  >
                                    <Text style={styles.storyReplyTextThumbContent} numberOfLines={4}>
                                      {item.attachment.textContent || 'Story'}
                                    </Text>
                                  </LinearGradient>
                                )}
                                {item.attachment.mediaType === 'video' && (
                                  <View style={styles.storyReplyVideoBadge}>
                                    <Ionicons name="play" size={14} color="#FFFFFF" />
                                  </View>
                                )}
                              </View>
                            </View>
                          ) : item.attachment.type === 'image' ? (
                            <Image
                              source={{ uri: item.attachment.url }}
                              style={styles.attachmentImage}
                              resizeMode="cover"
                            />
                          ) : item.attachment.type === 'video' ? (
                            <View style={[styles.attachmentVideoBox, { backgroundColor: '#475569' }]}>
                              <Ionicons name="play-circle" size={40} color="#FFFFFF" />
                              <Text style={styles.attachmentVideoText}>
                                {item.attachment.name || 'Video'}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.attachmentDocBox, { backgroundColor: '#F1F5F9' }]}>
                              <Feather name="file-text" size={24} color="#EF4444" />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[styles.attachmentDocName, { color: '#0F172A' }]}
                                  numberOfLines={1}
                                >
                                  {item.attachment.name}
                                </Text>
                                <Text style={[styles.attachmentDocSize, { color: '#64748B' }]}>
                                  {item.attachment.size}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ) : null}

                      {/* Text */}
                      {item.text ? (
                        <Text
                          style={[
                            styles.bubblePartnerText,
                            item.is_deleted && styles.deletedTextPartner,
                          ]}
                        >
                          {(item.text || '')
                            .replace(/^\[Story Reply\]\s*/i, '')
                            .replace(/^Replied to story:\s*"?/i, '')
                            .replace(/"?$/, '')}
                        </Text>
                      ) : null}

                      <Text style={styles.bubbleTimePartner}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </Text>
                    </View>
                  )}

                  {/* Reaction Emoji Badge */}
                  {msgReaction ? (
                    <View
                      style={[
                        styles.reactionBadge,
                        isMe ? styles.reactionBadgeMe : styles.reactionBadgePartner,
                      ]}
                    >
                      <Text style={styles.reactionBadgeEmoji}>{msgReaction}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* Replying Preview Banner */}
        {replyingTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyIndicatorBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyingToName}>
                Replying to{' '}
                {replyingTo.sender_id === (currentUser?.id || 999)
                  ? 'yourself'
                  : selectedPartner.name}
              </Text>
              <Text style={styles.replyingToText} numberOfLines={1}>
                {replyingTo.text ||
                  (replyingTo.attachment ? `📎 ${replyingTo.attachment.name}` : 'Message')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.cancelReplyBtn}>
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Attachment Options Popover Menu (+) */}
        {attachmentMenuOpen && (
          <View style={styles.attachmentSheetBox}>
            <TouchableOpacity
              style={styles.attachOptionItem}
              onPress={() => handlePickAttachment('image')}
            >
              <View style={[styles.attachIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="image" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.attachOptionLabel}>Photos & Media</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachOptionItem}
              onPress={() => handlePickAttachment('video')}
            >
              <View style={[styles.attachIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="video" size={18} color="#0284C7" />
              </View>
              <Text style={styles.attachOptionLabel}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachOptionItem}
              onPress={() => handlePickAttachment('document')}
            >
              <View style={[styles.attachIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="file-text" size={18} color="#DC2626" />
              </View>
              <Text style={styles.attachOptionLabel}>Document / PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input Bar */}
        <View style={styles.chatInputBar}>
          <TouchableOpacity
            style={styles.chatAttachBtn}
            onPress={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
            activeOpacity={0.7}
          >
            <Feather
              name={attachmentMenuOpen ? 'x' : 'plus-circle'}
              size={22}
              color={attachmentMenuOpen ? '#5321E8' : '#64748B'}
            />
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

        {/* ─── TOP-RIGHT 3-DOTS SMOOTH DROPDOWN POPOVER ─── */}
        <Modal
          visible={chatOptionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setChatOptionsOpen(false)}
        >
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setChatOptionsOpen(false)}
          >
            <View style={styles.topRightOptionsCard}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setChatOptionsOpen(false);
                  setSelectedLeaderProfile(selectedPartner);
                }}
              >
                <Feather name="user" size={16} color="#5321E8" />
                <Text style={styles.dropdownItemText}>View Profile</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setChatOptionsOpen(false);
                  Alert.alert(
                    'Notifications Muted',
                    `Muted notifications for ${selectedPartner.name}`
                  );
                }}
              >
                <Feather name="bell-off" size={16} color="#64748B" />
                <Text style={styles.dropdownItemText}>Mute Notifications</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setChatOptionsOpen(false);
                  setMessages([]);
                  Alert.alert('Chat Cleared', 'All messages have been cleared');
                }}
              >
                <Feather name="trash-2" size={16} color="#64748B" />
                <Text style={styles.dropdownItemText}>Clear Chat</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setChatOptionsOpen(false);
                  Alert.alert('User Blocked', `${selectedPartner.name} has been blocked.`);
                }}
              >
                <Feather name="slash" size={16} color="#EF4444" />
                <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Block User</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ─── WHATSAPP-STYLE MESSAGE ACTION & REACTION MODAL ─── */}
        <Modal
          visible={!!selectedMsgForMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMsgForMenu(null)}
        >
          <TouchableOpacity
            style={styles.msgMenuBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedMsgForMenu(null)}
          >
            <View style={styles.msgMenuCard}>
              {/* Top Quick Emoji Reactions Bar */}
              <View style={styles.emojiReactionsRow}>
                {QUICK_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiBtn}
                    onPress={() => handleToggleReaction(selectedMsgForMenu.id, emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.msgMenuDivider} />

              {/* Action Buttons: Reply, Copy, Delete */}
              <TouchableOpacity
                style={styles.msgMenuItem}
                onPress={() => handleReplyMessage(selectedMsgForMenu)}
              >
                <Feather name="corner-up-left" size={18} color="#5321E8" />
                <Text style={styles.msgMenuItemText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.msgMenuItem}
                onPress={() => handleCopyMessage(selectedMsgForMenu)}
              >
                <Feather name="copy" size={18} color="#475569" />
                <Text style={styles.msgMenuItemText}>Copy Text</Text>
              </TouchableOpacity>

              {/* Delete Options */}
              {selectedMsgForMenu &&
              selectedMsgForMenu.sender_id === (currentUser?.id || 999) ? (
                <>
                  <TouchableOpacity
                    style={styles.msgMenuItem}
                    onPress={() => handleDeleteMessage(selectedMsgForMenu, true)}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <Text style={[styles.msgMenuItemText, { color: '#EF4444' }]}>
                      Delete for everyone
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.msgMenuItem}
                    onPress={() => handleDeleteMessage(selectedMsgForMenu, false)}
                  >
                    <Feather name="trash" size={18} color="#64748B" />
                    <Text style={styles.msgMenuItemText}>Delete for me</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.msgMenuItem}
                  onPress={() => handleDeleteMessage(selectedMsgForMenu, false)}
                >
                  <Feather name="trash" size={18} color="#EF4444" />
                  <Text style={[styles.msgMenuItemText, { color: '#EF4444' }]}>
                    Delete for me
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Leader Profile Modal */}
        {selectedLeaderProfile && (
          <LeaderProfileModal
            visible={!!selectedLeaderProfile}
            leader={selectedLeaderProfile}
            currentUser={currentUser}
            onClose={() => setSelectedLeaderProfile(null)}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: CONVERSATIONS LIST VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* 1. Search Bar with Filter Sliders Icon */}
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

      {/* 2. Filter Pills Row */}
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
              {item.avatar_url || item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatar_url || item.avatarUrl }}
                  style={styles.convAvatarImg}
                />
              ) : item.avatarType === 'fortaa' ? (
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

      {/* Filter Popup Modal */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalOpen(false)}
        >
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
        </TouchableOpacity>
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
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 13.5, color: '#1E1B4B' },
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
  filterBtnActive: { backgroundColor: '#6114D6', borderColor: '#6114D6' },

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
  filterPillActive: { backgroundColor: '#6114D6' },
  filterPillText: { fontSize: 12.5, fontWeight: '600', color: '#475569' },
  filterPillTextActive: { color: '#FFFFFF' },

  /* Conversation Cards */
  convListContent: { paddingHorizontal: 16, gap: 8 },
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
  convAvatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  convAvatarImg: { width: '100%', height: '100%' },
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
  fortaaLogoImg: { width: 30, height: 30 },
  convMeta: { flex: 1, gap: 2 },
  convName: { fontSize: 14.5, fontWeight: '700', color: '#111827' },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleBadgeText: { fontSize: 11, color: '#6D28D9', fontWeight: '600' },
  lastMessageText: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
  convRight: { alignItems: 'flex-end', gap: 6 },
  convTimeText: { fontSize: 11, color: '#94A3B8' },

  /* Live Chat View */
  chatContainer: { flex: 1, backgroundColor: '#F8FAFC' },
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
  backBtn: { padding: 6 },
  chatHeaderAvatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  chatHeaderAvatarImg: { width: '100%', height: '100%' },
  chatHeaderMeta: { flex: 1 },
  chatPartnerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  chatPartnerRole: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  chatActionBtn: { padding: 6 },

  messagesList: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  bubbleRow: { flexDirection: 'row', width: '100%' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowPartner: { justifyContent: 'flex-start' },

  bubbleContainer: { position: 'relative', maxWidth: '82%' },
  bubbleMeContainer: { alignItems: 'flex-end' },
  bubblePartnerContainer: { alignItems: 'flex-start' },

  bubbleMe: {
    borderRadius: 14,
    borderBottomRightRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMeText: { fontSize: 13.5, color: '#FFFFFF', lineHeight: 18 },
  deletedTextMe: { fontStyle: 'italic', opacity: 0.8 },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTimeMe: { fontSize: 10, color: 'rgba(255, 255, 255, 0.8)' },

  bubblePartner: {
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubblePartnerText: { fontSize: 13.5, color: '#1E293B', lineHeight: 18 },
  deletedTextPartner: { fontStyle: 'italic', color: '#94A3B8' },
  bubbleTimePartner: { fontSize: 10, color: '#94A3B8', marginTop: 4, alignSelf: 'flex-end' },

  /* Quoted Reply Preview Inside Bubble */
  quotedMsgBoxMe: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  quotedSenderNameMe: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  quotedTextMe: { fontSize: 11.5, color: 'rgba(255,255,255,0.9)' },

  quotedMsgBoxPartner: {
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 3,
    borderLeftColor: '#5321E8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  quotedSenderNamePartner: { fontSize: 11, fontWeight: '700', color: '#5321E8' },
  quotedTextPartner: { fontSize: 11.5, color: '#475569' },

  /* Attachments in Bubble */
  attachmentWrapper: { marginBottom: 6, borderRadius: 8, overflow: 'hidden' },
  attachmentImage: { width: 200, height: 160, borderRadius: 8, backgroundColor: '#E2E8F0' },
  attachmentVideoBox: {
    width: 200,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  attachmentVideoText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  attachmentDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 10,
    minWidth: 180,
  },
  attachmentDocName: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF' },
  attachmentDocSize: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  /* Story Reply Card (Web & Instagram Parity) */
  storyReplyCardWrapper: {
    marginBottom: 6,
    width: 150,
  },
  storyReplyAuthorLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  storyReplyAuthorLabelMe: {
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
  },
  storyReplyAuthorLabelPartner: {
    color: '#64748B',
    textAlign: 'left',
  },
  storyReplyMediaCard: {
    width: 150,
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyReplyThumbImg: {
    width: '100%',
    height: '100%',
  },
  storyReplyTextThumb: {
    width: '100%',
    height: '100%',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyReplyTextThumbContent: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  storyReplyVideoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Reaction Emoji Badge on Bubble */
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionBadgeMe: { right: 8 },
  reactionBadgePartner: { left: 8 },
  reactionBadgeEmoji: { fontSize: 12 },

  /* Replying Banner Above Input */
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  replyIndicatorBar: { width: 3, height: '100%', backgroundColor: '#5321E8', borderRadius: 2 },
  replyingToName: { fontSize: 12, fontWeight: '700', color: '#5321E8' },
  replyingToText: { fontSize: 11.5, color: '#64748B' },
  cancelReplyBtn: { padding: 4 },

  /* Attachment Options Sheet (+) */
  attachmentSheetBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  attachOptionItem: { alignItems: 'center', gap: 6 },
  attachIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionLabel: { fontSize: 11, fontWeight: '600', color: '#334155' },

  /* Bottom Input Bar */
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  chatAttachBtn: { padding: 4 },
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
  chatSendBtnDisabled: { opacity: 0.5 },

  /* Top-Right 3-Dots Smooth Popover */
  dropdownBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)' },
  topRightOptionsCard: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 46 : 52),
    right: 12,
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemText: { fontSize: 13.5, fontWeight: '600', color: '#1E293B' },
  dropdownDivider: { height: 1, backgroundColor: '#F1F5F9' },

  /* Message Long Press Menu Backdrop & Card */
  msgMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  msgMenuCard: {
    width: '100%',
    maxWidth: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  emojiReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  emojiText: { fontSize: 20 },
  msgMenuDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 4 },
  msgMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  msgMenuItemText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },

  /* Modals Overlay & Filter Card */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterModalTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  filterSection: { marginBottom: 14 },
  filterSectionTitle: { fontSize: 12.5, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#5321E8', borderColor: '#5321E8' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF' },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterResetBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  filterResetBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterApplyBtn: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  filterApplyBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
