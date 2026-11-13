import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaRegThumbsUp, FaThumbsUp, FaRegComment, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { RiShareForwardLine } from 'react-icons/ri';
import './UserDashboard.css';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import PostComments from '../../components/posts/PostComments';
import ShareModal from '../../components/posts/ShareModal';
import PostActionMenu from '../../components/posts/PostActionMenu';
import AboutAccountModal from '../../components/posts/AboutAccountModal';
import InstagramPostModal from '../../components/posts/InstagramPostModal';
import PostLikersModal from '../../components/posts/PostLikersModal';
import InviteTeamModal from '../../components/modals/InviteTeamModal';
import JoinGroupModal from '../../components/modals/JoinGroupModal';
import NotificationDropdown from '../../components/notifications/NotificationDropdown';
import AuthGateModal from '../../components/auth/AuthGateModal';

// Upload & Dashboard APIs
import { uploadSingleImage, uploadSingleVideo } from '../../services/upload.service';
import {
  fetchDashboardOverview,
  fetchPosts,
  submitPost,
  likePostApi,
  votePollApi,
  deletePostApi,
  fetchTrainers,
  fetchLeaders,
  fetchServices,
  fetchEvents,
  fetchGroups,
  fetchOpportunities,
} from '../../services/dashboard.service';
import {
  toggleFollowUser,
  sendFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  fetchFollowingIds,
} from '../../services/follow.service';
import { joinChat, subscribeToFollowEvents, getSocket } from '../../services/socket.service';
import { fetchUnreadMessageCount } from '../../services/message.service';
import { fetchUnreadCount } from '../../services/notification.service';

// Brand & icons
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';

// Dashboard uploaded assets
import postMeshImg from '../../assets/dashboard/post_abstract_mesh.png';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import postTogetherDreams from '../../assets/dashboard/post_together_dreams.jpg';
import priyaSharmaImg from '../../assets/figma/priya_sharma.png';
import alexMorganImg from '../../assets/figma/alex_morgan.png';
import handshakeBusiness from '../../assets/figma/handshake_business.jpg';
import sidebarMegaphoneImg from '../../assets/dashboard/sidebar_megaphone_3d.png';
import oppDigitalImg from '../../assets/dashboard/opp_digital_marketing.png';
import oppLeadershipImg from '../../assets/dashboard/opp_leadership.png';
import oppWellnessImg from '../../assets/dashboard/opp_wellness.png';
import bellIconImg from '../../assets/dashboard/bell-icon.png';
import messageIconImg from '../../assets/dashboard/message-icon.png';
import searchIconPurple from '../../assets/dashboard/search_icon_purple.png';
import unlockPotentialBg from '../../assets/dashboard/unlock_potential_bg.png';
import qaCreatePostImg from '../../assets/dashboard/quick_action_create_post.png';
import qaAddPhotoImg from '../../assets/dashboard/quick_action_add_photo.png';
import qaMarketplaceImg from '../../assets/dashboard/quick_action_marketplace.png';
import qaInviteTeamImg from '../../assets/dashboard/quick_action_invite_team.png';
import qaJoinGroupImg from '../../assets/dashboard/quick_action_join_group.svg';
import qaGoLiveImg from '../../assets/dashboard/quick_action_go_live.svg';

// Sidebar Navigation Icons (25x25)
import navHomeIcon from '../../assets/sidebar/nav_home.png';
import navProfileIcon from '../../assets/sidebar/nav_profile.png';
import navServicesIcon from '../../assets/sidebar/nav_services.png';
import navTeamIcon from '../../assets/sidebar/nav_team.png';
import navFollowingIcon from '../../assets/sidebar/nav_following.png';
import navMarketplaceIcon from '../../assets/sidebar/nav_marketplace.png';
import navCompaniesIcon from '../../assets/sidebar/nav_companies.png';
import navProductsIcon from '../../assets/sidebar/nav_products.png';
import navLeadersIcon from '../../assets/sidebar/nav_leaders.png';
import navPromotionsIcon from '../../assets/sidebar/nav_promotions.png';
import navEventsIcon from '../../assets/sidebar/nav_events.png';
import navNewsIcon from '../../assets/sidebar/nav_news.png';
import navMessagesIcon from '../../assets/sidebar/nav_messages.png';
import navGroupsIcon from '../../assets/sidebar/nav_groups.png';
import navResourcesIcon from '../../assets/sidebar/nav_resources.png';
import navSettingsIcon from '../../assets/sidebar/nav_settings.png';

const MOBILE_SIDEBAR_NAV_ITEMS = [
  { label: 'Home', icon: navHomeIcon, path: '/dashboard' },
  { label: 'My Profile', icon: navProfileIcon, path: '/profile' },
  // { label: 'Services', icon: navServicesIcon },
  // { label: 'Market Place', icon: navMarketplaceIcon },
  // { label: 'Companies', icon: navCompaniesIcon },
  // { label: 'Products', icon: navProductsIcon },
  { label: 'Leaders', icon: navLeadersIcon, path: '/leaders' },
  { label: 'Promotions', icon: navPromotionsIcon, path: '/promotions' },
  // { label: 'Events', icon: navEventsIcon },
  // { label: 'News & Updates', icon: navNewsIcon },
  { label: 'Messages', icon: navMessagesIcon, path: '/messages' },
  { label: 'Groups', icon: navGroupsIcon, path: '/groups' },
  // { label: 'Resources', icon: navResourcesIcon },
  { label: 'Settings', icon: navSettingsIcon, path: '/settings' },
];

// 1. Format Relative Time (LinkedIn style: Just now, 15m, 12h, 1 day, 4 days)
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const postDate = new Date(dateString);
  if (isNaN(postDate.getTime())) return dateString;

  const now = new Date();
  const diffInMs = now.getTime() - postDate.getTime();
  if (diffInMs < 0) return 'Just now';

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day';
  if (diffInDays < 7) return `${diffInDays} days`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1 week';
  if (diffInWeeks < 4) return `${diffInWeeks} weeks`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return '1 month';
  if (diffInMonths < 12) return `${diffInMonths} months`;

  return `${Math.floor(diffInDays / 365)}y`;
}

// 2. Render Formatted Content (Clickable URLs & Phone numbers in vibrant blue)
export function renderFormattedContent(text) {
  if (!text) return null;

  // Matches URLs (http, https, www) or 10-digit Indian phone numbers (with optional +91 or 0 prefix)
  const pattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:(?:\+91[-\s]?)|(?:\b0))?[6-9]\d{9}\b)/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];
    const isUrl = /^https?:\/\/|^www\./i.test(matchedText);

    if (isUrl) {
      const href = matchedText.startsWith('http') ? matchedText : `https://${matchedText}`;
      parts.push(
        <a
          key={`url-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ud-post-inline-link"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else {
      const cleanPhone = matchedText.replace(/[^\d+]/g, '');
      parts.push(
        <a
          key={`phone-${match.index}`}
          href={`tel:${cleanPhone}`}
          className="ud-post-inline-phone"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// 3. Instagram-style Likes Row: "Liked by vishaldhakad_08 and others"
export function renderInstagramLikes(post, profile, onOpenLikes) {
  const likesCount = Number(post.likes_count) || 0;
  if (likesCount <= 0) return <div className="ud-insta-like-placeholder" />;

  const hasLiked = Boolean(post.has_liked);
  const myName = profile?.name || 'you';
  const otherName = post.latest_liker_name || (post.author_name !== myName ? post.author_name : 'a leader');
  const avatar = post.latest_liker_avatar || userAvatarImg;

  let content = null;
  if (likesCount === 1) {
    if (hasLiked) {
      content = <>Liked by <strong>you</strong></>;
    } else {
      content = <>Liked by <strong>{otherName}</strong></>;
    }
  } else if (likesCount === 2) {
    if (hasLiked) {
      content = <>Liked by <strong>you</strong> and <strong>1 other</strong></>;
    } else {
      content = <>Liked by <strong>{otherName}</strong> and <strong>1 other</strong></>;
    }
  } else {
    const othersCount = likesCount - 1;
    if (hasLiked) {
      content = (
        <>
          Liked by <strong>{otherName || 'you'}</strong> and <strong>{othersCount} others</strong>
        </>
      );
    } else {
      content = (
        <>
          Liked by <strong>{otherName}</strong> and <strong>{othersCount} others</strong>
        </>
      );
    }
  }

  return (
    <div
      className="ud-insta-likes-bar"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onOpenLikes) onOpenLikes(post.id);
      }}
      title="View who liked this post"
    >
      <div className="ud-insta-likes-left">
        <span className="ud-insta-likes-heart">❤️</span>
        {avatar && (
          <img
            src={avatar}
            alt=""
            className="ud-insta-liker-thumb"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="ud-insta-likes-label">{content}</span>
      </div>
    </div>
  );
}

function InFeedSuggestedPeople({
  type = 'trainers',
  trainers,
  leaders,
  followingIds,
  pendingIds,
  onToggleFollow,
  navigate,
  isMobile,
}) {
  const isTrainers = type === 'trainers';
  const title = isTrainers ? 'Trainers' : 'Leaders';
  const [dismissedKeys, setDismissedKeys] = useState([]);

  const items = React.useMemo(() => {
    if (isTrainers) {
      const tList = trainers || [];
      return tList.map((t, i) => ({
        key: `trainer-${t.id || i}`,
        id: t.id,
        name: t.name,
        role: t.role || 'Diamond Leader',
        stats: t.followers || t.network || '2K Followers',
        avatar: t.avatar_url || userAvatarImg,
        isTrainer: true,
      }));
    } else {
      const lList = leaders || [];
      return lList.map((l, i) => ({
        key: `leader-${l.id || i}`,
        id: l.id,
        name: l.name,
        role: l.role || 'Business Leader',
        stats: 'Direct Selling Leader',
        avatar: l.avatar_url || userAvatarImg,
        isTrainer: false,
      }));
    }
  }, [isTrainers, trainers, leaders]);

  const visibleItems = items.filter((p) => !dismissedKeys.includes(p.key));

  if (!visibleItems.length) return null;

  return (
    <div className={`ud-infeed-suggested ${isMobile ? 'ud-infeed-suggested-mob' : ''}`}>
      <div className="ud-infeed-suggested-header">
        <div className="ud-infeed-suggested-title-group">
          <img
            src={navServicesIcon}
            alt=""
            className="ud-infeed-header-icon"
          />
          <h3 className="ud-infeed-suggested-title">{title}</h3>
        </div>
        <button
          type="button"
          className="ud-infeed-see-all-btn"
          onClick={() => navigate(isTrainers ? '#trainers' : '/leaders')}
        >
          View All →
        </button>
      </div>

      <div className="ud-infeed-scroll-container">
        {visibleItems.map((person) => {
          const isFollowed = person.id ? followingIds.map(Number).includes(Number(person.id)) : false;
          const isPending = person.id ? pendingIds.map(Number).includes(Number(person.id)) : false;

          return (
            <div key={person.key} className="ud-infeed-person-card">
              {/* Dismiss X button */}
              <button
                type="button"
                className="ud-infeed-dismiss-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissedKeys((prev) => [...prev, person.key]);
                }}
                title="Dismiss"
                aria-label="Dismiss"
              >
                ✕
              </button>
              <div className="ud-infeed-avatar-ring">
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="ud-infeed-avatar-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = userAvatarImg;
                  }}
                />
                {person.isTrainer && <span className="ud-infeed-trainer-badge" title="Certified Trainer">⭐</span>}
              </div>

              <h4 className="ud-infeed-person-name" title={person.name}>{person.name}</h4>
              <span className="ud-infeed-person-role">{person.role}</span>
              <span className="ud-infeed-person-stats">{person.stats}</span>

              <button
                type="button"
                className={`ud-infeed-btn-follow ${isFollowed ? 'is-followed' : isPending ? 'is-pending' : ''}`}
                onClick={() => {
                  if (person.id) {
                    onToggleFollow(person.id, person.name);
                  } else {
                    toast.success(`Followed ${person.name}!`);
                  }
                }}
              >
                {isFollowed ? 'Following ✓' : isPending ? 'Request Pending' : person.isTrainer ? 'Follow' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Global Video Sound Manager (Instagram / Reels style persistence) ──
// When a user un-mutes any video, subsequent videos in the feed will also play un-muted.
let globalFeedAudioMuted = (() => {
  try {
    const saved = localStorage.getItem('fortaa_feed_video_muted');
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
})();

const broadcastFeedAudioState = (muted) => {
  globalFeedAudioMuted = muted;
  try {
    localStorage.setItem('fortaa_feed_video_muted', String(muted));
  } catch {}
  window.dispatchEvent(new CustomEvent('fortaa:feed_video_mute_toggle', { detail: { muted } }));
};

// ── Feed Video with Instagram-style Autoplay & Audio Toggle ──
function FeedVideo({ src, onDoubleTap, onSingleTap, isHeartActive, isMobile = false }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(globalFeedAudioMuted);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync sound state across all feed videos in real time
  useEffect(() => {
    const handleAudioToggle = (e) => {
      const nextMuted = e.detail?.muted;
      if (typeof nextMuted === 'boolean') {
        setIsMuted(nextMuted);
        if (videoRef.current) {
          videoRef.current.muted = nextMuted;
        }
      }
    };

    window.addEventListener('fortaa:feed_video_mute_toggle', handleAudioToggle);
    return () => {
      window.removeEventListener('fortaa:feed_video_mute_toggle', handleAudioToggle);
    };
  }, []);

  // Inherit global audio preference whenever src or component updates
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalFeedAudioMuted;
      setIsMuted(globalFeedAudioMuted);
    }
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const playSafely = () => {
      if (!el.paused) return;
      el.muted = globalFeedAudioMuted;
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser policy prevents unmuted autoplay on a new video,
          // temporarily mute to guarantee playback never gets stuck
          if (!el.muted) {
            el.muted = true;
            setIsMuted(true);
            el.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
    };

    const checkVisibility = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

      // When scrolled out of screen or less than 35% visible: immediately auto-pause (turn off)
      const isOffScreen = rect.bottom <= 40 || rect.top >= (windowHeight - 40) || visibleRatio < 0.35;

      if (isOffScreen) {
        if (!el.paused) {
          el.pause();
          setIsPlaying(false);
        }
      } else if (visibleRatio >= 0.5) {
        // Comfortably in screen: autoplay with global audio state
        playSafely();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            playSafely();
          } else {
            el.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.25, 0.45, 0.75] }
    );

    observer.observe(el);

    // Capture all scrolling events across window and inner containers (.ud-content-scroll-container, mobile wrapper, document)
    window.addEventListener('scroll', checkVisibility, { passive: true, capture: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    // Initial check
    checkVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkVisibility, { capture: true });
      window.removeEventListener('resize', checkVisibility);
    };
  }, [src]);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    // Broadcast globally to all other feed videos and persist
    broadcastFeedAudioState(nextMuted);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={isMobile ? "ud-mob-post-banner-wrap ud-post-video-box" : "ud-post-image-box ud-post-video-box"}
      onClick={togglePlay}
      onDoubleClick={onDoubleTap}
      onTouchEnd={onSingleTap}
      style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', background: '#000' }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        className={isMobile ? "ud-mob-post-banner-img ud-feed-video-el" : "ud-post-img ud-feed-video-el"}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Instagram-style sound toggle icon button (icon only) */}
      <button
        type="button"
        className="ud-video-sound-circle-btn"
        onClick={toggleSound}
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
      </button>

      {/* Pause indicator overlay */}
      {!isPlaying && (
        <div className="ud-video-play-center-btn" title="Click to play">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {/* Double-tap heart animation */}
      {isHeartActive && (
        <div className="ud-insta-heart-overlay">
          <svg className="ud-insta-heart-icon" viewBox="0 0 24 24" fill="#FF2D55">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Interactive Poll Component for Feed Posts ──
export function PostPoll({ pollData, postId, onVote, currentUserId }) {
  let poll = null;
  try {
    poll = typeof pollData === 'string' ? JSON.parse(pollData) : pollData;
  } catch {
    poll = null;
  }

  if (!poll || !poll.options || !Array.isArray(poll.options)) return null;

  const voters = poll.voters || {};
  const userVote = voters[currentUserId] !== undefined ? voters[currentUserId] : null;
  const hasVoted = userVote !== null;
  const totalVotes = poll.totalVotes !== undefined
    ? Number(poll.totalVotes)
    : poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

  return (
    <div className="ud-poll-card" onClick={(e) => e.stopPropagation()}>
      <div className="ud-poll-question">
        <span className="ud-poll-icon">📊</span>
        <span>{poll.question}</span>
      </div>
      <div className="ud-poll-options">
        {poll.options.map((opt) => {
          const votes = Number(opt.votes) || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = Number(userVote) === Number(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              className={`ud-poll-option-btn ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
              onClick={() => onVote(opt.id)}
            >
              {hasVoted && (
                <div
                  className="ud-poll-option-fill"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="ud-poll-option-text">
                <span className={`ud-poll-radio ${isSelected ? 'checked' : ''}`}></span>
                <span>{opt.text}</span>
              </span>
              {hasVoted && (
                <span className="ud-poll-option-pct">{pct}%</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="ud-poll-footer">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        <span>•</span>
        <span>{hasVoted ? 'You have voted' : 'Tap an option to vote'}</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');
  const [postText, setPostText] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logged in user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));

  useEffect(() => {
    if (!isUserAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      // If someone visited pure dashboard without a shared post parameter, redirect to login
      if (!params.get('post')) {
        navigate('/login', { replace: true });
      }
    }
  }, [isUserAuthenticated, navigate]);

  const [profile, setProfile] = useState({
    id: storedUser.id || 13,
    name: storedUser.name || 'Kapil Dhakad',
    role: storedUser.designation || 'Gold Leader',
    memberId: storedUser.memberId || 'NS381517',
    company: storedUser.companyBrand || storedUser.businessName || 'Index Technology',
    avatarUrl: storedUser.avatarUrl || null,
  });

  const [stats, setStats] = useState({
    network: 0,
    followers: 0,
    following: 0,
    totalPosts: 0,
  });

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = React.useMemo(() => {
    if (!searchQuery?.trim()) return posts;
    const q = searchQuery.toLowerCase().trim();
    return posts.filter(
      (p) =>
        (p.author_name || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (p.author_role || '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [activeMenuPost, setActiveMenuPost] = useState(null);
  const [aboutAccountPost, setAboutAccountPost] = useState(null);
  const [instagramModalPost, setInstagramModalPost] = useState(null);
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [leadersList, setLeadersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [opportunitiesList, setOpportunitiesList] = useState([]);

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isInviteTeamModalOpen, setIsInviteTeamModalOpen] = useState(false);
  const [heartAnimPostIds, setHeartAnimPostIds] = useState({});
  const lastTapTimes = useRef({});
  const tapTimerRef = useRef({});

  const triggerDoubleTapLike = (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post?.has_liked) {
      handleLike(postId);
    }
    setHeartAnimPostIds((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setHeartAnimPostIds((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 850);
  };

  const handlePostMediaTouch = (e, post) => {
    const now = Date.now();
    const lastTime = lastTapTimes.current[post.id] || 0;
    if (now - lastTime < 320) {
      // Double tap detected! Like the post (Instagram style)
      if (tapTimerRef.current[post.id]) {
        clearTimeout(tapTimerRef.current[post.id]);
        delete tapTimerRef.current[post.id];
      }
      triggerDoubleTapLike(post.id);
      lastTapTimes.current[post.id] = 0;
    } else {
      // First tap: record timestamp for double tap; DO NOT open modal on scroll/single tap
      lastTapTimes.current[post.id] = now;
      if (tapTimerRef.current[post.id]) {
        clearTimeout(tapTimerRef.current[post.id]);
        delete tapTimerRef.current[post.id];
      }
    }
  };
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [postVideoFile, setPostVideoFile] = useState(null);
  const [postVideoPreview, setPostVideoPreview] = useState(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const postInputRef = useRef(null);

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false);

  // Sync real-time message and notification counts for mobile header
  useEffect(() => {
    const myId = profile.id || storedUser.id;
    if (!myId) return;
    let isMounted = true;

    const refreshCounts = () => {
      fetchUnreadCount(myId)
        .then((cnt) => { if (isMounted) setUnreadNotifCount(cnt || 0); })
        .catch(() => {});
      fetchUnreadMessageCount(myId)
        .then((cnt) => { if (isMounted) setUnreadMsgCount(cnt || 0); })
        .catch(() => {});
    };

    refreshCounts();

    joinChat(myId);
    const s = getSocket();
    s.on('new_notification', refreshCounts);
    s.on('follow_request_received', refreshCounts);
    s.on('new_message', refreshCounts);
    s.on('messages_read', refreshCounts);
    s.on('messages_marked_read', refreshCounts);

    const handleWindowRefresh = () => refreshCounts();
    window.addEventListener('messages_count_refresh', handleWindowRefresh);

    const interval = setInterval(refreshCounts, 5000);

    return () => {
      isMounted = false;
      s.off('new_notification', refreshCounts);
      s.off('follow_request_received', refreshCounts);
      s.off('new_message', refreshCounts);
      s.off('messages_read', refreshCounts);
      s.off('messages_marked_read', refreshCounts);
      window.removeEventListener('messages_count_refresh', handleWindowRefresh);
      clearInterval(interval);
    };
  }, [profile.id, storedUser.id]);

  // Load live data from Backend APIs on Mount
  useEffect(() => {
    async function loadDashboardData() {
      // 1. Overview & stats
      const overview = await fetchDashboardOverview(storedUser.email || '');
      let currentId = storedUser.id || 13;
      if (overview?.success) {
        if (overview.user) {
          currentId = overview.user.id || currentId;
          const freshAvatar = overview.user.avatar_url || storedUser.avatarUrl || null;
          setProfile({
            id: currentId,
            name: overview.user.name || storedUser.name || 'Kapil Dhakad',
            role: overview.user.designation || 'Gold Leader',
            memberId: overview.user.member_id || storedUser.memberId || 'NS381517',
            company: overview.user.company_brand || overview.user.business_name || 'Index Technology',
            avatarUrl: freshAvatar,
          });

          // Sync localStorage so id and profile info are always accurately persisted
          try {
            const cur = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
            localStorage.setItem(
              'fortaa_user',
              JSON.stringify({ ...cur, id: currentId, ...overview.user })
            );
            window.dispatchEvent(new CustomEvent('fortaa_user_synced', { detail: overview.user }));
          } catch {}
        }
        if (overview.stats) {
          setStats(overview.stats);
        }
      }

      // 2. Fetch following & pending IDs for this user
      const fData = await fetchFollowingIds(currentId);
      setFollowingIds(fData?.followingIds || []);
      setPendingIds(fData?.pendingIds || []);

      // 3. Fetch Posts (Personalized feed for this user)
      const livePosts = await fetchPosts(currentId);
      setPosts(Array.isArray(livePosts) ? livePosts : []);

      // 4. Supporting widgets
      const [tData, lData, sData, eData, gData, oData] = await Promise.all([
        fetchTrainers(),
        fetchLeaders(currentId),
        fetchServices(),
        fetchEvents(),
        fetchGroups(),
        fetchOpportunities(),
      ]);

      if (tData?.length) setTrainersList(tData);
      
      // Load real database users/leaders (excluding current user)
      const rawLeaders = Array.isArray(lData) ? lData : [];
      const visibleLeaders = rawLeaders.filter(
        (lead) => Number(lead.id) !== Number(currentId)
      );
      setLeadersList(visibleLeaders);

      if (sData?.length) setServicesList(sData);
      if (eData?.length) setEventsList(eData);
      if (gData?.length) setGroupsList(gData);
      if (oData?.length) setOpportunitiesList(oData);
    }

    loadDashboardData();

    // Join personal Socket room for real-time alerts
    const myId = storedUser.id || 13;
    joinChat(myId);

    // Subscribe to live follow events (when another user accepts your follow request)
    const unsubFollow = subscribeToFollowEvents({
      onFollowAccepted: ({ targetUserId, targetName }) => {
        const numId = Number(targetUserId);
        setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
        setFollowingIds((prev) => [...new Set([...prev, numId])]);
        setStats((prev) => ({ ...prev, following: (Number(prev.following) || 0) + 1 }));
        toast.success(`${targetName || 'User'} accepted your follow request! 🎉`);
      },
      onFollowUpdated: () => {
        fetchFollowingIds(myId).then((fData) => {
          setFollowingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData?.followingIds || []), ...demoIds])];
          });
          setPendingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData?.pendingIds || []), ...demoIds])];
          });
        });
      },
    });

    // 4-second background sync fallback to guarantee real-time state without page reload
    const pollInterval = setInterval(() => {
      fetchFollowingIds(myId).then((fData) => {
        if (fData?.followingIds) {
          setFollowingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData.followingIds || []), ...demoIds])];
          });
        }
        if (fData?.pendingIds) {
          setPendingIds((prev) => {
            const demoIds = prev.filter((id) => Number(id) >= 100);
            return [...new Set([...(fData.pendingIds || []), ...demoIds])];
          });
        }
      });
    }, 4000);

    return () => {
      unsubFollow?.();
      clearInterval(pollInterval);
    };
  }, []);

  // Handle Photo File Pick
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
    setPostVideoFile(null);
    setPostVideoPreview(null);
  };

  // Handle Video File Pick (Max 100MB)
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size should not exceed 100MB');
      return;
    }
    setPostVideoFile(file);
    setPostVideoPreview(URL.createObjectURL(file));
    setPostImageFile(null);
    setPostImagePreview(null);
  };

  const isPostVideo = (p) => {
    if (!p) return false;
    if (p.media_type === 'video' || p.video_url) return true;
    if (p.image_url && /\.(mp4|webm|mov|mkv|avi)(\?.*)?$/i.test(p.image_url)) return true;
    return false;
  };

  // Submit Post to Backend (supports description only, with photo, video, or interactive poll)
  const handleCreatePost = async () => {
    if (!postText.trim() && !showPollCreator) {
      toast.error('Please enter a description or question for your post');
      return;
    }

    let pollPayload = null;
    if (showPollCreator) {
      const q = (pollQuestion || postText).trim();
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!q) {
        toast.error('Please enter a question for your poll');
        return;
      }
      if (validOptions.length < 2) {
        toast.error('Please provide at least 2 options for your poll');
        return;
      }
      pollPayload = {
        question: q,
        options: validOptions.map((optText, idx) => ({ id: idx + 1, text: optText, votes: 0 })),
        voters: {},
        totalVotes: 0,
      };
    }

    setSubmittingPost(true);
    try {
      let uploadedImageUrl = null;
      let uploadedVideoUrl = null;

      if (postImageFile) {
        uploadedImageUrl = await uploadSingleImage(postImageFile, 'posts');
      } else if (postVideoFile) {
        uploadedVideoUrl = await uploadSingleVideo(postVideoFile, 'posts');
        if (!uploadedVideoUrl) {
          setSubmittingPost(false);
          return;
        }
      }

      const createdPost = await submitPost({
        content: postText.trim() || (pollPayload ? pollPayload.question : ''),
        tags: null,
        imageUrl: uploadedImageUrl,
        videoUrl: uploadedVideoUrl,
        mediaType: uploadedVideoUrl ? 'video' : 'image',
        pollData: pollPayload,
        authorName: profile.name,
        authorRole: profile.role,
        authorAvatar: profile.avatarUrl || null,
        userId: profile.id,
      });

      setPosts((prev) => [createdPost, ...prev]);
      setPostText('');
      setPostImageFile(null);
      setPostImagePreview(null);
      setPostVideoFile(null);
      setPostVideoPreview(null);
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsCreatePostModalOpen(false);
      setStats((prev) => ({
        ...prev,
        totalPosts: (Number(prev.totalPosts) || 0) + 1,
      }));
      toast.success(
        pollPayload
          ? 'Poll published successfully! 📊'
          : uploadedVideoUrl
          ? 'Video post published successfully! 🚀'
          : 'Post published successfully! 🚀'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Vote on an Interactive Poll in Feed
  const handleVotePoll = async (postId, optionId) => {
    const voterId = profile.id;
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        let poll = null;
        try {
          poll = typeof p.poll_data === 'string' ? JSON.parse(p.poll_data) : p.poll_data;
        } catch {
          poll = null;
        }
        if (!poll || !poll.options) return p;

        poll = { ...poll, voters: { ...(poll.voters || {}) } };
        const prevOptionId = poll.voters[voterId];
        if (prevOptionId === optionId) return p; // already selected

        poll.options = (poll.options || []).map((opt) => {
          let votes = Number(opt.votes) || 0;
          if (opt.id === prevOptionId) votes = Math.max(0, votes - 1);
          if (opt.id === optionId) votes += 1;
          return { ...opt, votes };
        });
        poll.voters[voterId] = optionId;
        poll.totalVotes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);
        return { ...p, poll_data: poll };
      })
    );

    try {
      const res = await votePollApi(postId, optionId, voterId);
      if (res?.success && res.pollData) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? { ...p, poll_data: res.pollData } : p))
        );
      }
    } catch (err) {
      console.warn('Vote poll error:', err);
    }
  };

  // Handle Follow / Request / Unfollow
  const handleToggleFollow = async (targetUserId, targetName) => {
    if (!targetUserId) {
      toast('Followed demo leader!');
      return;
    }
    const numId = Number(targetUserId);
    if (numId === Number(profile.id)) {
      toast.error('You cannot follow yourself');
      return;
    }

    const isPending = pendingIds.map(Number).includes(numId);
    const isFollowed = followingIds.map(Number).includes(numId);

    if (isPending) {
      // Cancel request
      setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
      toast('Follow request cancelled', { icon: 'ℹ️' });
      try {
        await cancelFollowRequest(numId, profile.id);
      } catch (err) {
        console.warn('Cancel follow note:', err?.message || err);
      }
    } else if (isFollowed) {
      // Unfollow
      setFollowingIds((prev) => prev.filter((id) => Number(id) !== numId));
      setStats((prev) => ({ ...prev, following: Math.max(0, (Number(prev.following) || 0) - 1) }));
      toast(`Unfollowed ${targetName}`);
      try {
        await unfollowUser(numId, profile.id);
      } catch (err) {
        console.warn('Unfollow note:', err?.message || err);
      }
    } else {
      // Send Follow Request or Direct Follow
      setPendingIds((prev) => [...prev, numId]);
      try {
        const res = await sendFollowRequest(numId, profile.id);
        if (res && res.status === 'accepted') {
          setPendingIds((prev) => prev.filter((id) => Number(id) !== numId));
          setFollowingIds((prev) => [...prev, numId]);
          setStats((prev) => ({ ...prev, following: (Number(prev.following) || 0) + 1 }));
          toast.success(`You are now following ${targetName}!`);
        } else {
          toast.success(`Follow request sent to ${targetName}!`);
        }
      } catch (err) {
        console.warn('Send follow request note:', err?.message || err);
      }
    }
  };

  // Handle Like (1 like per user toggle)
  const handleLike = async (postId) => {
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const isAlreadyLiked = Boolean(currentPost.has_liked);
    const nextLiked = !isAlreadyLiked;
    const nextCount = Math.max(0, (Number(currentPost.likes_count) || 0) + (nextLiked ? 1 : -1));

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes_count: nextCount,
              has_liked: nextLiked,
              latest_liker_name: nextLiked ? (profile.name || 'you') : p.latest_liker_name,
            }
          : p
      )
    );

    // Persist to backend with userId
    const res = await likePostApi(postId, profile.id);
    if (res?.post) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: res.post.likes_count,
                has_liked: res.liked,
                latest_liker_name: res.post.latest_liker_name || p.latest_liker_name,
                latest_liker_avatar: res.post.latest_liker_avatar || p.latest_liker_avatar,
              }
            : p
        )
      );
    }
  };

  // Handle Author profile click navigation
  const handleAuthorClick = (post) => {
    if (!post) return;
    let targetId = post.user_id || post.author_id || post.userId;
    if (!targetId && post.author_name) {
      const match = leadersList.find(
        (l) => l.name && l.name.toLowerCase().trim() === post.author_name.toLowerCase().trim()
      );
      if (match?.id) targetId = match.id;
    }

    if (targetId) {
      navigate(`/leader/${targetId}`, {
        state: {
          leader: {
            id: targetId,
            name: post.author_name,
            avatar: post.author_avatar,
            levelTitle: post.author_role,
          },
        },
      });
    } else {
      navigate('/leaders');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fortaa_token');
    localStorage.removeItem('fortaa_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Quick Action Buttons
  const quickActions = [
    { label: 'Create Post', icon: qaCreatePostImg, bgColor: '#F6CEFF' },
    { label: 'Add Photo', icon: qaAddPhotoImg, bgColor: '#F6CEFF' },
    { label: 'Share Market Place', icon: qaMarketplaceImg, bgColor: '#E3FFF5' },
    { label: 'Invite Team', icon: qaInviteTeamImg, bgColor: '#DFD4FF' },
    { label: 'Join Group', icon: qaJoinGroupImg, bgColor: '#F6CEFF' },
    { label: 'Go Live', icon: qaGoLiveImg, bgColor: '#FFE3E3' },
  ];

  // Trainers
  const trainers = [
    { name: 'Neha Gupta', role: 'Diamond Leader', network: '1.2 Network', followers: '2K Followers' },
    { name: 'Amit Verma', role: 'Diamond Leader', network: '1.2 Network', followers: '5K Followers' },
    { name: 'Vikas Kumar', role: 'Diamond Leader', network: '1.2K Network', followers: '1.1K Followers' },
  ];

  // Leaders
  const leaders = [
    { name: 'Neha Verma', role: 'Business Leader' },
    { name: 'Anjali Singh', role: 'Silver Leader' },
    { name: 'Vikram Yadav', role: 'Team Leader' },
    { name: 'Pooja Verma', role: 'Business Leader' },
    { name: 'Anjali Singh', role: 'Silver Leader' },
    { name: 'Vikram Yadav', role: 'Team Leader' },
    { name: 'Pooja Verma', role: 'Business Leader' },
  ];

  // Services & Market Place
  const services = [
    {
      title: 'Digital Marketing Specialist',
      desc: 'Digital Marketing | Graphic Designer | Video Editor | Software Engineer',
      location: 'Indore, Madhya Pradesh, India',
      thumb: oppDigitalImg,
    },
    {
      title: 'Team Leader',
      desc: 'Team Management | Marketing / Training | Reporting | Compose Target',
      location: 'Rewa, Madhya Pradesh, India',
      thumb: userAvatarImg,
    },
    {
      title: 'Franchise Partner',
      desc: 'Franchise Opportunity | Business Set up Support | Marketing Support | Brand Licensing',
      location: 'France, Paris',
      thumb: oppLeadershipImg,
    },
    {
      title: 'Wellness Products',
      desc: 'Health Supplements | Personal Care Products | Herbal Products | Nutrition Products',
      location: 'Indore, Madhya Pradesh, India',
      thumb: oppWellnessImg,
    },
    {
      title: 'E - Commerce Business',
      desc: 'Online Store Setup | Product Listing | Order Management | Payment Integration',
      location: 'Pune, Maharashtra India',
      thumb: oppDigitalImg,
    },
    {
      title: 'Training & Development',
      desc: 'Professional Skills | Leadership | Sales Training | Career Development',
      location: 'Singapore',
      thumb: oppLeadershipImg,
    },
  ];

  // Upcoming Events
  const upcomingEvents = [
    { date: '20', month: 'NOV', title: 'Leadership Summit', type: 'Online' },
    { date: '20', month: 'NOV', title: 'Industry Networking Meet', type: 'New Delhi' },
    { date: '20', month: 'NOV', title: 'Business Growth Workshop', type: 'Online' },
  ];

  // Popular Groups
  const popularGroups = [
    { name: 'Success Mindset & Moti...', members: '12.4K members', sub: '3.8K mindset' },
    { name: 'Network Marketing Tips', members: '5.7K member', sub: '8.6 mindset' },
    { name: 'Health & Wellness Products', members: '8.2k member', sub: '6.2K mindset' },
  ];

  // Scroll Opportunities
  const opportunities = [
    {
      title: 'Digital Marketing Specialist',
      tags: ['Work from Home', 'High Earning'],
      price: '₹ 25k - 75k / month',
      image: oppDigitalImg,
    },
    {
      title: 'Leadership Program',
      isNew: true,
      tags: ['Build Team', 'Bonus'],
      price: '₹ 50k - 2L / month',
      image: oppLeadershipImg,
    },
    {
      title: 'Health & Wellness Specialist',
      tags: ['High Demand'],
      price: '₹ 10k - 50k / month',
      image: oppWellnessImg,
    },
  ];


  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="post" />
      )}
      <div className={`ud-page ${!isUserAuthenticated ? 'auth-gated-blur' : ''}`}>
      {/* ───────────────── SHARED REUSABLE TOPBAR (Handles Desktop & Mobile Viewports) ───────────────── */}
      <UserHeader
        user={profile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onProfileClick={() => navigate('/profile')}
        onMessagesClick={() => navigate('/messages')}
      />

      {/* ───────────────── DESKTOP VIEW (> 768px) ───────────────── */}
      <div className="ud-desktop-only">
        {/* ───────────────── MAIN WRAPPER: PINNED SIDEBAR + SCROLLABLE RIGHT CONTENT ───────────────── */}
        <div className="ud-main-wrapper">
          {/* ── PANEL 1: LEFT SIDEBAR NAVIGATION (PINNED) ── */}
          <UserSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'My Profile') navigate('/profile');
              if (tab === 'Messages') navigate('/messages');
              if (tab === 'Leaders') navigate('/leaders');
              if (tab === 'Following') navigate('/following');
            }}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />


        {/* ── SCROLLABLE RIGHT CONTAINER ── */}
        <div className="ud-content-scroll-container" id="ud-content-scroll-container">
          <div className="ud-content-columns">
            {/* ── PANEL 2: MAIN FEED & DISCOVERY ── */}
            <main className="ud-feed-main">
              {/* Wide Feed Column */}
          <div className="ud-center-split-grid">
            {/* Feed Column (Left) */}
            <div className="ud-feed-column">
              {/* Create a Post Box */}
              <div className="ud-create-post-card">
                <div className="ud-cp-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#232356" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ud-cp-title-icon">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="ud-cp-title">Create a Post</span>
                  </div>
                </div>
                <div className="ud-cp-input-row">
                  <img src={profile.avatarUrl || userAvatarImg} alt="" className="ud-cp-avatar" />
                  <textarea
                    ref={postInputRef}
                    className="ud-cp-textarea"
                    rows={2}
                    placeholder={showPollCreator ? "Add a description or note with your poll..." : "Share your thoughts, business opportunity or updates..."}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />
                </div>

                {/* Poll Creator Box */}
                {showPollCreator && (
                  <div className="ud-cp-poll-box">
                    <div className="ud-cp-poll-head">
                      <span className="ud-cp-poll-badge">📊 Create a Poll</span>
                      <button
                        type="button"
                        className="ud-cp-poll-close"
                        onClick={() => {
                          setShowPollCreator(false);
                          setPollQuestion('');
                          setPollOptions(['', '']);
                        }}
                        title="Cancel poll"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      className="ud-cp-poll-q-input"
                      placeholder="Ask a question..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                    />
                    <div className="ud-cp-poll-opts">
                      {pollOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="ud-cp-poll-opt-row">
                          <span className="ud-cp-poll-opt-num">{oIdx + 1}.</span>
                          <input
                            type="text"
                            className="ud-cp-poll-opt-input"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[oIdx] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              className="ud-cp-poll-del-opt"
                              onClick={() => {
                                setPollOptions(pollOptions.filter((_, i) => i !== oIdx));
                              }}
                              title="Remove option"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {pollOptions.length < 4 && (
                      <button
                        type="button"
                        className="ud-cp-poll-add-btn"
                        onClick={() => setPollOptions([...pollOptions, ''])}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* Photo Preview if attached */}
                {postImagePreview && (
                  <div style={{ position: 'relative', margin: '8px 0', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={postImagePreview}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPostImageFile(null);
                        setPostImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Video Preview if attached */}
                {postVideoPreview && (
                  <div style={{ position: 'relative', margin: '8px 0', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    <video
                      src={postVideoPreview}
                      controls
                      playsInline
                      style={{ width: '100%', maxHeight: '200px', display: 'block', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPostVideoFile(null);
                        setPostVideoPreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Hidden File Inputs for Image & Video */}
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/*"
                  style={{ display: 'none' }}
                  onChange={handleVideoSelect}
                />

                <div className="ud-cp-actions-row">
                  <div className="ud-cp-tags">
                    <button
                      type="button"
                      className={`ud-cp-tag ud-cp-tag-photo ${postImagePreview ? 'active' : ''}`}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      📷 Photo
                    </button>
                    <button
                      type="button"
                      className={`ud-cp-tag ud-cp-tag-video ${postVideoPreview ? 'active' : ''}`}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      🎥 Video
                    </button>
                    <button
                      type="button"
                      className={`ud-cp-tag ud-cp-tag-poll ${showPollCreator ? 'active' : ''}`}
                      onClick={() => setShowPollCreator(!showPollCreator)}
                    >
                      📊 Poll
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ud-cp-btn-post"
                    onClick={handleCreatePost}
                    disabled={submittingPost}
                  >
                    {submittingPost ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>

              {/* ── POST SECTION (Real User Feed) ── */}
              <div className="ud-post-section">
                {searchQuery.trim() && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: '#F3EEFE',
                    borderRadius: '10px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    color: '#5A2CE4',
                    fontWeight: '600'
                  }}>
                    <span>Showing posts matching "{searchQuery}" ({filteredPosts.length})</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#5A2CE4',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Clear ✕
                    </button>
                  </div>
                )}
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, pIdx) => (
                    <React.Fragment key={post.id || pIdx}>
                      <div className={`ud-post-item ${pIdx === 0 ? 'ud-post-item-first' : 'ud-post-item-second'}`}>
                      <div className="ud-post-header">
                        <div
                          className="ud-post-avatar-wrap"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleAuthorClick(post)}
                          title="View Profile"
                        >
                          <img
                            src={post.author_avatar || userAvatarImg}
                            alt=""
                            className="ud-post-avatar"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = userAvatarImg;
                            }}
                          />
                          <span className="ud-post-online-dot"></span>
                        </div>
                        <div className="ud-post-author-meta">
                          <div className="ud-post-author-name-row">
                            <span
                              className="ud-post-author-name"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleAuthorClick(post)}
                              title="View Profile"
                            >
                              {post.author_name}
                            </span>
                          </div>
                          <div className="ud-post-author-headline">
                            {post.author_role || 'Senior Leader • Fortaa'}
                          </div>
                          <div className="ud-post-time-row">
                            <span className="ud-post-time">
                              {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                        </div>
                        {(() => {
                          const myId = Number(profile.id || storedUser.id || 13);
                          const isSelf =
                            (post.user_id && Number(post.user_id) === myId) ||
                            (post.author_name && profile.name && post.author_name.toLowerCase().trim() === profile.name.toLowerCase().trim());
                          if (isSelf) return null;
                          const targetId = post.user_id ? Number(post.user_id) : null;
                          if (!targetId) return null;
                          const isFollowed = followingIds.map(Number).includes(targetId);
                          const isPending = pendingIds.map(Number).includes(targetId);

                          // Once follow request is sent (pending) or already followed, hide follow button completely from dashboard
                          if (isFollowed || isPending) return null;

                          return (
                            <button
                              type="button"
                              className="ud-btn-follow-post"
                              onClick={() => handleToggleFollow(targetId, post.author_name || 'Leader')}
                            >
                              Follow
                            </button>
                          );
                        })()}
                        <button
                          className="ud-btn-post-menu"
                          type="button"
                          onClick={() => setActiveMenuPost(post)}
                          title="More options"
                        >
                          ⋮
                        </button>
                      </div>

                      <div className="ud-post-body">
                        <p className="ud-post-text">{renderFormattedContent(post.content)}</p>
                        {post.tags && <p className="ud-post-tags">{post.tags}</p>}

                        {/* Interactive Poll if attached */}
                        {post.poll_data && (
                          <PostPoll
                            pollData={post.poll_data}
                            postId={post.id}
                            onVote={(optionId) => handleVotePoll(post.id, optionId)}
                            currentUserId={profile.id}
                          />
                        )}

                        {/* Post Media (Video with Instagram Autoplay or Image) */}
                        {isPostVideo(post) ? (
                          <FeedVideo
                            src={post.video_url || post.image_url}
                            onDoubleTap={(e) => {
                              e.stopPropagation();
                              triggerDoubleTapLike(post.id);
                            }}
                            onSingleTap={(e) => handlePostMediaTouch(e, post)}
                            isHeartActive={Boolean(heartAnimPostIds[post.id])}
                            isMobile={false}
                          />
                        ) : post.image_url ? (
                          <div
                            className="ud-post-image-box"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              triggerDoubleTapLike(post.id);
                            }}
                            onTouchEnd={(e) => handlePostMediaTouch(e, post)}
                          >
                            <img
                              src={post.image_url}
                              alt="Post Media"
                              className="ud-post-img"
                            />
                            <div className="ud-post-img-logo-badge">
                              <img src={logoTextImg} alt="FORTAA" className="ud-post-logo-badge-img" />
                            </div>
                            {heartAnimPostIds[post.id] && (
                              <div className="ud-insta-heart-overlay">
                                <svg className="ud-insta-heart-icon" viewBox="0 0 24 24" fill="#FF2D55">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Post Reactions & Instagram-style Likes Row */}
                      <div className="ud-post-reactions-row">
                        {renderInstagramLikes(post, profile, (pid) => setLikesModalPostId(pid))}
                        <div
                          className="ud-post-comment-counts"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                          title="View comments"
                        >
                          <span className="ud-metric-pill" title={`${post.comments_count || 0} comments`}>
                            <FaRegComment size={14} className="ud-metric-icon" />
                            <span>{post.comments_count || 0}</span>
                          </span>
                          <span className="ud-metric-dot">•</span>
                          <span className="ud-metric-pill" title={`${post.shares_count || 0} shares`}>
                            <RiShareForwardLine size={15} className="ud-metric-icon" />
                            <span>{post.shares_count || 0}</span>
                          </span>
                        </div>
                      </div>

                      <div className="ud-post-interact-bar">
                        <button
                          type="button"
                          className={`ud-interact-btn ud-btn-like ${post.has_liked ? 'liked-active' : ''}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <span className="ud-interact-icon-wrap">
                            {post.has_liked ? (
                              <FaThumbsUp size={16} className="ud-like-icon" />
                            ) : (
                              <FaRegThumbsUp size={16} className="ud-like-icon" />
                            )}
                          </span>
                          <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                        </button>
                        <button
                          type="button"
                          className={`ud-interact-btn ud-btn-comment ${openCommentsPostId === post.id ? 'active' : ''}`}
                          onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                        >
                          <span className="ud-interact-icon-wrap">
                            <FaRegComment size={16} className="ud-comment-icon" />
                          </span>
                          <span>Comment</span>
                        </button>
                        <button
                          type="button"
                          className="ud-interact-btn ud-btn-share"
                          onClick={() => setShareModalPost(post)}
                        >
                          <span className="ud-interact-icon-wrap">
                            <RiShareForwardLine size={18} className="ud-share-icon" />
                          </span>
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Expandable Comments Drawer */}
                      {openCommentsPostId === post.id && (
                        <PostComments
                          postId={post.id}
                          currentUser={profile}
                          initialCount={post.comments_count || 0}
                          onCommentAdded={(newCount) => {
                            setPosts((prev) =>
                              prev.map((p) => (p.id === post.id ? { ...p, comments_count: newCount } : p))
                            );
                          }}
                        />
                      )}
                      </div>
                      {/* 1st Slot: Trainers (after 5 posts, or every 10 posts starting at 5) */}
                      {((pIdx + 1) % 10 === 5 || (posts.length <= 5 && pIdx === posts.length - 1)) && (
                        <InFeedSuggestedPeople
                          type="trainers"
                          trainers={trainersList.length ? trainersList : trainers}
                          leaders={leadersList}
                          followingIds={followingIds}
                          pendingIds={pendingIds}
                          onToggleFollow={handleToggleFollow}
                          navigate={navigate}
                        />
                      )}
                      {/* 2nd Slot: Leaders (after 10 posts, or at the end if between 6 and 9 posts) */}
                      {((pIdx + 1) % 10 === 0 || (posts.length > 5 && posts.length < 10 && pIdx === posts.length - 1) || (posts.length <= 5 && pIdx === posts.length - 1)) && (
                        <InFeedSuggestedPeople
                          type="leaders"
                          trainers={trainersList.length ? trainersList : trainers}
                          leaders={leadersList}
                          followingIds={followingIds}
                          pendingIds={pendingIds}
                          onToggleFollow={handleToggleFollow}
                          navigate={navigate}
                        />
                      )}
                    </React.Fragment>
                  ))
                ) : searchQuery.trim() ? (
                  <div
                    style={{
                      padding: '40px 24px',
                      textAlign: 'center',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      margin: '16px 0',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1E1B4B', fontWeight: 700 }}>
                      No posts found for "{searchQuery}"
                    </h4>
                    <p style={{ margin: '0 0 16px 0', color: '#64748B', fontSize: '13px' }}>
                      Try searching another name or browse the directory.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        padding: '8px 18px',
                        background: '#5A2CE4',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '40px 24px',
                      textAlign: 'center',
                      background: '#F9FAFB',
                      borderRadius: '10px',
                      border: '1px dashed #D1D5DB',
                      margin: '16px 0',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📝</div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1F2937', fontWeight: 600 }}>No posts yet</h4>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>
                      Be the first to share an update, opportunity or photo with your network!
                    </p>
                  </div>
                )}

                
              </div>
            </div>


            
          </div>
        </main>

        {/* ── PANEL 3: RIGHT PANEL (SERVICES, EVENTS & GROUPS) ── */}
        <aside className="ud-sidebar-right">
          {/* Services & Market place (Figma Frame 138: 403x605px) */}
          <div className="ud-right-box ud-services-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={navServicesIcon} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span>Services &amp; Market place</span>
              </h3>
              <a href="#services" className="ud-side-card-view-all">View All →</a>
            </div>
            <div className="ud-services-list">
              {(servicesList.length ? servicesList : services).map((srv, idx) => (
                <div key={srv.id || idx} className="ud-service-item">
                  <img src={srv.thumb || srv.thumb_url || oppDigitalImg} alt={srv.title} className="ud-service-thumb" />
                  <div className="ud-service-content">
                    <h4 className="ud-service-name">{srv.title}</h4>
                    <p className="ud-service-desc">{srv.desc || srv.description}</p>
                    <div className="ud-service-meta-row">
                      <span className="ud-service-loc">📍 {srv.location}</span>
                      <div className="ud-service-socials">
                        <span>💬</span>
                        <span>📷</span>
                        <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <button className="ud-btn-view-details" onClick={() => toast(`Viewing details for ${srv.title}`)}>
                    View Details →
                  </button>
                </div>
              ))}
            </div>
            <button className="ud-btn-view-all-wide">View All →</button>
          </div>

          {/* Upcoming Events (Figma Frame 44) */}
          <div className="ud-right-box ud-events-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title">Upcoming Events</h3>
              <a href="#events" className="ud-side-card-view-all">View All →</a>
            </div>
            <div className="ud-events-mini-list">
              {(eventsList.length ? eventsList : upcomingEvents).map((ev, idx) => (
                <div key={ev.id || idx} className="ud-event-mini-item">
                  <div className="ud-event-mini-date">
                    <span className="ev-date-num">{ev.date}</span>
                    <span className="ev-date-mo">{ev.month}</span>
                  </div>
                  <div className="ud-event-mini-info">
                    <h5 className="ev-mini-name">{ev.title}</h5>
                    <span className="ev-mini-meta">📍 {ev.type} • Join Now →</span>
                  </div>
                  <button className="ud-btn-view-all-pill" onClick={() => toast.success(`Registered for ${ev.title}!`)}>
                    View All →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Groups (Figma Frame 136: 403x227px) */}
          <div className="ud-right-box ud-groups-box">
            <div className="ud-side-card-header">
              <h3 className="ud-side-card-title">👥 Popular Groups</h3>
              <button
                type="button"
                className="ud-side-card-view-all"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setIsJoinGroupModalOpen(true)}
              >
                View All →
              </button>
            </div>
            <div className="ud-groups-list">
              {(groupsList.length ? groupsList : popularGroups).map((grp, idx) => (
                <div key={grp.id || idx} className="ud-group-item">
                  <div className="ud-group-avatar">👥</div>
                  <div className="ud-group-info">
                    <h5 className="ud-group-name">{grp.name}</h5>
                    <span className="ud-group-stats">{grp.members}</span>
                  </div>
                  <button
                    className="ud-btn-join-group"
                    onClick={() => setIsJoinGroupModalOpen(true)}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
          </div>

          

          {/* ───────────────── FOOTER ───────────────── */}
          <footer className="ud-footer">
            <div className="ud-footer-inner">
              <div className="ud-footer-links">
                <a href="#about">About Us</a>
                <span>|</span>
                <a href="#contact">Contact Us</a>
                <span>|</span>
                <a href="#privacy">Privacy Policy</a>
                <span>|</span>
                <a href="#terms">Terms &amp; Conditions</a>
                <span>|</span>
                <a href="#help">Help Center</a>
              </div>
              <div className="ud-footer-copy">
                © 2026 Fortaa. All rights reserved.
              </div>
              <button
                className="ud-btn-scroll-top"
                onClick={() => {
                  const el = document.getElementById('ud-content-scroll-container');
                  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Scroll to Up ↑
              </button>
            </div>
          </footer>
        </div>
      </div>
      </div>

      {/* ───────────────── FIGMA MOBILE DASHBOARD (<= 768px) ───────────────── */}
      <div className="ud-mobile-only">
        {/* Main Content Card: Frame 109 (White container with soft glow) */}
        <div className="ud-mob-frame109">
          {/* Stories / Highlights Row (Frame 188 - 192) - Positioned on Top */}
          <div className="ud-mob-stories-row">
            {/* Story 1: Add Story */}
            <div className="ud-mob-story-card story-add" onClick={() => setIsCreatePostModalOpen(true)}>
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-add-icon">+</div>
              </div>
              <span className="ud-mob-story-name">Add Story</span>
            </div>

            {/* Story 2: Amit Yadav */}
            <div className="ud-mob-story-card story-amit">
              <div className="ud-mob-story-avatar-wrap">
                <img src={userAvatarImg} alt="Amit Yadav" className="ud-mob-story-img" />
                <span className="ud-mob-story-badge">+</span>
              </div>
              <span className="ud-mob-story-name">Amit Yadav</span>
            </div>

            {/* Story 3: Neha Gupta */}
            <div className="ud-mob-story-card story-neha">
              <div className="ud-mob-story-avatar-wrap">
                <img src={priyaSharmaImg} alt="Neha Gupta" className="ud-mob-story-img" />
                <span className="ud-mob-story-badge">+</span>
              </div>
              <span className="ud-mob-story-name">Neha Gupta</span>
            </div>

            {/* Story 4: Upcoming Event */}
            <div className="ud-mob-story-card story-event">
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-calendar-icon">📅</div>
              </div>
              <span className="ud-mob-story-name">Upcoming Event</span>
            </div>

            {/* Story 5: Top Leaders */}
            <div className="ud-mob-story-card story-leaders" onClick={() => navigate("/leaders")} style={{ cursor: "pointer" }}>
              <div className="ud-mob-story-avatar-wrap">
                <div className="ud-mob-story-crown-icon">👑</div>
              </div>
              <span className="ud-mob-story-name">Top Leaders</span>
            </div>
          </div>

          {/* Create Post Strip - Positioned Below Stories */}
          <div className="ud-mob-create-post-strip">
            <div className="ud-mob-cp-top">
              <img src={profile.avatarUrl || userAvatarImg} alt="" className="ud-mob-cp-avatar" />
              <input
                type="text"
                className="ud-mob-cp-input"
                placeholder="Share your thoughts, success, opportunity or updates.."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePost();
                }}
              />
            </div>

            {/* Mobile Media Preview if attached */}
            {postImagePreview && (
              <div style={{ position: 'relative', margin: '6px 12px 10px', borderRadius: '8px', overflow: 'hidden' }}>
                <img
                  src={postImagePreview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPostImageFile(null);
                    setPostImagePreview(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {postVideoPreview && (
              <div style={{ position: 'relative', margin: '6px 12px 10px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                <video
                  src={postVideoPreview}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '180px', display: 'block', borderRadius: '8px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPostVideoFile(null);
                    setPostVideoPreview(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mobile Poll Creator Box */}
            {showPollCreator && (
              <div className="ud-cp-poll-box" style={{ margin: '6px 12px 10px' }}>
                <div className="ud-cp-poll-head">
                  <span className="ud-cp-poll-badge">📊 Create a Poll</span>
                  <button
                    type="button"
                    className="ud-cp-poll-close"
                    onClick={() => {
                      setShowPollCreator(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    }}
                    title="Cancel poll"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  className="ud-cp-poll-q-input"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                <div className="ud-cp-poll-opts">
                  {pollOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="ud-cp-poll-opt-row">
                      <span className="ud-cp-poll-opt-num">{oIdx + 1}.</span>
                      <input
                        type="text"
                        className="ud-cp-poll-opt-input"
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[oIdx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="ud-cp-poll-del-opt"
                          onClick={() => {
                            setPollOptions(pollOptions.filter((_, i) => i !== oIdx));
                          }}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    className="ud-cp-poll-add-btn"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            <div className="ud-mob-cp-pills">
              <button type="button" className={`ud-mob-cp-pill ${postImagePreview ? 'active' : ''}`} onClick={() => photoInputRef.current?.click()}>
                <span>📷</span>
                <span>Photo</span>
              </button>

              <button type="button" className={`ud-mob-cp-pill ${postVideoPreview ? 'active' : ''}`} onClick={() => videoInputRef.current?.click()}>
                <span>📹</span>
                <span>Video</span>
              </button>

              <button type="button" className={`ud-mob-cp-pill ${showPollCreator ? 'active' : ''}`} onClick={() => setShowPollCreator(!showPollCreator)}>
                <span>📊</span>
                <span>Poll</span>
              </button>

              <button
                type="button"
                className="ud-mob-cp-post-btn"
                onClick={handleCreatePost}
                disabled={submittingPost || (!postText.trim() && !showPollCreator)}
              >
                {submittingPost ? '...' : 'Post'}
              </button>
            </div>
          </div>

          {/* All Posts Feed */}
          <div className="ud-mob-posts-feed">
            {searchQuery?.trim() && (
              <div
                className="ud-mob-search-banner"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  background: '#F3EEFE',
                  borderRadius: '10px',
                  margin: '8px 12px 14px',
                  fontSize: '12px',
                  color: '#5A2CE4',
                  fontWeight: 600,
                  border: '1px solid #E9D5FF',
                }}
              >
                <span>Showing posts matching "{searchQuery}" ({filteredPosts.length})</span>
                <button
                  type="button"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #C084FC',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    color: '#5A2CE4',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              </div>
            )}
            {filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post, pIdx) => (
                <React.Fragment key={post.id || pIdx}>
                  <article className="ud-mob-post-card">
                  <div className="ud-mob-post-header">
                    <div className="ud-mob-post-author">
                      <div
                        className="ud-mob-author-avatar-wrap"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleAuthorClick(post)}
                        title="View Profile"
                      >
                        <img
                          src={post.author_avatar || userAvatarImg}
                          alt={post.author_name}
                          className="ud-mob-author-avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = userAvatarImg;
                          }}
                        />
                        <span className="ud-mob-online-dot" />
                      </div>
                      <div className="ud-mob-author-meta">
                        <div className="ud-mob-author-name-row">
                          <h4
                            className="ud-mob-author-name"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleAuthorClick(post)}
                            title="View Profile"
                          >
                            {post.author_name || 'Fortaa Member'}
                          </h4>
                        </div>
                        <div className="ud-mob-author-headline">
                          {post.author_role || 'Senior Leader • Fortaa'}
                        </div>
                        <div className="ud-mob-author-time-row">
                          <span>{formatRelativeTime(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ud-mob-post-header-right">
                      {(() => {
                        const myId = Number(profile.id || storedUser.id || 13);
                        const isSelf =
                          (post.user_id && Number(post.user_id) === myId) ||
                          (post.author_name && profile.name && post.author_name.toLowerCase().trim() === profile.name.toLowerCase().trim());
                        if (isSelf) return null;
                        const targetId = post.user_id ? Number(post.user_id) : null;
                        if (!targetId) return null;
                        const isFollowed = followingIds.map(Number).includes(targetId);
                        const isPending = pendingIds.map(Number).includes(targetId);

                        // Once follow request is sent (pending) or already followed, hide follow button completely from dashboard
                        if (isFollowed || isPending) return null;

                        return (
                          <button
                            type="button"
                            className="ud-mob-btn-follow"
                            onClick={() => handleToggleFollow(targetId, post.author_name || 'Leader')}
                          >
                            Follow
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        className="ud-mob-btn-menu"
                        aria-label="More options"
                        onClick={() => setActiveMenuPost(post)}
                        title="More options"
                      >
                        ⋮
                      </button>
                    </div>
                  </div>

                  <div className="ud-mob-post-body">
                    <p className="ud-mob-post-text">{renderFormattedContent(post.content)}</p>

                    {post.tags && (
                      <div className="ud-mob-post-tags">
                        {post.tags.split(' ').map((tg, i) => (
                          <span key={i}>{tg} </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Poll if attached */}
                    {post.poll_data && (
                      <div style={{ margin: '8px 12px' }}>
                        <PostPoll
                          pollData={post.poll_data}
                          postId={post.id}
                          onVote={(optionId) => handleVotePoll(post.id, optionId)}
                          currentUserId={profile.id}
                        />
                      </div>
                    )}

                    {/* Post Media (Video with Instagram Autoplay or Image) */}
                    {isPostVideo(post) ? (
                      <FeedVideo
                        src={post.video_url || post.image_url}
                        onDoubleTap={(e) => {
                          e.stopPropagation();
                          triggerDoubleTapLike(post.id);
                        }}
                        onSingleTap={(e) => handlePostMediaTouch(e, post)}
                        isHeartActive={Boolean(heartAnimPostIds[post.id])}
                        isMobile={true}
                      />
                    ) : post.image_url ? (
                      <div
                        className="ud-mob-post-banner-wrap"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          triggerDoubleTapLike(post.id);
                        }}
                        onTouchEnd={(e) => handlePostMediaTouch(e, post)}
                      >
                        <img src={post.image_url} alt="Post content" className="ud-mob-post-banner-img" />
                        {heartAnimPostIds[post.id] && (
                          <div className="ud-insta-heart-overlay">
                            <svg className="ud-insta-heart-icon" viewBox="0 0 24 24" fill="#FF2D55">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Reactions Bar with Instagram-style Likes */}
                  <div className="ud-mob-post-engagement">
                    {renderInstagramLikes(post, profile, (pid) => setLikesModalPostId(pid))}
                    <div
                      className="ud-mob-engagement-stats"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                      title="View comments"
                    >
                      <span className="ud-metric-pill" title={`${post.comments_count || 0} comments`}>
                        <FaRegComment size={13} className="ud-metric-icon" />
                        <span>{post.comments_count || 0}</span>
                      </span>
                      <span className="ud-metric-dot">•</span>
                      <span className="ud-metric-pill" title={`${post.shares_count || 0} shares`}>
                        <RiShareForwardLine size={14} className="ud-metric-icon" />
                        <span>{post.shares_count || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Like, Comment, Share */}
                  <div className="ud-mob-post-actions-row">
                    <button
                      type="button"
                      className={`ud-mob-post-action-btn ud-btn-like ${post.has_liked ? 'liked-active' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <span className="ud-interact-icon-wrap">
                        {post.has_liked ? (
                          <FaThumbsUp size={15} className="ud-like-icon" />
                        ) : (
                          <FaRegThumbsUp size={15} className="ud-like-icon" />
                        )}
                      </span>
                      <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button
                      type="button"
                      className={`ud-mob-post-action-btn ud-btn-comment ${openCommentsPostId === post.id ? 'active' : ''}`}
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    >
                      <span className="ud-interact-icon-wrap">
                        <FaRegComment size={15} className="ud-comment-icon" />
                      </span>
                      <span>Comment</span>
                    </button>
                    <button
                      type="button"
                      className="ud-mob-post-action-btn ud-btn-share"
                      onClick={() => setShareModalPost(post)}
                    >
                      <span className="ud-interact-icon-wrap">
                        <RiShareForwardLine size={16} className="ud-share-icon" />
                      </span>
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Mobile Expandable Comments Drawer */}
                  {openCommentsPostId === post.id && (
                    <PostComments
                      postId={post.id}
                      currentUser={profile}
                      initialCount={post.comments_count || 0}
                      onCommentAdded={(newCount) => {
                        setPosts((prev) =>
                          prev.map((p) => (p.id === post.id ? { ...p, comments_count: newCount } : p))
                        );
                      }}
                    />
                  )}
                  </article>
                  {/* 1st Slot: Trainers (after 5 posts) */}
                  {((pIdx + 1) % 10 === 5 || (posts.length <= 5 && pIdx === posts.length - 1)) && (
                    <InFeedSuggestedPeople
                      type="trainers"
                      isMobile={true}
                      trainers={trainersList.length ? trainersList : trainers}
                      leaders={leadersList}
                      followingIds={followingIds}
                      pendingIds={pendingIds}
                      onToggleFollow={handleToggleFollow}
                      navigate={navigate}
                    />
                  )}
                  {/* 2nd Slot: Leaders (after 10 posts, or at the end if between 6 and 9 posts) */}
                  {((pIdx + 1) % 10 === 0 || (filteredPosts.length > 5 && filteredPosts.length < 10 && pIdx === filteredPosts.length - 1) || (filteredPosts.length <= 5 && pIdx === filteredPosts.length - 1)) && (
                    <InFeedSuggestedPeople
                      type="leaders"
                      isMobile={true}
                      trainers={trainersList.length ? trainersList : trainers}
                      leaders={leadersList}
                      followingIds={followingIds}
                      pendingIds={pendingIds}
                      onToggleFollow={handleToggleFollow}
                      navigate={navigate}
                    />
                  )}
                </React.Fragment>
              ))
            ) : searchQuery.trim() ? (
              <div
                className="ud-mob-no-posts-card"
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px dashed #D1D5DB',
                  margin: '12px 16px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1F2937', fontSize: '15px', fontWeight: 600 }}>
                  No posts found matching &ldquo;{searchQuery}&rdquo;
                </h4>
                <p style={{ margin: '0 0 12px 0', color: '#6B7280', fontSize: '12px' }}>
                  Try searching for another user name or keyword.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#F3F4F6',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div
                className="ud-mob-no-posts-card"
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px dashed #D1D5DB',
                  margin: '12px 16px',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📝</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1F2937', fontSize: '15px', fontWeight: 600 }}>
                  No posts yet
                </h4>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>
                  Share your first thought, photo or update above!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Mobile Bottom Navigation Bar & Slide-up Menu Drawer */}
        <UserMobileBottomNav
          active="Home"
          onPlusClick={() => setIsCreatePostModalOpen(true)}
        />
      </div>

      {/* ───────────────── CREATE POST POPUP MODAL ───────────────── */}
      {isCreatePostModalOpen && (
        <div
          className="ud-modal-backdrop"
          onClick={() => {
            setIsCreatePostModalOpen(false);
          }}
        >
          <div className="ud-create-post-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="ud-cpm-header">
              <h3 className="ud-cpm-title">Create a Post</h3>
              <button
                type="button"
                className="ud-cpm-close-btn"
                onClick={() => setIsCreatePostModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Author Meta Row */}
            <div className="ud-cpm-author-row">
              <img src={profile.avatarUrl || userAvatarImg} alt={profile.name} className="ud-cpm-avatar" />
              <div className="ud-cpm-author-info">
                <span className="ud-cpm-author-name">{profile.name}</span>
                <div className="ud-cpm-badge-row">
                  <span className="ud-cpm-role-pill">{profile.role}</span>
                  <span className="ud-cpm-public-pill">🌐 Anyone</span>
                </div>
              </div>
            </div>

            {/* Input Body */}
            <div className="ud-cpm-body">
              <textarea
                className="ud-cpm-textarea"
                placeholder="What do you want to talk about? Share an update, business opportunity or insight..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                autoFocus
              />

              {/* Photo Preview if attached */}
              {postImagePreview && (
                <div className="ud-cpm-preview-box">
                  <img src={postImagePreview} alt="Preview" className="ud-cpm-preview-img" />
                  <button
                    type="button"
                    className="ud-cpm-remove-preview"
                    onClick={() => {
                      setPostImageFile(null);
                      setPostImagePreview(null);
                    }}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Video Preview if attached */}
              {postVideoPreview && (
                <div className="ud-cpm-preview-box" style={{ background: '#000' }}>
                  <video
                    src={postVideoPreview}
                    controls
                    playsInline
                    style={{ width: '100%', maxHeight: '200px', display: 'block', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    className="ud-cpm-remove-preview"
                    onClick={() => {
                      setPostVideoFile(null);
                      setPostVideoPreview(null);
                    }}
                    title="Remove video"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="ud-cpm-tools-row">
                <span className="ud-cpm-tools-label">Add to your post:</span>
                <div className="ud-cpm-tools-btns">
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    📷 Photo
                  </button>
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    🎥 Video
                  </button>
                  <button
                    type="button"
                    className="ud-cpm-tool-btn"
                    onClick={() => toast.success('Tag #Fortaa added!')}
                  >
                    🏷️ Tags
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="ud-cpm-footer">
              <button
                type="button"
                className="ud-cpm-cancel-btn"
                onClick={() => setIsCreatePostModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ud-cpm-submit-btn"
                onClick={handleCreatePost}
                disabled={submittingPost || !postText.trim()}
              >
                {submittingPost ? 'Publishing...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Post Modal */}
      <ShareModal
        isOpen={Boolean(shareModalPost)}
        post={shareModalPost}
        currentUser={profile}
        onClose={() => setShareModalPost(null)}
        onShareSuccess={(newSharesCount) => {
          if (shareModalPost) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === shareModalPost.id ? { ...p, shares_count: newSharesCount } : p
              )
            );
          }
        }}
      />

      {/* ── Post Action Menu (Three dots options: Report, Follow/Unfollow, Copy link, Share, etc.) ── */}
      <PostActionMenu
        isOpen={Boolean(activeMenuPost)}
        onClose={() => setActiveMenuPost(null)}
        post={activeMenuPost}
        currentUserId={profile.id}
        isFollowed={
          activeMenuPost?.user_id
            ? followingIds.map(Number).includes(Number(activeMenuPost.user_id))
            : false
        }
        isPending={
          activeMenuPost?.user_id
            ? pendingIds.map(Number).includes(Number(activeMenuPost.user_id))
            : false
        }
        onToggleFollow={(targetId, authorName) => handleToggleFollow(targetId, authorName)}
        onAboutAccount={(p) => setAboutAccountPost(p)}
        onGoToPost={(p) => setInstagramModalPost(p)}
        onShare={(p) => setShareModalPost(p)}
        onDeletePost={async (postId) => {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          toast.success('Post deleted successfully');
          try {
            await deletePostApi(postId, profile.id);
          } catch (e) {
            console.error('Delete post error:', e);
          }
        }}
      />

      {/* ── About This Account Modal ── */}
      <AboutAccountModal
        isOpen={Boolean(aboutAccountPost)}
        onClose={() => setAboutAccountPost(null)}
        post={aboutAccountPost}
        onViewProfile={handleAuthorClick}
      />

      {/* ── Instagram-Style Post Detail Modal ── */}
      <InstagramPostModal
        isOpen={Boolean(instagramModalPost)}
        onClose={() => setInstagramModalPost(null)}
        post={instagramModalPost}
        currentUser={profile}
        onLike={handleLike}
        onShare={(p) => setShareModalPost(p)}
        onAuthorClick={handleAuthorClick}
        onMenuClick={(p) => setActiveMenuPost(p)}
        followingIds={followingIds}
        onToggleFollow={handleToggleFollow}
      />

      {/* ── Instagram-Style Post Likers Modal ── */}
      <PostLikersModal
        isOpen={Boolean(likesModalPostId)}
        onClose={() => setLikesModalPostId(null)}
        postId={likesModalPostId}
        currentUserId={profile.id}
        followingIds={followingIds}
        onToggleFollow={handleToggleFollow}
        onUserClick={(userId) => navigate(`/leader/${userId}`)}
      />

      {/* ── Invite Team Modal ── */}
      <InviteTeamModal
        isOpen={isInviteTeamModalOpen}
        onClose={() => setIsInviteTeamModalOpen(false)}
        currentUser={profile}
      />

      {/* ── Join Group Modal ── */}
      <JoinGroupModal
        isOpen={isJoinGroupModalOpen}
        onClose={() => setIsJoinGroupModalOpen(false)}
        currentUser={profile}
        onGroupJoined={() => {
          // Refresh groups list in background
          fetchGroups().then((data) => {
            if (data?.length) setGroupsList(data);
          });
        }}
      />
    </div>
    </>
  );
}
