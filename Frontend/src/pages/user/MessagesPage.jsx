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
  emitTyping,
  emitStopTyping,
  subscribeToTyping,
  subscribeToStopTyping,
  emitMarkRead,
  subscribeToMessagesRead,
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
  BsStarFill,
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
import chatBannerTechBg from '../../assets/dashboard/chat_banner_tech_bg.png';
import chatBannerMountainBg from '../../assets/chat_banner_mountain_bg.png';
import './MessagesPage.css';

// Popular Emojis categorized for the interactive picker
const POPULAR_EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩', '🥳', '🤔', '🤫', '😴',
  '👍', '👏', '🙏', '🤝', '✌️', '👌', '❤️', '🔥', '⭐', '✨', '💯', '🎯',
  '💼', '📈', '📊', '🚀', '💡', '🏆', '🎉', '💰', '📱', '💻', '☕', '💪',
];

// Initial Figma sample contacts
const INITIAL_FIGMA_CONTACTS = [
  {
    user_id: 101,
    name: 'Arlene',
    role: 'Business Partner',
    category: 'Direct',
    last_message_text: 'Great! Let’s connect and discuss...',
    time: '10:24 AM',
    unread_count: 3,
    verified: true,
  },
  {
    user_id: 102,
    name: 'Theresa Webb',
    role: 'Team member',
    category: 'Direct',
    last_message_text: 'Can you share the opportunity datails?',
    time: '02:24 AM',
    unread_count: 2,
  },
  {
    user_id: 103,
    name: 'Ronald Richards',
    role: 'Business Partner',
    category: 'Direct',
    last_message_text: 'Sounds good! Looking forward...',
    time: '12:00 AM',
    unread_count: 1,
  },
  {
    user_id: 104,
    name: 'Courtney Henry',
    role: 'Team member',
    category: 'Direct',
    last_message_text: 'I have joined the event.',
    time: 'Yesterday',
    unread_count: 3,
  },
  {
    user_id: 105,
    name: 'Jane Cooper',
    role: 'Team member',
    category: 'Direct',
    last_message_text: 'Plese share the product catalog.',
    time: 'Yesterday',
    unread_count: 4,
  },
  {
    user_id: 106,
    name: 'Jacob Jones',
    role: 'Customer',
    category: 'Direct',
    last_message_text: 'Thank you for information.',
    time: 'Yesterday',
    unread_count: 2,
  },
  {
    user_id: 107,
    name: 'Leslie Alexander',
    role: 'Group',
    category: 'Group',
    last_message_text: 'Suresh: Welcome to the team!',
    time: 'Yesterday',
    unread_count: 5,
  },
  {
    user_id: 108,
    name: 'Leslie Alexander',
    role: 'Group',
    category: 'Group',
    last_message_text: 'Priya: New opportunity is live now!',
    time: 'Yesterday',
    unread_count: 5,
  },
];

// Initial Figma sample messages
const INITIAL_FIGMA_MESSAGES = [
  {
    id: 'f1',
    sender: 'them',
    text: 'Hii Rahul How are you?',
    time: '10:12 AM',
  },
  {
    id: 'f2',
    sender: 'me',
    text: 'I’m good! Thanks for asking.I saw your post about the new opportunity. Can you share more details?',
    time: '10:15 AM',
    status: 'read',
  },
  {
    id: 'f3',
    sender: 'them',
    text: 'Sure! It’s a great opportunity with good income potential. I’ll share the full details with you.',
    attachment: {
      name: 'Opportunity_Details.pdf',
      size: '2.4 MB',
      type: 'pdf',
      url: '#',
    },
    time: '10:18 AM',
  },
  {
    id: 'f4',
    sender: 'them',
    text: 'Let’s connect and discuss in detail today.',
    time: '10:22 AM',
  },
  {
    id: 'f5',
    sender: 'me',
    text: 'Perfect I’m joining the call at 5 PM. Looking forward!',
    time: '10:24 AM',
    status: 'delivered',
  },
  {
    id: 'f6',
    sender: 'them',
    isAudio: true,
    time: '10:30 AM',
  },
  {
    id: 'f7',
    sender: 'them',
    text: 'Great! See you at 5 PM. 👍',
    time: '10:30 AM',
  },
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
  const [conversations, setConversations] = useState(INITIAL_FIGMA_CONTACTS);
  const [selectedContact, setSelectedContact] = useState(INITIAL_FIGMA_CONTACTS[0]);
  const [messages, setMessages] = useState(INITIAL_FIGMA_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Attachment & Emoji dropdown state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

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

  // 1. Initial Socket & Conversations Load
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    if (!myId) return;

    try {
      getSocket();
      joinChat(myId);

      const unsubOnline = subscribeToOnlineUsers((onlineList) => {
        setOnlineUserIds(onlineList.map(String));
      });

      // Keep online status 100% synchronized periodically
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
        const dbData = await fetchConversations(myId);
        if (Array.isArray(dbData) && dbData.length > 0) {
          const merged = [
            ...dbData.map((d) => ({
              user_id: d.user_id,
              name: d.name,
              role: d.designation || 'Senior Leader',
              category: 'Direct',
              last_message_text: d.last_message_text || 'Click to open conversation',
              time: d.last_message_time
                ? new Date(d.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent',
              unread_count: Number(d.unread_count) || 0,
              avatar_url: d.avatar_url,
              isRealDb: true,
            })),
            ...INITIAL_FIGMA_CONTACTS.filter(
              (f) => !dbData.some((d) => String(d.user_id) === String(f.user_id))
            ),
          ];
          setConversations(merged);

          if (preselectUserId) {
            const found = merged.find((c) => String(c.user_id) === String(preselectUserId));
            if (found) setSelectedContact(found);
          } else {
            // Pick latest real contact if placeholder is selected
            setSelectedContact((prev) => {
              if (!prev || !prev.isRealDb) {
                return merged[0];
              }
              const refreshed = merged.find((c) => String(c.user_id) === String(prev.user_id));
              return refreshed || prev;
            });
          }
        }
      }

      loadContacts();

      return () => {
        unsubOnline();
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
      };
    } catch {
      // Graceful fallback
    }
  }, [effectiveUserId, currentUserId, preselectUserId]);

  // 2. Fetch Chat History when Contact Changes
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    if (!selectedContact || !myId) return;

    // Reset unread count for selected contact
    setConversations((prev) =>
      prev.map((c) =>
        String(c.user_id) === String(selectedContact.user_id) ? { ...c, unread_count: 0 } : c
      )
    );

    if (selectedContact.isRealDb) {
      emitMarkRead({ senderId: selectedContact.user_id, receiverId: myId });

      let isMounted = true;
      async function loadHistory() {
        const history = await fetchChatHistory(myId, selectedContact.user_id);
        if (isMounted && Array.isArray(history) && history.length > 0) {
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
              sender: isMe ? 'me' : 'them',
              text: msgText,
              attachment: msgAttachment || null,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: isMe ? (m.is_read ? 'read' : 'delivered') : undefined,
            };
          });
          setMessages(formatted);
        }
      }
      loadHistory();
      return () => {
        isMounted = false;
      };
    }
  }, [selectedContact, currentUserId, effectiveUserId]);

  // 3. Socket Listeners for Real-time Messages & Read Receipts
  useEffect(() => {
    const myId = effectiveUserId || currentUserId;
    const unsubNewMsg = subscribeToNewMessages((newMsg) => {
      const isCurrentChat =
        selectedContact &&
        (String(newMsg.sender_id) === String(selectedContact.user_id) ||
          String(newMsg.receiver_id) === String(selectedContact.user_id));

      if (isCurrentChat) {
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
              sender: String(newMsg.sender_id) === String(myId) ? 'me' : 'them',
              text: msgText,
              attachment: msgAttachment || null,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: newMsg.status || 'delivered',
            },
          ];
        });
        if (myId) {
          emitMarkRead({ senderId: selectedContact.user_id, receiverId: myId });
        }
      }

      setConversations((prev) => {
        const partnerId =
          String(newMsg.sender_id) === String(myId)
            ? newMsg.receiver_id
            : newMsg.sender_id;

        return prev.map((c) => {
          if (String(c.user_id) === String(partnerId)) {
            const isSelected = String(selectedContact?.user_id) === String(c.user_id);
            return {
              ...c,
              last_message_text: newMsg.text || (newMsg.attachment ? `📎 ${newMsg.attachment.name}` : 'New message'),
              time: 'Just now',
              unread_count: isSelected ? 0 : (Number(c.unread_count) || 0) + 1,
            };
          }
          return c;
        });
      });
    });

    const unsubSent = subscribeToSentMessage((confirmedMsg) => {
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
      if (selectedContact && String(selectedContact.user_id) === String(byUserId)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'me' ? { ...m, status: 'read' } : m))
        );
      }
    });

    const unsubTyping = subscribeToTyping(({ senderId }) => {
      if (selectedContact && String(senderId) === String(selectedContact.user_id)) {
        setIsTyping(true);
      }
    });

    const unsubStopTyping = subscribeToStopTyping(({ senderId }) => {
      if (selectedContact && String(senderId) === String(selectedContact.user_id)) {
        setIsTyping(false);
      }
    });

    return () => {
      unsubNewMsg();
      unsubSent();
      unsubRead();
      unsubTyping();
      unsubStopTyping();
    };
  }, [selectedContact, currentUserId, effectiveUserId]);

  // 4. Send Message (Text + Optional Attachment)
  const sendMessagePayload = (text = '', attachment = null) => {
    if (!selectedContact) return;
    const cleanText = text.trim();
    if (!cleanText && !attachment) return;

    const myUserId = effectiveUserId || currentUserId;
    const tempId = `temp_${Date.now()}`;
    const isReceiverOnline = onlineUserIds.includes(String(selectedContact.user_id));

    const optimisticMsg = {
      id: tempId,
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
        senderId: myUserId || 999,
        receiverId: selectedContact.user_id,
        text: cleanText,
        attachment: attachment,
      });
    } else if (selectedContact.isRealDb && myUserId) {
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

            {/* Search Bar */}
            <div className="msg-search-bar-wrap">
              <FiSearch className="msg-search-icon-svg" />
              <input
                type="text"
                className="msg-search-input"
                placeholder="Search people, posts, companies, products, opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="msg-search-filter-btn"
                title="Filter options"
                onClick={() => toast('Filter options')}
              >
                <BsSliders className="msg-filter-icon-svg" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="msg-filter-tabs-row">
              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'All' ? 'active' : ''}`}
                onClick={() => setActiveTab('All')}
              >
                <span>All</span>
                <span className="msg-tab-badge">{totalConversationsCount}</span>
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('Unread')}
              >
                <span>Unread</span>
                <span className="msg-tab-badge">{unreadConversationsCount || 12}</span>
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Direct' ? 'active' : ''}`}
                onClick={() => setActiveTab('Direct')}
              >
                <span>Direct</span>
                {directCount > 0 && <span className="msg-tab-badge-subtle">{directCount}</span>}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'Group' ? 'active' : ''}`}
                onClick={() => setActiveTab('Group')}
              >
                <span>Group</span>
                {groupCount > 0 && <span className="msg-tab-badge-subtle">{groupCount}</span>}
              </button>

              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'System' ? 'active' : ''}`}
                onClick={() => setActiveTab('System')}
              >
                <span>System</span>
                {systemCount > 0 && <span className="msg-tab-badge-subtle">{systemCount}</span>}
              </button>
            </div>

            {/* Conversations List Container */}
            <div className="msg-conversations-scroll">
              {filteredContacts.map((contact, index) => {
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
                        <span className="msg-conv-role-text">{contact.role || 'Partner'}</span>
                      </div>

                      <p className="msg-conv-last-message">{contact.last_message_text}</p>
                    </div>

                    {/* Right Meta: Time, Real Unread Pill & Chevron */}
                    <div className="msg-conv-meta">
                      <span className="msg-conv-time">{contact.time || '10:24 AM'}</span>

                      <div className="msg-conv-badge-arrow">
                        {Number(contact.unread_count) > 0 && (
                          <span className="msg-conv-unread-pill">{contact.unread_count}</span>
                        )}
                        <FiChevronRight className="msg-conv-chevron-svg" />
                      </div>
                    </div>
                  </div>
                );
              })}
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

              <div className="msg-banner-content">
                <div className="msg-banner-avatar-wrap">
                  <img
                    src={selectedContact?.avatar_url || userAvatarRahul}
                    alt={selectedContact?.name || 'Rahul Sharma'}
                    className="msg-banner-avatar"
                  />
                  {isContactOnline && <span className="msg-banner-online-indicator" />}
                </div>

                <div className="msg-banner-info">
                  <div className="msg-banner-title-line">
                    <h2 className="msg-banner-name">{selectedContact?.name || 'Rahul sharma'}</h2>
                    <div className="msg-mob-crown-circle" title="Verified Member">
                      <FaCrown className="msg-crown-icon" />
                    </div>
                  </div>

                  <div className="msg-banner-badge-row">
                    <div className="msg-banner-leader-badge">
                      <span className="msg-medal-circle">
                        <BsAwardFill className="msg-leader-medal" />
                      </span>
                      <span className="msg-badge-text">
                        {selectedContact?.company_brand || 'Index Technology'}
                      </span>
                      <span className="msg-badge-divider">|</span>
                      <span className="msg-badge-subtext">
                        {selectedContact?.role || 'Silver Leader'}
                      </span>
                    </div>
                  </div>

                  <div className="msg-banner-status-row">
                    <span className="msg-banner-role-label">
                      {selectedContact?.role || 'Business Partner'}
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
                  </div>

                  {/* Location label (Image 2, 3, 4 - Frame 6) */}
                  <div className="msg-banner-location-row">
                    <FiMapPin className="msg-location-icon" />
                    <span>Mumbai, India</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons on Right (Frame 358, 359, 360: Phone, Video, Three Dots) */}
              <div className="msg-banner-right-actions">
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
                <button
                  type="button"
                  className="msg-banner-action-btn"
                  title="Options"
                  onClick={() => toast('Chat settings')}
                >
                  <BsThreeDotsVertical />
                </button>
              </div>
            </div>

            {/* ── 3 Stats Cards on Mobile (Image 2 - Frame 289, 300, 290) ── */}
            <div className="msg-mobile-stats-row mobile-only-stats">
              {/* Card 1: Following */}
              <div className="msg-mob-stat-card">
                <div className="msg-mob-stat-icon-wrap">
                  <BsPersonCheckFill className="msg-mob-stat-icon" />
                </div>
                <div className="msg-mob-stat-info">
                  <span className="msg-mob-stat-num">3.9k</span>
                  <span className="msg-mob-stat-title">Following</span>
                </div>
              </div>

              {/* Card 2: Experience */}
              <div className="msg-mob-stat-card">
                <div className="msg-mob-stat-icon-wrap">
                  <BsStarFill className="msg-mob-stat-icon" />
                </div>
                <div className="msg-mob-stat-info">
                  <span className="msg-mob-stat-num">5 Years</span>
                  <span className="msg-mob-stat-title">Experience</span>
                </div>
              </div>

              {/* Card 3: Followers */}
              <div className="msg-mob-stat-card">
                <div className="msg-mob-stat-icon-wrap">
                  <BsPeopleFill className="msg-mob-stat-icon" />
                </div>
                <div className="msg-mob-stat-info">
                  <span className="msg-mob-stat-num">85</span>
                  <span className="msg-mob-stat-title">Followers</span>
                </div>
              </div>
            </div>

            {/* ── Chat Toolbar (Date Pill) ── */}
            <div className="msg-chat-toolbar">
              <div className="msg-date-pill">12 Oct 2026</div>
            </div>

            {/* ── Messages Stream with Images, Videos, PDF, Voice Notes & WhatsApp Ticks ── */}
            <div className="msg-chat-messages-area">
              {messages.map((msg, idx) => {
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
              })}

              {isTyping && (
                <div className="msg-bubble-row msg-incoming">
                  <img
                    src={selectedContact?.avatar_url || userAvatarRahul}
                    alt=""
                    className="msg-message-avatar"
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
          </main>
        </div>
      </div>
    </div>
  );
}
