import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import {
  getSocket,
  joinChat,
  emitSendMessage,
  subscribeToNewMessages,
  subscribeToSentMessage,
  subscribeToOnlineUsers,
  subscribeToTyping,
  subscribeToStopTyping,
  emitMarkRead,
  subscribeToMessagesRead,
  joinGroupRoom,
  leaveGroupRoom,
  subscribeToGroupMessagesRead,
} from '../../services/socket.service';
import {
  fetchConversations,
  fetchChatHistory,
  sendChatMessageHttp,
  deleteChatMessageHttp,
} from '../../services/message.service';

// React Icons
import {
  FiSearch,
  FiPhone,
  FiVideo,
  FiPaperclip,
  FiChevronRight,
  FiChevronLeft,
  FiDownload,
  FiImage,
  FiFileText,
  FiPlus,
  FiMic,
  FiHome,
  FiUsers,
  FiAward,
  FiMessageSquare,
  FiShield,
  FiChevronDown,
  FiInfo,
  FiCornerUpLeft,
  FiCopy,
  FiCornerUpRight,
  FiTrash2,
} from 'react-icons/fi';
import {
  BsSliders,
  BsThreeDotsVertical,
  BsEmojiSmile,
  BsPatchCheckFill,
  BsBriefcaseFill,
  BsPeopleFill,
  BsPersonCheckFill,
  BsFileEarmarkPdfFill,
  BsThreeDots,
  BsPinAngle,
} from 'react-icons/bs';
import {
  IoSend,
  IoCheckmark,
  IoCheckmarkDone,
  IoPlayCircle,
} from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';

// Asset Images
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import GroupMembersModal from '../../components/modals/GroupMembersModal';
import IncomingCallModal from '../../components/modals/IncomingCallModal';
import CallModal from '../../components/modals/CallModal';
import './MessagesPage.css';

// Popular Emojis categorized for the interactive picker
const POPULAR_EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩', '🥳', '🤔', '🤫', '😴',
  '👍', '👏', '🙏', '🤝', '✌️', '👌', '❤️', '🔥', '⭐', '✨', '💯', '🎯',
  '💼', '📈', '📊', '🚀', '💡', '🏆', '🎉', '💰', '📱', '💻', '☕', '💪',
];

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectUserId = searchParams.get('userId') || (searchParams.get('groupId') ? `group_${searchParams.get('groupId')}` : null);

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fortaa_user') || '{}');
    } catch {
      return {};
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Keep a live ref to selectedContact to prevent any async / socket message race conditions
  const selectedContactRef = useRef(null);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Attachment & Emoji dropdown state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const groupMenuRef = useRef(null);

  // Mobile navigation screen view: 'list' (Image 1) or 'chat' (Image 2)
  const [mobileActiveScreen, setMobileActiveScreen] = useState(
    () => (preselectUserId ? 'chat' : 'list')
  );
  const [mobileAttachmentOpen, setMobileAttachmentOpen] = useState(false);

  // WhatsApp Message Action Dropdown & Reactions state
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);
  const [reactions, setReactions] = useState({}); // { [msgId]: { [userId]: emoji } }
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);
  const [infoModalMsg, setInfoModalMsg] = useState(null);
  const [forwardModalMsg, setForwardModalMsg] = useState(null);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [showMoreEmojisMsgId, setShowMoreEmojisMsgId] = useState(null);

  // Helper to extract all emoji reactions on a message
  const getMsgReactionList = (msgId) => {
    const r = reactions[msgId];
    if (!r) return [];
    if (typeof r === 'string') return [r];
    if (typeof r === 'object') return Object.values(r).filter(Boolean);
    return [];
  };

  // Helper to check logged in user's reaction on a message
  const getMyReaction = (msgId) => {
    const r = reactions[msgId];
    if (!r) return null;
    if (typeof r === 'string') return r;
    const myUid = effectiveUserId || currentUserId;
    return r[myUid] || null;
  };

  // WhatsApp Message Dropdown click outside listener
  useEffect(() => {
    function handleMenuClickOutside(e) {
      if (!e.target?.closest?.('.wa-msg-dropdown-container, .msg-bubble-menu-trigger, .wa-more-emojis-picker')) {
        setActiveMenuMsgId(null);
        setShowMoreEmojisMsgId(null);
      }
    }
    if (activeMenuMsgId || showMoreEmojisMsgId) {
      document.addEventListener('mousedown', handleMenuClickOutside);
      document.addEventListener('touchstart', handleMenuClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleMenuClickOutside);
      document.removeEventListener('touchstart', handleMenuClickOutside);
    };
  }, [activeMenuMsgId, showMoreEmojisMsgId]);

  const handleOpenMenu = (e, msgId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setMenuOpenUpward(spaceBelow < 300);
    setActiveMenuMsgId((prev) => (prev === msgId ? null : msgId));
  };

  const handleBubbleClick = (e, msg) => {
    // On mobile responsive, clicking anywhere on the message opens the WhatsApp dropdown
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuOpenUpward(spaceBelow < 300);
      setActiveMenuMsgId((prev) => (prev === msg.id ? null : msg.id));
    }
  };

  const handleToggleReaction = (msgId, emoji) => {
    const myUserId = effectiveUserId || currentUserId;
    const socket = getSocket();
    const isGroup = selectedContact?.is_group || String(selectedContact?.user_id).startsWith('group_');
    const gid = isGroup ? parseInt(String(selectedContact.user_id).replace('group_', ''), 10) : null;

    let targetEmoji = emoji;
    setReactions((prev) => {
      const cur = prev[msgId];
      const myExisting = typeof cur === 'object' ? cur?.[myUserId] : (typeof cur === 'string' ? cur : null);
      if (myExisting === emoji) {
        targetEmoji = null; // Un-react
        const nextMsgReactions = typeof cur === 'object' ? { ...cur } : {};
        delete nextMsgReactions[myUserId];
        return { ...prev, [msgId]: nextMsgReactions };
      }
      const nextMsgReactions = typeof cur === 'object' ? { ...cur, [myUserId]: emoji } : { [myUserId]: emoji };
      return { ...prev, [msgId]: nextMsgReactions };
    });

    if (socket && socket.connected) {
      socket.emit('message_reaction', {
        messageId: msgId,
        emoji: targetEmoji,
        senderId: myUserId,
        receiverId: isGroup ? null : selectedContact?.user_id,
        groupId: gid,
      });
    }
    setActiveMenuMsgId(null);
  };

  const handleDeleteForEveryone = (msg) => {
    const socket = getSocket();
    const myUserId = effectiveUserId || currentUserId;
    const isGroup = selectedContact?.is_group || String(selectedContact?.user_id).startsWith('group_');
    const gid = isGroup ? parseInt(String(selectedContact.user_id).replace('group_', ''), 10) : null;

    if (socket && socket.connected) {
      socket.emit('delete_message', {
        messageId: msg.id,
        deleteForEveryone: true,
        senderId: myUserId,
        receiverId: isGroup ? null : selectedContact?.user_id,
        groupId: gid,
      });
    }
    deleteChatMessageHttp(msg.id, myUserId, true);

    setMessages((prev) =>
      prev.map((m) =>
        String(m.id) === String(msg.id)
          ? { ...m, is_deleted: true, text: 'You deleted this message', attachment: null }
          : m
      )
    );
    toast.success('Message deleted for everyone');
    setDeleteModalMsg(null);
  };

  const handleDeleteForMe = (msg) => {
    const socket = getSocket();
    const myUserId = effectiveUserId || currentUserId;

    if (socket && socket.connected) {
      socket.emit('delete_message', {
        messageId: msg.id,
        deleteForMe: true,
        senderId: myUserId,
      });
    }
    deleteChatMessageHttp(msg.id, myUserId, false);

    setMessages((prev) => prev.filter((m) => String(m.id) !== String(msg.id)));
    toast.success('Message deleted for you');
    setDeleteModalMsg(null);
  };

  const handleCopyMessage = (msg) => {
    const textToCopy = msg.text || msg.attachment?.name || '';
    if (textToCopy) {
      navigator.clipboard?.writeText?.(textToCopy);
      toast.success('Message copied!');
    }
    setActiveMenuMsgId(null);
  };

  const handleReplyMessage = (msg) => {
    setReplyingTo(msg);
    setActiveMenuMsgId(null);
  };

  const handlePinMessage = (msg) => {
    const isCurrentlyPinned = pinnedMessageId === msg.id;
    setPinnedMessageId(isCurrentlyPinned ? null : msg.id);
    toast.success(isCurrentlyPinned ? 'Message unpinned' : 'Message pinned!');
    setActiveMenuMsgId(null);
  };

  const handleMessageInfo = (msg) => {
    setInfoModalMsg(msg);
    setActiveMenuMsgId(null);
  };

  const handleForwardMessage = (msg) => {
    setForwardModalMsg(msg);
    setForwardSearchQuery('');
    setActiveMenuMsgId(null);
  };

  const handleExecuteForward = (targetContact, msgToForward) => {
    const myUserId = effectiveUserId || currentUserId;
    const socket = getSocket();
    const fwdText = msgToForward.text || '';
    const fwdAttachment = msgToForward.attachment || null;

    if (socket && socket.connected) {
      emitSendMessage({
        senderId: myUserId,
        receiverId: targetContact.user_id,
        text: fwdText,
        attachment: fwdAttachment,
      });
    } else {
      sendChatMessageHttp({
        senderId: myUserId,
        receiverId: targetContact.user_id,
        text: fwdText,
        attachment: fwdAttachment,
      });
    }
    toast.success(`Forwarded to ${targetContact.name}!`);
    setForwardModalMsg(null);
    setForwardSearchQuery('');
  };

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const attachmentRef = useRef(null);

  const currentUserId = currentUser.id || currentUser._id;
  const effectiveUserId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
      return u?.id || u?._id || currentUserId || null;
    } catch {
      return currentUserId || null;
    }
  }, [currentUser, currentUserId]);

  // ── 📞 1-on-1 Audio & Video Calling State ──
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // Listen for Incoming Calls
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const handleIncomingCall = (callData) => {
      if (activeCall) {
        // User is already in an active call, signal busy
        s.emit('call_reject', { toUserId: callData.fromUserId, reason: 'busy' });
        return;
      }
      setIncomingCallData(callData);
    };

    s.on('call_incoming', handleIncomingCall);

    return () => {
      s.off('call_incoming', handleIncomingCall);
    };
  }, [activeCall]);

  const handleStartCall = (callType = 'video') => {
    if (!selectedContact || !selectedContact.user_id) {
      toast.error('Select a contact to start a call');
      return;
    }
    if (selectedContact.category === 'Group' || String(selectedContact.user_id).startsWith('group_')) {
      toast.error('Group calling coming soon!');
      return;
    }

    const s = getSocket();
    if (!s || !s.connected) {
      toast.error('Connecting to chat server, please retry in a second');
      return;
    }

    setActiveCall({
      isCaller: true,
      callType,
      targetUser: {
        id: selectedContact.user_id,
        name: selectedContact.name || selectedContact.username || 'Fortaa Leader',
        avatarUrl: selectedContact.avatar || selectedContact.avatarUrl || null,
        role: selectedContact.role || 'Member',
      },
    });
  };

  const handleAcceptIncomingCall = (callData) => {
    setIncomingCallData(null);
    setActiveCall({
      isCaller: false,
      callType: callData.callType || 'video',
      targetUser: {
        id: callData.fromUserId,
        name: callData.callerName,
        avatarUrl: callData.callerAvatar,
        role: callData.callerRole,
      },
    });
  };

  const handleDeclineIncomingCall = (callData) => {
    const s = getSocket();
    if (s && callData?.fromUserId) {
      s.emit('call_reject', { toUserId: callData.fromUserId, reason: 'declined' });
    }
    setIncomingCallData(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Click outside listener for emoji & attachment dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setAttachmentMenuOpen(false);
      }
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target)) {
        setGroupMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if active contact is strictly online
  const isContactOnline = Boolean(
    selectedContact && onlineUserIds.includes(String(selectedContact.user_id))
  );

  const getRoleIcon = (role) => {
    if (!role) return <BsBriefcaseFill className="msg-role-icon-svg" />;
    const r = role.toLowerCase();
    if (r.includes('partner')) return <BsBriefcaseFill className="msg-role-icon-svg" />;
    if (r.includes('team')) return <BsPeopleFill className="msg-role-icon-svg" />;
    if (r.includes('customer')) return <BsPersonCheckFill className="msg-role-icon-svg" />;
    if (r.includes('group')) return <BsPeopleFill className="msg-role-icon-svg" />;
    return <BsBriefcaseFill className="msg-role-icon-svg" />;
  };

  // 1. Initial Socket & Real Database Conversations Load
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    if (!myId) {
      setLoadingContacts(false);
      return;
    }

    try {
      getSocket();
      joinChat(myId);

      const unsubOnline = subscribeToOnlineUsers((onlineList) => {
        setOnlineUserIds(onlineList.map(String));
      });

      // Keep online status synchronized periodically
      const intervalId = setInterval(() => {
        const s = getSocket();
        if (s && s.connected) {
          s.emit('get_online_users');
        }
      }, 4000);

      // Re-sync on window focus
      const handleFocus = () => {
        joinChat(myId);
      };
      window.addEventListener('focus', handleFocus);

      async function loadContacts() {
        setLoadingContacts(true);
        try {
          const dbData = await fetchConversations(myId);
          if (Array.isArray(dbData)) {
            const realList = dbData.map((d) => ({
              user_id: d.user_id,
              name: d.name,
              role: d.designation || 'Member',
              category: d.category || 'Direct',
              last_message_text: d.last_message_text || (d.is_new_contact ? 'Start conversation' : 'Click to open conversation'),
              time: d.last_message_time
                ? new Date(d.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
              unread_count: Number(d.unread_count) || 0,
              avatar_url: d.avatar_url,
              company_brand: d.company_brand,
              is_new_contact: Boolean(d.is_new_contact),
              isRealDb: true,
            }));
            setConversations(realList);

            if (preselectUserId) {
              const found = realList.find((c) => String(c.user_id) === String(preselectUserId));
              if (found) {
                setSelectedContact(found);
              } else if (realList.length > 0) {
                setSelectedContact(realList[0]);
              }
            } else {
              setSelectedContact((prev) => {
                if (!prev) return realList[0] || null;
                const stillExists = realList.find((c) => String(c.user_id) === String(prev.user_id));
                return stillExists || realList[0] || null;
              });
            }
          }
        } catch (err) {
          console.error('[loadContacts Error]:', err);
        } finally {
          setLoadingContacts(false);
        }
      }

      loadContacts();

      return () => {
        unsubOnline();
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
      };
    } catch {
      setLoadingContacts(false);
    }
  }, [effectiveUserId, currentUserId, preselectUserId]);

  // 2. Fetch Chat History when Contact Changes (Strictly Isolated Per-Contact)
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    if (!selectedContact || !myId) {
      setMessages([]);
      return;
    }

    const targetContactId = selectedContact.user_id;
    const isGroupContact = String(targetContactId).startsWith('group_');
    const gid = isGroupContact ? parseInt(String(targetContactId).replace('group_', ''), 10) : null;

    // Immediately wipe messages from previous contact to prevent any visual leaks
    setMessages([]);
    setLoadingMessages(true);

    // Reset unread count for selected contact in sidebar
    setConversations((prev) =>
      prev.map((c) =>
        String(c.user_id) === String(targetContactId) ? { ...c, unread_count: 0 } : c
      )
    );

    if (isGroupContact && gid) {
      joinGroupRoom(gid);
      emitMarkRead({ senderId: `group_${gid}`, receiverId: myId, groupId: gid });
    } else {
      emitMarkRead({ senderId: targetContactId, receiverId: myId });
    }
    window.dispatchEvent(new CustomEvent('messages_count_refresh'));

    let isMounted = true;
    async function loadHistory() {
      try {
        const history = await fetchChatHistory(myId, targetContactId);
        window.dispatchEvent(new CustomEvent('messages_count_refresh'));
        if (!isMounted) return;

        // Ensure the active selected contact hasn't changed while fetching
        if (String(selectedContactRef.current?.user_id) !== String(targetContactId)) {
          return;
        }

        if (Array.isArray(history) && history.length > 0) {
          const loadedReactions = {};
          const formatted = history.map((m) => {
            const isMe = String(m.sender_id) === String(myId);
            let msgText = m.text;
            let msgAttachment = m.attachment;
            try {
              if (typeof msgText === 'string' && msgText.startsWith('{"') && msgText.includes('"attachment"')) {
                const parsed = JSON.parse(msgText);
                msgText = parsed.text || '';
                msgAttachment = parsed.attachment || null;
              }
            } catch {}

            if (m.reactions && Object.keys(m.reactions).length > 0) {
              loadedReactions[m.id] = m.reactions;
            }

            return {
              id: m.id,
              sender_id: m.sender_id,
              receiver_id: m.receiver_id,
              sender: isMe ? 'me' : 'them',
              text: m.is_deleted ? 'This message was deleted' : msgText,
              attachment: m.is_deleted ? null : (msgAttachment || null),
              is_deleted: Boolean(m.is_deleted),
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              status: isMe ? (m.status || (m.is_read ? 'read' : 'delivered')) : undefined,
            };
          });
          setMessages(formatted);
          setReactions((prev) => ({ ...prev, ...loadedReactions }));
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('[loadHistory Error]:', err);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted && String(selectedContactRef.current?.user_id) === String(targetContactId)) {
          setLoadingMessages(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
      if (isGroupContact && gid) {
        leaveGroupRoom(gid);
      }
    };
  }, [selectedContact?.user_id, currentUserId, effectiveUserId]);

  // 3. Socket Listeners for Real-time Messages & Read Receipts (Strict Chat Isolation)
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    if (!myId) return;

    const unsubNewMsg = subscribeToNewMessages((newMsg) => {
      const activeContact = selectedContactRef.current;

      // STRICT CHAT ISOLATION:
      // Only append to the current active chat window if this message is EXCLUSIVELY
      // between the logged-in user (myId) and the currently open contact (activeContact.user_id)
      const isForCurrentOpenChat =
        activeContact &&
        ((String(newMsg.sender_id) === String(activeContact.user_id) && String(newMsg.receiver_id) === String(myId)) ||
         (String(newMsg.sender_id) === String(myId) && String(newMsg.receiver_id) === String(activeContact.user_id)));

      if (isForCurrentOpenChat) {
        let msgText = newMsg.text;
        let msgAttachment = newMsg.attachment;
        try {
          if (typeof msgText === 'string' && msgText.startsWith('{"') && msgText.includes('"attachment"')) {
            const parsed = JSON.parse(msgText);
            msgText = parsed.text || '';
            msgAttachment = parsed.attachment || null;
          }
        } catch {}

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [
            ...prev,
            {
              id: newMsg.id || `msg_${Date.now()}`,
              sender_id: newMsg.sender_id,
              receiver_id: newMsg.receiver_id,
              sender: String(newMsg.sender_id) === String(myId) ? 'me' : 'them',
              text: msgText,
              attachment: msgAttachment || null,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: newMsg.status || 'delivered',
            },
          ];
        });

        if (String(newMsg.sender_id) === String(activeContact.user_id)) {
          emitMarkRead({ senderId: activeContact.user_id, receiverId: myId });
        }
      }

      // Update sidebar conversation preview if message involves the logged-in user
      const isForMe =
        String(newMsg.receiver_id) === String(myId) || String(newMsg.sender_id) === String(myId);

      if (isForMe) {
        const partnerId =
          String(newMsg.sender_id) === String(myId) ? newMsg.receiver_id : newMsg.sender_id;

        setConversations((prev) => {
          const partnerExists = prev.some((c) => String(c.user_id) === String(partnerId));
          const isSelected = String(selectedContactRef.current?.user_id) === String(partnerId);

          let previewSnippet = newMsg.text;
          try {
            if (typeof previewSnippet === 'string' && previewSnippet.startsWith('{"') && previewSnippet.includes('"attachment"')) {
              const parsed = JSON.parse(previewSnippet);
              previewSnippet = parsed.text || (parsed.attachment ? `📎 ${parsed.attachment.name || 'File'}` : 'New message');
            }
          } catch {}

          if (!partnerExists) {
            // Re-fetch conversation list to get new user details
            fetchConversations(myId).then((data) => {
              if (Array.isArray(data)) {
                setConversations(
                  data.map((d) => ({
                    user_id: d.user_id,
                    name: d.name,
                    role: d.designation || 'Member',
                    category: d.category || 'Direct',
                    last_message_text: d.last_message_text || 'New message',
                    time: d.last_message_time
                      ? new Date(d.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now',
                    unread_count: Number(d.unread_count) || 0,
                    avatar_url: d.avatar_url,
                    company_brand: d.company_brand,
                    isRealDb: true,
                  }))
                );
              }
            });
            return prev;
          }

          return prev.map((c) => {
            if (String(c.user_id) === String(partnerId)) {
              return {
                ...c,
                last_message_text: previewSnippet || (newMsg.attachment ? `📎 ${newMsg.attachment.name || 'File'}` : 'New message'),
                time: 'Just now',
                unread_count: isSelected ? 0 : (Number(c.unread_count) || 0) + (String(newMsg.receiver_id) === String(myId) ? 1 : 0),
              };
            }
            return c;
          });
        });
      }
    });

    const unsubSent = subscribeToSentMessage((confirmedMsg) => {
      const activeContact = selectedContactRef.current;
      // Only append to active messages if it was sent to the CURRENTLY selected contact!
      if (!activeContact || String(confirmedMsg.receiver_id) !== String(activeContact.user_id)) {
        return;
      }

      setMessages((prev) => {
        const tempIdx = prev.findIndex(
          (m) =>
            String(m.id).startsWith('temp_') &&
            (m.text === confirmedMsg.text || (m.attachment && confirmedMsg.attachment))
        );
        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = {
            ...updated[tempIdx],
            id: confirmedMsg.id,
            status: confirmedMsg.status || 'delivered',
          };
          return updated;
        }
        if (!prev.some((m) => m.id === confirmedMsg.id)) {
          return [
            ...prev,
            {
              id: confirmedMsg.id,
              sender_id: confirmedMsg.sender_id,
              receiver_id: confirmedMsg.receiver_id,
              sender: 'me',
              text: confirmedMsg.text,
              attachment: confirmedMsg.attachment || null,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: confirmedMsg.status || 'delivered',
            },
          ];
        }
        return prev;
      });
    });

    const unsubRead = subscribeToMessagesRead(({ byUserId }) => {
      const activeContact = selectedContactRef.current;
      if (activeContact && String(activeContact.user_id) === String(byUserId)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'me' ? { ...m, status: 'read' } : m))
        );
      }
    });

    const unsubGroupRead = subscribeToGroupMessagesRead(({ groupId }) => {
      const activeContact = selectedContactRef.current;
      const activeGid = activeContact?.group_id || (String(activeContact?.user_id).startsWith('group_') ? String(activeContact.user_id).replace('group_', '') : null);
      if (activeGid && String(activeGid) === String(groupId)) {
        // Mark all my messages in this group as 'read' (Blue tick)
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === 'me' ? { ...m, status: 'read', is_read: true } : m
          )
        );
      }
    });

    const unsubTyping = subscribeToTyping(({ senderId }) => {
      const activeContact = selectedContactRef.current;
      if (activeContact && String(senderId) === String(activeContact.user_id)) {
        setIsTyping(true);
      }
    });

    const unsubStopTyping = subscribeToStopTyping(({ senderId }) => {
      const activeContact = selectedContactRef.current;
      if (activeContact && String(senderId) === String(activeContact.user_id)) {
        setIsTyping(false);
      }
    });

    const socket = getSocket();
    const handleSocketReaction = (data) => {
      const { messageId, emoji, senderId, reactions: updatedReactions } = data || {};
      if (!messageId) return;
      setReactions((prev) => {
        const next = { ...prev };
        if (updatedReactions) {
          next[messageId] = updatedReactions;
        } else if (emoji) {
          next[messageId] = { ...(next[messageId] || {}), [senderId]: emoji };
        } else {
          const existing = { ...(next[messageId] || {}) };
          delete existing[senderId];
          next[messageId] = existing;
        }
        return next;
      });
    };

    const handleSocketDeleted = (data) => {
      const { messageId } = data || {};
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId)
            ? { ...m, is_deleted: true, text: 'This message was deleted', attachment: null }
            : m
        )
      );
    };

    const handleSocketDeletedForMe = (data) => {
      const { messageId } = data || {};
      if (!messageId) return;
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
    };

    if (socket) {
      socket.on('message_reaction', handleSocketReaction);
      socket.on('message_deleted', handleSocketDeleted);
      socket.on('message_deleted_for_me', handleSocketDeletedForMe);
    }

    return () => {
      unsubNewMsg();
      unsubSent();
      unsubRead();
      unsubGroupRead();
      unsubTyping();
      unsubStopTyping();
      if (socket) {
        socket.off('message_reaction', handleSocketReaction);
        socket.off('message_deleted', handleSocketDeleted);
        socket.off('message_deleted_for_me', handleSocketDeletedForMe);
      }
    };
  }, [effectiveUserId, currentUserId]);

  // 4. Send Message (Text + Optional Attachment)
  const sendMessagePayload = (text = '', attachment = null) => {
    if (!selectedContact) return;
    const cleanText = text.trim();
    if (!cleanText && !attachment) return;

    const myUserId = effectiveUserId || currentUserId;
    if (!myUserId) {
      toast.error('Please login to send messages');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const isReceiverOnline = onlineUserIds.includes(String(selectedContact.user_id));

    const currentReply = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || replyingTo.attachment?.name || '',
          sender: replyingTo.sender,
          name: replyingTo.sender === 'me' ? 'You' : (selectedContact?.name || 'Leader'),
        }
      : null;

    const optimisticMsg = {
      id: tempId,
      sender_id: myUserId,
      receiver_id: selectedContact.user_id,
      sender: 'me',
      text: cleanText,
      attachment: attachment || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isReceiverOnline ? 'delivered' : 'sent',
      replyTo: currentReply,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setReplyingTo(null);

    const previewSnippet = cleanText || (attachment ? `📎 ${attachment.name}` : 'File');
    setConversations((prev) =>
      prev.map((c) =>
        String(c.user_id) === String(selectedContact.user_id)
          ? { ...c, last_message_text: previewSnippet, time: 'Just now' }
          : c
      )
    );

    const socket = getSocket();
    if (socket && socket.connected) {
      emitSendMessage({
        senderId: myUserId,
        receiverId: selectedContact.user_id,
        text: cleanText,
        attachment: attachment,
      });
    } else {
      sendChatMessageHttp({
        senderId: myUserId,
        receiverId: selectedContact.user_id,
        text: cleanText,
        attachment: attachment,
      });
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    sendMessagePayload(inputText, null);
  };

  // 5. File Selection & Upload Handler
  const triggerFileSelect = (acceptType) => {
    setAttachmentMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can pick the same file again if desired
    e.target.value = '';

    const fileSizeFormatted =
      file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';

    let fileType = 'document';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) fileType = 'pdf';

    toast.loading('Uploading file...', { id: 'chat_upload' });

    let fileUrl = '';

    // 1. Upload to backend local storage so all browsers can view/download
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl =
        window.location.port === '5173'
          ? 'http://localhost:3000/api/messages/upload'
          : '/api/messages/upload';

      const res = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        fileUrl = data.url;
      }
    } catch (err) {
      console.warn('Backend file upload fallback to DataURL:', err);
    }

    // 2. Fallback to base64 DataURL (so it works 100% across all browsers/tabs even without server storage)
    if (!fileUrl) {
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result || '');
        reader.readAsDataURL(file);
      });
    }

    toast.dismiss('chat_upload');

    const attachmentObj = {
      name: file.name,
      size: fileSizeFormatted,
      type: fileType,
      url: fileUrl,
    };

    sendMessagePayload(file.name, attachmentObj);
    toast.success(`${fileType.toUpperCase()} sent!`);
  };

  // 6. Dynamic Real Counts for Tabs
  const totalConversationsCount = conversations.length;
  const unreadConversationsCount = conversations.reduce(
    (acc, c) => acc + (Number(c.unread_count) || 0),
    0
  );
  const directCount = conversations.filter((c) => c.category === 'Direct').length;
  const groupCount = conversations.filter((c) => c.category === 'Group').length;
  const systemCount = conversations.filter((c) => c.category === 'System').length;

  const filteredContacts = conversations.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message_text || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return Number(c.unread_count) > 0;
    if (activeTab === 'Direct') return c.category === 'Direct';
    if (activeTab === 'Group') return c.category === 'Group';
    if (activeTab === 'System') return c.category === 'System';
    return true;
  });

  return (
    <div className="msg-page-container">
      {/* Hidden File Input for Image / Video / Documents */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Top Navigation Header ── */}
      <UserHeader
        user={{
          name: currentUser.name,
          role: currentUser.designation || currentUser.role,
          avatar: currentUser.avatarUrl,
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* ── Main Body with Pinned Sidebar & Chat Panels ── */}
      <div className="msg-body-wrapper">
        <UserSidebar
          activeTab="Messages"
          onTabChange={(tab) => {
            if (tab === 'Home') navigate('/dashboard');
            if (tab === 'My Profile') navigate('/profile');
            if (tab === 'Following') navigate('/all-posts');
            if (tab === 'Leaders') navigate('/leaders');
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* ── Dual Panel Layout with Mobile Responsive Views ── */}
        <div className={`msg-main-content mobile-screen-${mobileActiveScreen}`}>
          {/* ════ PANEL 1: CONVERSATIONS LIST (Width: 533px on desktop, 100% on mobile) ════ */}
          <aside className="msg-left-panel">
            {/* Desktop List Header */}
            <div className="msg-list-header desktop-only-header">
              <h1 className="msg-list-title">Messages</h1>
              <p className="msg-list-subtitle">Stay connected with your team, network and leads.</p>
            </div>

            {/* Search Bar + Filter Button (Figma Image 2) */}
            <div className="msg-search-row">
              <div className="msg-search-bar-wrap">
                <FiSearch className="msg-search-icon-svg" />
                <input
                  type="text"
                  className="msg-search-input"
                  placeholder="Search message"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="msg-search-filter-btn"
                title="Filter options"
                onClick={() => toast('Filter options')}
              >
                <BsSliders className="msg-filter-icon-svg" />
              </button>
            </div>

            {/* Category Filter Tabs (Figma Image 2) */}
            <div className="msg-filter-tabs-row">
              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'All' ? 'active' : ''}`}
                onClick={() => setActiveTab('All')}
              >
                <span>All</span>
                {totalConversationsCount > 0 && (
                  <span className="msg-tab-badge">{totalConversationsCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('Unread')}
              >
                <span>Unread</span>
                {unreadConversationsCount > 0 && (
                  <span className="msg-tab-badge">{unreadConversationsCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Direct' ? 'active' : ''}`}
                onClick={() => setActiveTab('Direct')}
              >
                <span>Direct</span>
                {directCount > 0 && (
                  <span className="msg-tab-badge msg-tab-badge-neutral">{directCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Group' ? 'active' : ''}`}
                onClick={() => setActiveTab('Group')}
              >
                <span>Group</span>
                {groupCount > 0 && (
                  <span className="msg-tab-badge msg-tab-badge-neutral">{groupCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'System' ? 'active' : ''}`}
                onClick={() => setActiveTab('System')}
              >
                <span>System</span>
                {systemCount > 0 && (
                  <span className="msg-tab-badge msg-tab-badge-neutral">{systemCount}</span>
                )}
              </button>
            </div>

            {/* Conversations List Container */}
            <div className="msg-conversations-scroll">
              {loadingContacts ? (
                <div className="msg-loading-contacts">Loading contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="msg-no-conversations-found">No contacts found</div>
              ) : (
                filteredContacts.map((contact, index) => {
                  const isSelected = String(selectedContact?.user_id) === String(contact.user_id);
                  const isOnline = onlineUserIds.includes(String(contact.user_id));

                  return (
                    <div
                      key={contact.user_id || index}
                      className={`msg-conv-card ${isSelected ? 'active-selected' : ''}`}
                      onClick={() => {
                        setSelectedContact(contact);
                        setMobileActiveScreen('chat');
                      }}
                    >
                      {/* Avatar with Strictly Real Online Indicator */}
                      <div className="msg-conv-avatar-wrap">
                        <img
                          src={contact.avatar_url || userAvatarRahul}
                          alt={contact.name}
                          className="msg-conv-avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = userAvatarRahul;
                          }}
                        />
                        {isOnline && <span className="msg-online-indicator" />}
                      </div>

                      {/* Middle Info */}
                      <div className="msg-conv-details">
                        <div className="msg-conv-name-row">
                          <span className="msg-conv-name">{contact.name}</span>
                          {contact.verified && (
                            <BsPatchCheckFill className="msg-verified-badge-icon" />
                          )}
                        </div>

                        <div className="msg-conv-role-row">
                          {getRoleIcon(contact.role)}
                          <span className="msg-conv-role-text">{contact.role || 'Member'}</span>
                        </div>

                        <p className="msg-conv-last-message">{contact.last_message_text}</p>
                      </div>

                      {/* Right Meta: Time, Real Unread Pill & Chevron */}
                      <div className="msg-conv-meta">
                        {contact.time ? (
                          <span className="msg-conv-time">{contact.time}</span>
                        ) : null}

                        <div className="msg-conv-badge-arrow">
                          {Number(contact.unread_count) > 0 && (
                            <span className="msg-conv-unread-pill">{contact.unread_count}</span>
                          )}
                          <FiChevronRight className="msg-conv-chevron-svg" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Bottom Navigation Bar (Image 1) */}
            <nav className="msg-mobile-bottom-nav mobile-only-nav">
              <button
                type="button"
                className="msg-mob-nav-item"
                onClick={() => navigate('/dashboard')}
              >
                <FiHome className="msg-mob-nav-icon" />
                <span>Home</span>
              </button>
              <button
                type="button"
                className="msg-mob-nav-item"
                onClick={() => navigate('/dashboard')}
              >
                <FiUsers className="msg-mob-nav-icon" />
                <span>Network</span>
              </button>
              <button
                type="button"
                className="msg-mob-nav-add-btn"
                title="Create Post"
                onClick={() => navigate('/all-posts')}
              >
                <FiPlus />
              </button>
              <button
                type="button"
                className="msg-mob-nav-item"
                onClick={() => navigate('/all-posts')}
              >
                <FiAward className="msg-mob-nav-icon" />
                <span>Opportunity</span>
              </button>
              <button
                type="button"
                className="msg-mob-nav-item active"
                title="Messages"
              >
                <FiMessageSquare className="msg-mob-nav-icon" />
                <span>Message</span>
              </button>
            </nav>
          </aside>

          {/* ════ PANEL 2: ACTIVE CHAT WINDOW (Width: 716px on desktop, 100% on mobile) ════ */}
          <main className="msg-right-panel">
            {selectedContact ? (
              <>
                {/* ── Compact Instagram/WhatsApp Style Chat Header ── */}
                <div className="msg-chat-header-bar">
                  {/* Mobile Back Button (<) */}
                  <button
                    type="button"
                    className="msg-mobile-back-btn mobile-only-btn"
                    title="Back to conversations"
                    onClick={() => setMobileActiveScreen('list')}
                  >
                    <FiChevronLeft className="msg-mob-back-svg" />
                  </button>

                  <div
                    className="msg-header-user-info"
                    style={{
                      cursor:
                        String(selectedContact?.user_id).startsWith('group_') ||
                        selectedContact?.category === 'Group'
                          ? 'pointer'
                          : 'default',
                    }}
                    onClick={() => {
                      if (
                        String(selectedContact?.user_id).startsWith('group_') ||
                        selectedContact?.category === 'Group'
                      ) {
                        setIsGroupMembersModalOpen(true);
                      }
                    }}
                    title={
                      String(selectedContact?.user_id).startsWith('group_') ||
                      selectedContact?.category === 'Group'
                        ? 'Click to view group members'
                        : undefined
                    }
                  >
                    <div className="msg-header-avatar-wrap">
                      <img
                        src={selectedContact.avatar_url || userAvatarRahul}
                        alt={selectedContact.name || 'User'}
                        className="msg-header-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarRahul;
                        }}
                      />
                      {isContactOnline && !String(selectedContact.user_id).startsWith('group_') && (
                        <span className="msg-header-online-indicator" />
                      )}
                    </div>

                    <div className="msg-header-text-col">
                      <div className="msg-header-name-row">
                        <h2 className="msg-header-name">{selectedContact.name || 'User'}</h2>
                        {selectedContact.verified && (
                          <span className="msg-header-verified-crown" title="Verified Member">
                            <FaCrown />
                          </span>
                        )}
                        {(String(selectedContact.user_id).startsWith('group_') ||
                          selectedContact.category === 'Group') && (
                          <span className="msg-group-pill-tag">Group</span>
                        )}
                      </div>

                      <div className="msg-header-status-subline">
                        {String(selectedContact.user_id).startsWith('group_') ||
                        selectedContact.category === 'Group' ? (
                          <span className="msg-header-group-sub">
                            <FiUsers className="msg-sub-icon" /> Tap to view members
                          </span>
                        ) : isContactOnline ? (
                          <span className="msg-header-online-status">
                            <span className="msg-online-dot-mini" /> Active now
                          </span>
                        ) : (
                          <span className="msg-header-offline-status">
                            {selectedContact.role ? `${selectedContact.role} • Offline` : 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons on Right: Phone, Video, Three Dots */}
                  <div className="msg-header-right-actions">
                    {!String(selectedContact?.user_id).startsWith('group_') && selectedContact?.category !== 'Group' && (
                      <>
                        <button
                          type="button"
                          className="msg-header-action-btn"
                          title="Voice Call"
                          onClick={() => handleStartCall('audio')}
                        >
                          <FiPhone />
                        </button>
                        <button
                          type="button"
                          className="msg-header-action-btn"
                          title="Video Call"
                          onClick={() => handleStartCall('video')}
                        >
                          <FiVideo />
                        </button>
                      </>
                    )}
                    <div className="msg-header-menu-anchor" ref={groupMenuRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="msg-header-action-btn"
                        title="Options"
                        onClick={() => setGroupMenuOpen((prev) => !prev)}
                      >
                        <BsThreeDotsVertical />
                      </button>

                      {groupMenuOpen && (
                        <div className="msg-dropdown-menu">
                          {String(selectedContact?.user_id).startsWith('group_') || selectedContact?.category === 'Group' ? (
                            <>
                              <button
                                type="button"
                                className="msg-dropdown-item highlight"
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  setIsGroupMembersModalOpen(true);
                                }}
                              >
                                <FiUsers />
                                <span>View Group Members</span>
                              </button>
                              <button
                                type="button"
                                className="msg-dropdown-item"
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  toast.success(`Group: ${selectedContact.name}`);
                                }}
                              >
                                <FiShield />
                                <span>Group Info</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="msg-dropdown-item"
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  navigate(`/profile/${selectedContact.user_id}`);
                                }}
                              >
                                <FiUsers />
                                <span>View Profile</span>
                              </button>
                              <button
                                type="button"
                                className="msg-dropdown-item"
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  toast('Notifications muted');
                                }}
                              >
                                <FiAward />
                                <span>Mute Chat</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Chat Toolbar (Date Pill) ── */}
                {messages.length > 0 && (
                  <div className="msg-chat-toolbar">
                    <div className="msg-date-pill">Today</div>
                  </div>
                )}

                {/* ── WhatsApp Pinned Message Header Banner ── */}
                {pinnedMessageId && (() => {
                  const pMsg = messages.find((m) => m.id === pinnedMessageId);
                  if (!pMsg) return null;
                  return (
                    <div className="wa-pinned-header-strip">
                      <div className="wa-pinned-meta">
                        <span className="wa-pinned-icon">📌</span>
                        <div className="wa-pinned-text-wrap">
                          <span className="wa-pinned-label">Pinned message</span>
                          <span className="wa-pinned-snippet">
                            {pMsg.text || pMsg.attachment?.name || 'Attachment'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="wa-pinned-close-btn"
                        onClick={() => {
                          setPinnedMessageId(null);
                          toast('Message unpinned');
                        }}
                        title="Unpin message"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })()}

                {/* ── Messages Stream with Images, Videos, PDF, Voice Notes & WhatsApp Ticks ── */}
                <div className="msg-chat-messages-area">
                  {loadingMessages ? (
                    <div className="msg-empty-chat-state">
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="msg-empty-chat-state">
                      <div className="msg-empty-chat-icon-wrap">
                        <FiMessageSquare className="msg-empty-chat-icon" />
                      </div>
                      <h3>No messages yet</h3>
                      <p>Say hello to start the conversation with {selectedContact.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                const isMe = msg.sender === 'me';
                const status = msg.status || 'delivered';
                const isPinned = pinnedMessageId === msg.id;

                return (
                  <div
                    key={msg.id || idx}
                    className={`msg-bubble-row ${isMe ? 'msg-outgoing' : 'msg-incoming'}`}
                  >
                    {!isMe && (
                      <img
                        src={selectedContact?.avatar_url || userAvatarRahul}
                        alt=""
                        className="msg-message-avatar"
                      />
                    )}

                    <div
                      className="msg-bubble-content"
                      onClick={(e) => handleBubbleClick(e, msg)}
                    >
                      {/* WhatsApp Pin Badge if message is pinned */}
                      {isPinned && (
                        <div className="msg-pinned-badge-chip" title="Pinned message">
                          <BsPinAngle className="msg-pinned-chip-icon" />
                          <span>Pinned</span>
                        </div>
                      )}

                      {/* WhatsApp Quoted Reply inside Bubble */}
                      {msg.replyTo && (
                        <div className="wa-bubble-quote-box">
                          <div className="wa-bubble-quote-bar" />
                          <div className="wa-bubble-quote-info">
                            <span className="wa-bubble-quote-author">{msg.replyTo.name}</span>
                            <span className="wa-bubble-quote-snippet">{msg.replyTo.text}</span>
                          </div>
                        </div>
                      )}

                      {/* Photo / Image Attachment */}
                      {msg.attachment?.type === 'image' && (
                        <div className="msg-attachment-media-wrap">
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="msg-attachment-img"
                            onClick={() => window.open(msg.attachment.url, '_blank')}
                          />
                        </div>
                      )}

                      {/* Video Attachment */}
                      {msg.attachment?.type === 'video' && (
                        <div className="msg-attachment-media-wrap">
                          <video
                            controls
                            src={msg.attachment.url}
                            className="msg-attachment-video"
                          />
                        </div>
                      )}

                      {/* PDF / Document Attachment Card */}
                      {(msg.attachment?.type === 'pdf' || msg.attachment?.type === 'document') && (
                        <div
                          className="msg-pdf-attachment-card"
                          onClick={() => {
                            if (msg.attachment.url && msg.attachment.url !== '#') {
                              window.open(msg.attachment.url, '_blank');
                            } else {
                              toast.success(`Downloading ${msg.attachment.name}`);
                            }
                          }}
                        >
                          <BsFileEarmarkPdfFill className="msg-pdf-icon-badge" />
                          <div className="msg-pdf-info">
                            <span className="msg-pdf-name">{msg.attachment.name}</span>
                            <span className="msg-pdf-size">{msg.attachment.size}</span>
                          </div>
                          <button
                            type="button"
                            className="msg-pdf-download-btn"
                            title="Download file"
                          >
                            <FiDownload />
                          </button>
                        </div>
                      )}

                      {/* Voice Note / Audio Message Row (Image 2) */}
                      {(msg.isAudio || msg.attachment?.type === 'audio') && (
                        <div className="msg-audio-note-bubble">
                          <button
                            type="button"
                            className="msg-audio-play-circle-btn"
                            title="Play voice note"
                            onClick={() => toast('Playing voice message...')}
                          >
                            <IoPlayCircle className="msg-audio-play-icon" />
                          </button>
                          <div className="msg-audio-wave-bars">
                            <span className="msg-wave-bar bar-1" />
                            <span className="msg-wave-bar bar-2" />
                            <span className="msg-wave-bar bar-3" />
                            <span className="msg-wave-bar bar-4" />
                            <span className="msg-wave-bar bar-5" />
                            <span className="msg-wave-bar bar-6" />
                            <span className="msg-wave-bar bar-7" />
                            <span className="msg-wave-bar bar-8" />
                            <span className="msg-wave-bar bar-9" />
                            <span className="msg-wave-bar bar-10" />
                            <span className="msg-wave-bar bar-11" />
                            <span className="msg-wave-bar bar-12" />
                          </div>
                        </div>
                      )}

                      {/* Text message */}
                      {msg.is_deleted ? (
                        <p className="msg-bubble-text msg-bubble-deleted">
                          <span className="msg-deleted-symbol">🚫</span> <em>{msg.text || 'This message was deleted'}</em>
                        </p>
                      ) : (
                        msg.text && msg.text !== msg.attachment?.name && (
                          <p className="msg-bubble-text">{msg.text}</p>
                        )
                      )}

                      <div className="msg-bubble-meta-row">
                        <span className="msg-bubble-time">{msg.time}</span>

                        {/* WhatsApp Ticks on Outgoing Messages */}
                        {isMe && !msg.is_deleted && (
                          <span className="msg-tick-container">
                            {status === 'read' ? (
                              <IoCheckmarkDone className="msg-tick msg-tick-blue" title="Read" />
                            ) : status === 'delivered' ? (
                              <IoCheckmarkDone className="msg-tick msg-tick-grey" title="Delivered" />
                            ) : (
                              <IoCheckmark className="msg-tick msg-tick-grey" title="Sent" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* WhatsApp Quick Reaction Badge on bubble corner */}
                      {!msg.is_deleted && getMsgReactionList(msg.id).length > 0 && (
                        <div
                          className="msg-reaction-badge"
                          onClick={(e) => {
                            e.stopPropagation();
                            const myReact = getMyReaction(msg.id);
                            if (myReact) handleToggleReaction(msg.id, myReact);
                          }}
                          title="Click to remove reaction"
                        >
                          {Array.from(new Set(getMsgReactionList(msg.id))).map((em, idx) => (
                            <span key={idx} className="msg-reaction-emoji">{em}</span>
                          ))}
                          {getMsgReactionList(msg.id).length > 1 && (
                            <span className="msg-reaction-count">{getMsgReactionList(msg.id).length}</span>
                          )}
                        </div>
                      )}

                      {/* WhatsApp Dropdown Trigger Arrow (Hover on Desktop / Tap on Mobile) */}
                      {!msg.is_deleted && (
                        <button
                          type="button"
                          className={`msg-bubble-menu-trigger ${activeMenuMsgId === msg.id ? 'active' : ''}`}
                          title="Message options"
                          onClick={(e) => handleOpenMenu(e, msg.id)}
                        >
                          <FiChevronDown />
                        </button>
                      )}

                      {/* WhatsApp Floating Dropdown Menu (Exact Match Image 2) */}
                      {activeMenuMsgId === msg.id && !msg.is_deleted && (
                        <div
                          className={`wa-msg-dropdown-container ${isMe ? 'wa-dropdown-outgoing' : 'wa-dropdown-incoming'} ${menuOpenUpward ? 'open-upward' : 'open-downward'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Emoji Reactions Bar */}
                          <div className="wa-reactions-bar">
                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className={`wa-reaction-btn ${getMyReaction(msg.id) === emoji ? 'active' : ''}`}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              className={`wa-reaction-btn wa-reaction-plus ${showMoreEmojisMsgId === msg.id ? 'active' : ''}`}
                              title="More reactions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMoreEmojisMsgId((prev) => (prev === msg.id ? null : msg.id));
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* 1.1 Extended Emoji Reactions Grid (When + is clicked) */}
                          {showMoreEmojisMsgId === msg.id && (
                            <div className="wa-more-emojis-picker" onClick={(e) => e.stopPropagation()}>
                              <div className="wa-more-emojis-grid">
                                {[
                                  '😀', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '😂', '🙂',
                                  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪',
                                  '🤫', '🤗', '🤭', '😏', '🥳', '😎', '🤓', '🧐', '🔥', '🎉',
                                  '✨', '💯', '👏', '🙌', '💪', '🤝', '❤️', '🧡', '💛', '💚',
                                  '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💫', '💥',
                                  '👀', '🤙', '✌️', '🤞', '🙏'
                                ].map((em) => (
                                  <button
                                    key={em}
                                    type="button"
                                    className={`wa-more-emoji-btn ${getMyReaction(msg.id) === em ? 'active' : ''}`}
                                    onClick={() => {
                                      handleToggleReaction(msg.id, em);
                                      setShowMoreEmojisMsgId(null);
                                    }}
                                    title={em}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. Actions List (Exact matching Image 1 + Delete, React omitted since emojis are above) */}
                          <div className="wa-action-menu">
                            <button
                              type="button"
                              className="wa-action-item"
                              onClick={() => handleMessageInfo(msg)}
                            >
                              <FiInfo className="wa-action-icon" />
                              <span>Message info</span>
                            </button>

                            <button
                              type="button"
                              className="wa-action-item"
                              onClick={() => handleReplyMessage(msg)}
                            >
                              <FiCornerUpLeft className="wa-action-icon" />
                              <span>Reply</span>
                            </button>

                            <button
                              type="button"
                              className="wa-action-item"
                              onClick={() => handleCopyMessage(msg)}
                            >
                              <FiCopy className="wa-action-icon" />
                              <span>Copy</span>
                            </button>

                            <button
                              type="button"
                              className="wa-action-item"
                              onClick={() => handleForwardMessage(msg)}
                            >
                              <FiCornerUpRight className="wa-action-icon" />
                              <span>Forward</span>
                            </button>

                            <button
                              type="button"
                              className="wa-action-item"
                              onClick={() => handlePinMessage(msg)}
                            >
                              <BsPinAngle className="wa-action-icon" />
                              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>

                            <button
                              type="button"
                              className="wa-action-item wa-action-item-danger"
                              onClick={() => {
                                setDeleteModalMsg(msg);
                                setActiveMenuMsgId(null);
                              }}
                            >
                              <FiTrash2 className="wa-action-icon wa-danger-icon" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="msg-bubble-row msg-incoming">
                <img
                  src={selectedContact?.avatar_url || userAvatarRahul}
                  alt=""
                  className="msg-message-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = userAvatarRahul;
                  }}
                />
                  <div className="msg-bubble-content msg-typing-indicator-bubble">
                    <span className="msg-typing-dot" />
                    <span className="msg-typing-dot" />
                    <span className="msg-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── WhatsApp Replying To Preview Bar ── */}
            {replyingTo && (
              <div className="wa-reply-bar-preview">
                <div className="wa-reply-bar-accent" />
                <div className="wa-reply-bar-info">
                  <span className="wa-reply-bar-sender">
                    {replyingTo.sender === 'me' ? 'You' : (selectedContact?.name || 'Leader')}
                  </span>
                  <span className="wa-reply-bar-text">
                    {replyingTo.text || (replyingTo.attachment ? `[${replyingTo.attachment.type}] ${replyingTo.attachment.name}` : 'Message')}
                  </span>
                </div>
                <button
                  type="button"
                  className="wa-reply-bar-close"
                  onClick={() => setReplyingTo(null)}
                  title="Cancel reply"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Typing Section with Interactive Emoji Picker & Expandable Drawer ── */}
            <form className="msg-typing-section" onSubmit={handleSendMessage}>
              {/* Plus (+) Button for Mobile Attachment Tray */}
              <button
                type="button"
                className={`msg-mobile-plus-btn ${mobileAttachmentOpen ? 'active' : ''}`}
                title="Attach gallery, files, voice"
                onClick={() => {
                  setMobileAttachmentOpen(!mobileAttachmentOpen);
                  setEmojiPickerOpen(false);
                }}
              >
                <FiPlus className="msg-plus-icon-svg" />
              </button>

              {/* Emoji Button & Floating Picker */}
              <div className="msg-input-action-anchor" ref={emojiRef}>
                <button
                  type="button"
                  className={`msg-input-circle-btn ${emojiPickerOpen ? 'active' : ''}`}
                  title="Insert emoji"
                  onClick={() => {
                    setEmojiPickerOpen(!emojiPickerOpen);
                    setMobileAttachmentOpen(false);
                    setAttachmentMenuOpen(false);
                  }}
                >
                  <BsEmojiSmile className="msg-input-action-icon" />
                </button>

                {emojiPickerOpen && (
                  <div className="msg-emoji-picker-popup">
                    <div className="msg-emoji-picker-header">
                      <span>Quick Emojis</span>
                      <button
                        type="button"
                        className="msg-emoji-close-btn"
                        onClick={() => setEmojiPickerOpen(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="msg-emoji-grid">
                      {POPULAR_EMOJIS.map((emoji, eIdx) => (
                        <button
                          key={eIdx}
                          type="button"
                          className="msg-emoji-btn"
                          onClick={() => {
                            setInputText((prev) => prev + emoji);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Attachment Button & Floating Menu */}
              <div className="msg-input-action-anchor desktop-only-attach-btn" ref={attachmentRef}>
                <button
                  type="button"
                  className={`msg-input-circle-btn ${attachmentMenuOpen ? 'active' : ''}`}
                  title="Attach photo, video or document"
                  onClick={() => {
                    setAttachmentMenuOpen(!attachmentMenuOpen);
                    setEmojiPickerOpen(false);
                  }}
                >
                  <FiPaperclip className="msg-input-action-icon" />
                </button>

                {attachmentMenuOpen && (
                  <div className="msg-attachment-popup-menu">
                    <button
                      type="button"
                      className="msg-attachment-item"
                      onClick={() => triggerFileSelect('image/*')}
                    >
                      <span className="msg-attachment-icon-badge img-badge">
                        <FiImage />
                      </span>
                      <span>Photo / Image</span>
                    </button>

                    <button
                      type="button"
                      className="msg-attachment-item"
                      onClick={() => triggerFileSelect('video/*')}
                    >
                      <span className="msg-attachment-icon-badge video-badge">
                        <FiVideo />
                      </span>
                      <span>Video</span>
                    </button>

                    <button
                      type="button"
                      className="msg-attachment-item"
                      onClick={() =>
                        triggerFileSelect('.pdf,.doc,.docx,.xls,.xlsx,.txt')
                      }
                    >
                      <span className="msg-attachment-icon-badge doc-badge">
                        <FiFileText />
                      </span>
                      <span>Document / PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="msg-input-box-wrap">
                <input
                  type="text"
                  className="msg-message-input"
                  placeholder="Type a message"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                className="msg-send-btn"
                title="Send Message"
                disabled={!inputText.trim()}
              >
                <IoSend className="msg-send-icon-svg" />
              </button>
            </form>

            {/* ── Expandable Mobile Attachment Drawer (Frame 382, 383, 384, 385) ── */}
            {mobileAttachmentOpen && (
              <div className="msg-mobile-attachment-tray">
                {/* 1. Gallery */}
                <button
                  type="button"
                  className="msg-mob-tray-card"
                  onClick={() => {
                    setMobileAttachmentOpen(false);
                    triggerFileSelect('image/*,video/*');
                  }}
                >
                  <div className="msg-mob-tray-circle">
                    <FiImage className="msg-mob-tray-icon" />
                  </div>
                  <span className="msg-mob-tray-label">Gallery</span>
                </button>

                {/* 2. File */}
                <button
                  type="button"
                  className="msg-mob-tray-card"
                  onClick={() => {
                    setMobileAttachmentOpen(false);
                    triggerFileSelect('.pdf,.doc,.docx,.txt');
                  }}
                >
                  <div className="msg-mob-tray-circle">
                    <FiFileText className="msg-mob-tray-icon" />
                  </div>
                  <span className="msg-mob-tray-label">File</span>
                </button>

                {/* 3. Voice */}
                <button
                  type="button"
                  className="msg-mob-tray-card"
                  onClick={() => {
                    setMobileAttachmentOpen(false);
                    toast.success('Voice note recorded!');
                    sendMessagePayload('', {
                      type: 'audio',
                      name: 'Voice Note (0:14)',
                      size: '320 KB',
                      url: '#',
                    });
                  }}
                >
                  <div className="msg-mob-tray-circle">
                    <FiMic className="msg-mob-tray-icon" />
                  </div>
                  <span className="msg-mob-tray-label">Voice</span>
                </button>

                {/* 4. More */}
                <button
                  type="button"
                  className="msg-mob-tray-card"
                  onClick={() => {
                    setMobileAttachmentOpen(false);
                    toast('More sharing options');
                  }}
                >
                  <div className="msg-mob-tray-circle">
                    <BsThreeDots className="msg-mob-tray-icon" />
                  </div>
                  <span className="msg-mob-tray-label">More</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="msg-no-contact-selected">
            <FiMessageSquare className="msg-no-contact-icon" />
            <h3>Your Messages</h3>
            <p>Select a contact from the left to view your conversation or start a new message.</p>
          </div>
        )}

        {/* Group Members Modal */}
        <GroupMembersModal
          isOpen={isGroupMembersModalOpen}
          onClose={() => setIsGroupMembersModalOpen(false)}
          group={selectedContact}
          currentUserId={effectiveUserId || currentUserId}
          onlineUserIds={onlineUserIds}
          onSelectUserForChat={(userContact) => {
            setSelectedContact(userContact);
            setActiveTab('Direct');
          }}
        />

        {/* 📞 Incoming Call Alert Modal */}
        <IncomingCallModal
          isOpen={Boolean(incomingCallData)}
          callData={incomingCallData}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />

        {/* 📹 Active Audio & Video Call Modal (WebRTC Peer-to-Peer) */}
        {activeCall && (
          <CallModal
            isOpen={Boolean(activeCall)}
            isCaller={activeCall.isCaller}
            callType={activeCall.callType}
            targetUser={activeCall.targetUser}
            currentUser={{
              id: effectiveUserId || currentUserId,
              name: currentUser.name || 'Fortaa Leader',
              avatarUrl: currentUser.avatarUrl || currentUser.avatar || null,
              role: currentUser.designation || currentUser.role || 'Member',
            }}
            socket={getSocket()}
            onClose={() => setActiveCall(null)}
          />
        )}

        {/* ℹ️ WhatsApp Message Info Modal */}
        {/* ℹ️ WhatsApp Message Info Modal */}
        {infoModalMsg && (
          <div className="wa-modal-overlay" onClick={() => setInfoModalMsg(null)}>
            <div className="wa-info-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="wa-modal-header">
                <h4>Message info</h4>
                <button
                  type="button"
                  className="wa-modal-close"
                  onClick={() => setInfoModalMsg(null)}
                >
                  ✕
                </button>
              </div>

              <div className="wa-info-preview-wrap">
                <div className={`msg-bubble-content ${infoModalMsg.sender === 'me' ? 'msg-outgoing-preview' : 'msg-incoming-preview'}`}>
                  <p className="msg-bubble-text">{infoModalMsg.text || infoModalMsg.attachment?.name || 'Attachment'}</p>
                  <div className="msg-bubble-meta-row">
                    <span className="msg-bubble-time">{infoModalMsg.time}</span>
                    <span className="msg-tick-container">
                      <IoCheckmarkDone className="msg-tick msg-tick-blue" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="wa-info-stats-list">
                <div className="wa-info-stat-row">
                  <div className="wa-info-stat-icon-wrap">
                    <IoCheckmarkDone className="msg-tick msg-tick-blue" />
                  </div>
                  <div className="wa-info-stat-meta">
                    <span className="wa-info-stat-title">Read</span>
                    <span className="wa-info-stat-desc">Today at {infoModalMsg.time}</span>
                  </div>
                </div>
                <div className="wa-info-stat-divider" />
                <div className="wa-info-stat-row">
                  <div className="wa-info-stat-icon-wrap">
                    <IoCheckmarkDone className="msg-tick msg-tick-grey" />
                  </div>
                  <div className="wa-info-stat-meta">
                    <span className="wa-info-stat-title">Delivered</span>
                    <span className="wa-info-stat-desc">Today at {infoModalMsg.time}</span>
                  </div>
                </div>
              </div>

              {getMsgReactionList(infoModalMsg.id).length > 0 && (
                <div className="wa-info-reactions-section">
                  <div className="wa-info-section-title">Reactions</div>
                  <div className="wa-info-reactions-list">
                    {getMsgReactionList(infoModalMsg.id).map((em, idx) => (
                      <span key={idx} className="wa-info-reaction-pill">{em}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ↪️ WhatsApp Forward Message Modal */}
        {forwardModalMsg && (
          <div className="wa-modal-overlay" onClick={() => setForwardModalMsg(null)}>
            <div className="wa-forward-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="wa-modal-header">
                <h4>Forward message to</h4>
                <button
                  type="button"
                  className="wa-modal-close"
                  onClick={() => setForwardModalMsg(null)}
                >
                  ✕
                </button>
              </div>
              <div className="wa-forward-search-wrap">
                <FiSearch className="wa-forward-search-icon" />
                <input
                  type="text"
                  className="wa-forward-search-input"
                  placeholder="Search contacts..."
                  value={forwardSearchQuery}
                  onChange={(e) => setForwardSearchQuery(e.target.value)}
                />
              </div>
              <div className="wa-forward-contacts-list">
                {conversations
                  .filter((c) =>
                    (c.name || '').toLowerCase().includes(forwardSearchQuery.toLowerCase())
                  )
                  .map((contact) => (
                    <div key={contact.user_id} className="wa-forward-contact-item">
                      <img
                        src={contact.avatar_url || userAvatarRahul}
                        alt={contact.name}
                        className="wa-forward-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarRahul;
                        }}
                      />
                      <div className="wa-forward-contact-info">
                        <span className="wa-forward-name">{contact.name}</span>
                        <span className="wa-forward-role">{contact.role || contact.designation || 'Leader'}</span>
                      </div>
                      <button
                        type="button"
                        className="wa-forward-send-btn"
                        onClick={() => handleExecuteForward(contact, forwardModalMsg)}
                      >
                        Send
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 🗑️ WhatsApp Delete Message Modal */}
        {deleteModalMsg && (
          <div className="wa-modal-overlay" onClick={() => setDeleteModalMsg(null)}>
            <div className="wa-delete-modal-card" onClick={(e) => e.stopPropagation()}>
              <h4 className="wa-delete-modal-title">Delete message?</h4>
              <div className="wa-delete-modal-actions">
                {deleteModalMsg.sender === 'me' && (
                  <button
                    type="button"
                    className="wa-delete-btn wa-delete-everyone-btn"
                    onClick={() => handleDeleteForEveryone(deleteModalMsg)}
                  >
                    Delete for everyone
                  </button>
                )}
                <button
                  type="button"
                  className="wa-delete-btn wa-delete-me-btn"
                  onClick={() => handleDeleteForMe(deleteModalMsg)}
                >
                  Delete for me
                </button>
                <button
                  type="button"
                  className="wa-delete-btn wa-delete-cancel-btn"
                  onClick={() => setDeleteModalMsg(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
        </div>
      </div>
    </div>
  );
}
