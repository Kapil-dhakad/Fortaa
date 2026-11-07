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
  FiEdit3,
  FiMapPin,
  FiHome,
  FiUsers,
  FiAward,
  FiMessageSquare,
  FiShield,
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
  BsAwardFill,
  BsThreeDots,
} from 'react-icons/bs';
import {
  IoSend,
  IoCheckmark,
  IoCheckmarkDone,
  IoPlayCircle,
  IoPaperPlaneOutline,
} from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';

// Asset Images
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import chatBannerMountainBg from '../../assets/chat_banner_mountain_bg.png';
import GroupMembersModal from '../../components/modals/GroupMembersModal';
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
  const preselectUserId = searchParams.get('userId');

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
            return {
              id: m.id,
              sender_id: m.sender_id,
              receiver_id: m.receiver_id,
              sender: isMe ? 'me' : 'them',
              text: msgText,
              attachment: msgAttachment || null,
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              status: isMe ? (m.status || (m.is_read ? 'read' : 'delivered')) : undefined,
            };
          });
          setMessages(formatted);
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

    return () => {
      unsubNewMsg();
      unsubSent();
      unsubRead();
      unsubGroupRead();
      unsubTyping();
      unsubStopTyping();
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

    const optimisticMsg = {
      id: tempId,
      sender_id: myUserId,
      receiver_id: selectedContact.user_id,
      sender: 'me',
      text: cleanText,
      attachment: attachment || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isReceiverOnline ? 'delivered' : 'sent',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

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

            {/* Mobile List Header Banner (Figma Image 1) */}
            <div
              className="msg-mobile-list-banner mobile-only-banner"
              style={{
                backgroundImage: `url(${chatBannerMountainBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="msg-mob-banner-top-actions">
                <button
                  type="button"
                  className="msg-mob-circle-action-btn"
                  title="Messages"
                  onClick={() => toast('All conversations')}
                >
                  <IoPaperPlaneOutline />
                </button>
                <div className="msg-mob-title-box">
                  <h1 className="msg-mob-title-text">Messages</h1>
                  <p className="msg-mob-subtitle-text">
                    Stay connected with your team, network and leads.
                  </p>
                </div>
                <button
                  type="button"
                  className="msg-mob-circle-action-btn"
                  title="Compose"
                  onClick={() => toast('New message compose')}
                >
                  <FiEdit3 />
                </button>
              </div>
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
                {/* ── Profile Banner with Strict Online Status & Mobile Back Button ── */}
                <div
                  className="msg-chat-profile-banner"
                  style={{
                    backgroundImage: `url(${chatBannerMountainBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="msg-banner-overlay" />

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
                    className="msg-banner-content"
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
                    <div className="msg-banner-avatar-wrap">
                      <img
                        src={selectedContact.avatar_url || userAvatarRahul}
                        alt={selectedContact.name || 'User'}
                        className="msg-banner-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarRahul;
                        }}
                      />
                      {isContactOnline && !String(selectedContact.user_id).startsWith('group_') && (
                        <span className="msg-banner-online-indicator" />
                      )}
                    </div>

                    <div className="msg-banner-info">
                      <div className="msg-banner-title-line">
                        <h2 className="msg-banner-name">{selectedContact.name || 'User'}</h2>
                        {selectedContact.verified && (
                          <div className="msg-mob-crown-circle" title="Verified Member">
                            <FaCrown className="msg-crown-icon" />
                          </div>
                        )}
                        {(String(selectedContact.user_id).startsWith('group_') ||
                          selectedContact.category === 'Group') && (
                          <span className="msg-group-pill-tag">Group</span>
                        )}
                      </div>

                      <div className="msg-banner-badge-row">
                        <div className="msg-banner-leader-badge">
                          <span className="msg-medal-circle">
                            {String(selectedContact.user_id).startsWith('group_') ||
                            selectedContact.category === 'Group' ? (
                              <FiUsers className="msg-leader-medal" />
                            ) : (
                              <BsAwardFill className="msg-leader-medal" />
                            )}
                          </span>
                          <span className="msg-badge-text">
                            {selectedContact.company_brand || (String(selectedContact.user_id).startsWith('group_') ? 'Fortaa Community' : 'Fortaa')}
                          </span>
                          <span className="msg-badge-divider">|</span>
                          <span className="msg-badge-subtext">
                            {selectedContact.role || 'Member'}
                          </span>
                        </div>
                      </div>

                      <div className="msg-banner-status-row">
                        {String(selectedContact.user_id).startsWith('group_') ||
                        selectedContact.category === 'Group' ? (
                          <span className="msg-banner-role-label" style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <FiUsers /> Tap to view members
                          </span>
                        ) : (
                          <>
                            <span className="msg-banner-role-label">
                              {selectedContact.role || 'Business Partner'}
                            </span>
                            {/* Strictly Real Online / Offline Indicator */}
                            {isContactOnline ? (
                              <span className="msg-banner-online-text">
                                <span className="msg-online-dot-inline" /> Online
                              </span>
                            ) : (
                              <span className="msg-banner-offline-text">
                                <span className="msg-offline-dot-inline" /> Offline
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Location label */}
                      <div className="msg-banner-location-row">
                        <FiMapPin className="msg-location-icon" />
                        <span>India</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons on Right (Frame 358, 359, 360: Phone, Video, Three Dots) */}
                  <div className="msg-banner-right-actions">
                    {!String(selectedContact?.user_id).startsWith('group_') && selectedContact?.category !== 'Group' && (
                      <>
                        <button
                          type="button"
                          className="msg-banner-action-btn"
                          title="Voice Call"
                          onClick={() => toast('Starting voice call...')}
                        >
                          <FiPhone />
                        </button>
                        <button
                          type="button"
                          className="msg-banner-action-btn"
                          title="Video Call"
                          onClick={() => toast('Starting video call...')}
                        >
                          <FiVideo />
                        </button>
                      </>
                    )}
                    <div className="msg-banner-menu-anchor" ref={groupMenuRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="msg-banner-action-btn"
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

                    <div className="msg-bubble-content">
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
                      {msg.text && msg.text !== msg.attachment?.name && (
                        <p className="msg-bubble-text">{msg.text}</p>
                      )}

                      <div className="msg-bubble-meta-row">
                        <span className="msg-bubble-time">{msg.time}</span>

                        {/* WhatsApp Ticks on Outgoing Messages */}
                        {isMe && (
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
      </main>
        </div>
      </div>
    </div>
  );
}
