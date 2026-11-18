import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import UserMobileBottomNav from '../../components/layout/UserMobileBottomNav';
import AuthGateModal from '../../components/auth/AuthGateModal';
import {
  sendFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  fetchFollowingIds,
} from '../../services/follow.service';
import { fetchLeaders } from '../../services/dashboard.service';
import { fetchCurrentUser } from '../../services/user.service';
import { joinChat, subscribeToFollowEvents } from '../../services/socket.service';
import './LeadersPage.css';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Leaders', icon: null },
  { id: 'top', label: 'Top Leaders', icon: '👑' },
  { id: 'diamond', label: 'Diamond', icon: '💎' },
  { id: 'platinum', label: 'Platinum', icon: '⭐' },
  { id: 'gold', label: 'Gold', icon: '🏆' },
  { id: 'silver', label: 'Silver', icon: '🥈' },
  { id: 'bronze', label: 'Bronze', icon: '🥉' },
];

const SCENIC_BANNERS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
];

const getLeaderTierInfo = (u) => {
  const roleText = `${u.role || ''} ${u.designation || ''}`.toLowerCase();
  if (roleText.includes('diamond')) {
    return {
      key: 'diamond',
      label: 'Diamond Leader',
      title: 'Diamond Leaders',
      icon: '💎',
      badgeGradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
    };
  }
  if (roleText.includes('platinum')) {
    return {
      key: 'platinum',
      label: 'Platinum Leader',
      title: 'Platinum Leaders',
      icon: '⭐',
      badgeGradient: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
    };
  }
  if (roleText.includes('gold')) {
    return {
      key: 'gold',
      label: 'Gold Leader',
      title: 'Gold Leaders',
      icon: '🏆',
      badgeGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    };
  }
  if (roleText.includes('silver')) {
    return {
      key: 'silver',
      label: 'Silver Leader',
      title: 'Silver Leaders',
      icon: '🥈',
      badgeGradient: 'linear-gradient(135deg, #D946EF 0%, #9333EA 100%)',
    };
  }
  if (roleText.includes('bronze')) {
    return {
      key: 'bronze',
      label: 'Bronze Leader',
      title: 'Bronze Leaders',
      icon: '🥉',
      badgeGradient: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
    };
  }
  if (roleText.includes('admin') || roleText.includes('super admin')) {
    return {
      key: 'admin',
      label: u.designation || 'Admin',
      title: u.designation || 'Admin',
      icon: '🛡️',
      badgeGradient: 'linear-gradient(135deg, #1E1B4B 0%, #3B82F6 100%)',
    };
  }

  // Real designation / role if present
  const rawRole = (u.designation || u.role || '').trim();
  if (rawRole && rawRole.toLowerCase() !== 'user') {
    return {
      key: 'leader',
      label: rawRole,
      title: rawRole,
      icon: '⭐',
      badgeGradient: 'linear-gradient(135deg, #6220FE 0%, #8B5CF6 100%)',
    };
  }

  return {
    key: 'member',
    label: 'Member',
    title: 'Member',
    icon: '👤',
    badgeGradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
  };
};

export default function LeadersPage() {
  const navigate = useNavigate();

  // Read stored user
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }
  const [resolvedUserId, setResolvedUserId] = useState(() => storedUser.id || storedUser._id || null);
  const currentUserId = resolvedUserId || storedUser.id || 1;

  // Auto-resolve user ID if missing from localStorage using authenticated user
  useEffect(() => {
    if (storedUser.id || storedUser._id) {
      setResolvedUserId(storedUser.id || storedUser._id);
      return;
    }
    fetchCurrentUser()
      .then((me) => {
        if (me?.id) {
          setResolvedUserId(me.id);
          try {
            const cur = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
            localStorage.setItem('fortaa_user', JSON.stringify({ ...cur, ...me, id: me.id }));
            window.dispatchEvent(new CustomEvent('fortaa_user_synced', { detail: me }));
          } catch {}
        }
      })
      .catch((e) => console.log('Resolve user id in leaders error:', e));
  }, [storedUser.id, storedUser._id]);

  useEffect(() => {
    const handleUserSynced = (e) => {
      if (e?.detail?.id) {
        setResolvedUserId(e.detail.id);
      }
    };
    window.addEventListener('fortaa_user_synced', handleUserSynced);
    return () => window.removeEventListener('fortaa_user_synced', handleUserSynced);
  }, []);

  // State
  const [leaders, setLeaders] = useState([]);
  const [topPerforming, setTopPerforming] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOption, setSortOption] = useState('Most Viewed');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Track dismissed leader cards (LinkedIn style dismiss 'X')
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('fortaa_dismissed_leaders') || '[]');
    } catch {
      return [];
    }
  });

  const handleDismissLeader = (e, leaderId) => {
    e.stopPropagation();
    setDismissedIds((prev) => {
      const next = [...prev, leaderId];
      try {
        sessionStorage.setItem('fortaa_dismissed_leaders', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filter Sidebar State
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Follow State Tracking: { [userId]: 'none' | 'pending' | 'accepted' }
  // Initialized from cache so state never flickers or reverts to "Follow" on refresh!
  const [followMap, setFollowMap] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('fortaa_follow_status_map') || '{}');
    } catch {
      return {};
    }
  });

  const updateFollowMap = (newEntries) => {
    setFollowMap((prev) => {
      const next = { ...prev };
      Object.entries(newEntries).forEach(([k, v]) => {
        next[k] = v;
        next[Number(k)] = v;
        next[String(k)] = v;
      });
      try {
        sessionStorage.setItem('fortaa_follow_status_map', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Load real database users/leaders and merge
  useEffect(() => {
    let isMounted = true;

    // Load following status from API
    fetchFollowingIds(currentUserId)
      .then((data) => {
        if (!isMounted) return;
        const map = {};
        if (data?.followingIds) {
          data.followingIds.forEach((id) => {
            map[Number(id)] = 'accepted';
            map[String(id)] = 'accepted';
          });
        }
        if (data?.pendingIds) {
          data.pendingIds.forEach((id) => {
            map[Number(id)] = 'pending';
            map[String(id)] = 'pending';
          });
        }
        updateFollowMap(map);
      })
      .catch((err) => console.log('Follow ids error:', err));

    // Load database leaders
    fetchLeaders(currentUserId)
      .then((dbLeaders) => {
        if (!isMounted || !dbLeaders || dbLeaders.length === 0) return;

        // Populate followMap directly from leader's follow_status from database
        const initialStatusMap = {};
        dbLeaders.forEach((u) => {
          if (u.follow_status && u.follow_status !== 'none') {
            initialStatusMap[Number(u.id)] = u.follow_status;
            initialStatusMap[String(u.id)] = u.follow_status;
          }
        });
        if (Object.keys(initialStatusMap).length > 0) {
          updateFollowMap(initialStatusMap);
        }

        // Map database leaders into the leader card shape with ACTUAL real data (excluding self)
        const myId = currentUserId || resolvedUserId || storedUser.id || storedUser._id;
        const validDbLeaders = dbLeaders.filter((u) => {
          const isSelf =
            (myId && (String(u.id) === String(myId) || String(u._id) === String(myId))) ||
            (storedUser?.email && u.email && storedUser.email.toLowerCase() === u.email.toLowerCase());
          return !isSelf;
        });

        const mapped = validDbLeaders.map((u, idx) => {
          const followersCount = typeof u.followers_count === 'number' ? u.followers_count : 0;
          const followingCount = typeof u.following_count === 'number' ? u.following_count : 0;
          const postsCount = typeof u.posts_count === 'number' ? u.posts_count : 0;
          const formattedFollowers = followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : `${followersCount}`;
          const formattedFollowing = followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}k` : `${followingCount}`;

          const realBio = (u.bio || '').trim();
          const realCompany = (u.company_brand || '').trim();
          const realRole = (u.role || u.designation || '').trim();
          const realLocation = (u.location || '').trim();

          const resolvedTags = u.skills
            ? (typeof u.skills === 'string' ? u.skills.split(',').map((s) => s.trim()).filter(Boolean) : (Array.isArray(u.skills) ? u.skills : []))
            : [];

          const tier = getLeaderTierInfo(u);
          const coverBanner = u.cover_url || SCENIC_BANNERS[idx % SCENIC_BANNERS.length];
          const displayBio = realBio;
          const displayLocation = realLocation;
          const displayTags = resolvedTags;

          // Unique initial avatar fallback instead of duplicate stock photo
          const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6220FE&color=fff&size=150&bold=true`;
          const avatarUrl = (u.avatar_url && !u.avatar_url.includes('user_avatar_rahul')) ? u.avatar_url : defaultAvatar;

          return {
            id: u.id,
            name: u.name,
            rank: idx + 1,
            role: realRole,
            company: realCompany,
            location: displayLocation,
            followers: formattedFollowers,
            followersCount: followersCount,
            following: formattedFollowing,
            posts: String(postsCount),
            bio: displayBio,
            tags: displayTags,
            avatar: avatarUrl,
            cover: coverBanner,
            tier: tier,
            tierKey: tier.key,
            follow_status: u.follow_status || 'none',
          };
        });

        setLeaders(mapped);
        const sortedTop = [...mapped].sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
        setTopPerforming(sortedTop.slice(0, 6));
      })
      .catch((err) => console.log('fetchLeaders error:', err));

    // Connect socket
    joinChat(currentUserId);
    const unsub = subscribeToFollowEvents({
      onFollowAccepted: ({ targetUserId }) => {
        updateFollowMap({ [targetUserId]: 'accepted' });
      },
      onFollowUpdated: (data) => {
        if (data?.targetUserId && data?.status) {
          updateFollowMap({ [data.targetUserId]: data.status });
        }
      },
    });

    return () => {
      isMounted = false;
      unsub?.();
    };
  }, [currentUserId]);

  // Handle Follow Toggle
  const handleFollowClick = async (targetId, targetName) => {
    const currentStatus =
      followMap[targetId] ||
      followMap[Number(targetId)] ||
      followMap[String(targetId)] ||
      'none';

    if (currentStatus === 'accepted') {
      const confirm = window.confirm(`Are you sure you want to unfollow ${targetName}?`);
      if (!confirm) return;
      updateFollowMap({ [targetId]: 'none' });
      // toast(`Unfollowed ${targetName}`);
      try {
        await unfollowUser(targetId, currentUserId);
      } catch (err) {
        console.error(err);
      }
    } else if (currentStatus === 'pending') {
      const confirm = window.confirm(`Cancel follow request to ${targetName}?`);
      if (!confirm) return;
      updateFollowMap({ [targetId]: 'none' });
      // toast('Follow request cancelled', { icon: '✖' });
      try {
        await cancelFollowRequest(targetId, currentUserId);
      } catch (err) {
        console.error(err);
      }
    } else {
      // Send Request / Follow
      updateFollowMap({ [targetId]: 'pending' });
      try {
        const res = await sendFollowRequest(targetId, currentUserId);
        if (res?.status) {
          updateFollowMap({ [targetId]: res.status });
          if (res.status === 'accepted') {
            // toast.success(`You are now following ${targetName}! 🎉`);
          } else {
            // toast.success(`Follow request sent to ${targetName}! ⏳`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setLocationFilter('');
    setRoleFilter('');
    setSearchQuery('');
    setActiveTab('all');
    setDismissedIds([]);
    try {
      sessionStorage.removeItem('fortaa_dismissed_leaders');
    } catch {}
    toast.success('Filters reset');
  };

  // Filtered leaders calculation
  const filteredLeaders = useMemo(() => {
    const myId = currentUserId || resolvedUserId || storedUser.id || storedUser._id;
    return leaders.filter((leader) => {
      // Exclude self from leaders directory
      if (myId && (String(leader.id) === String(myId) || String(leader._id) === String(myId))) return false;
      if (storedUser?.email && leader.email && storedUser.email.toLowerCase() === leader.email.toLowerCase()) return false;

      // Exclude dismissed cards (LinkedIn style dismissal)
      if (dismissedIds.includes(leader.id)) return false;

      // Category Tab filter
      if (activeTab === 'top') {
        if ((leader.followersCount || 0) < 1 && (Number(leader.posts) || 0) < 1) return false;
      } else if (activeTab === 'diamond') {
        if (leader.tierKey !== 'diamond') return false;
      } else if (activeTab === 'platinum') {
        if (leader.tierKey !== 'platinum') return false;
      } else if (activeTab === 'gold') {
        if (leader.tierKey !== 'gold') return false;
      } else if (activeTab === 'silver') {
        if (leader.tierKey !== 'silver') return false;
      } else if (activeTab === 'bronze') {
        if (leader.tierKey !== 'bronze') return false;
      }

      // Search bar
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (leader.name || '').toLowerCase().includes(q);
        const matchRole = (leader.role || '').toLowerCase().includes(q);
        const matchCompany = (leader.company || '').toLowerCase().includes(q);
        const matchLoc = (leader.location || '').toLowerCase().includes(q);
        const matchTags = (leader.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchCompany && !matchLoc && !matchTags) return false;
      }

      // Location filter
      if (locationFilter.trim()) {
        if (!leader.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }

      // Role filter
      if (roleFilter.trim()) {
        if (!leader.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [leaders, activeTab, searchQuery, locationFilter, roleFilter, dismissedIds, currentUserId, resolvedUserId, storedUser.id, storedUser._id, storedUser.email]);

  // Paginated leaders
  const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage) || 1;
  const paginatedLeaders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeaders.slice(start, start + itemsPerPage);
  }, [filteredLeaders, currentPage, itemsPerPage]);

  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));

  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="profile" />
      )}
      <div className={`lead-page-root ${!isUserAuthenticated ? 'auth-gated-blur' : ''}`}>
        {/* Unified Global Header */}
        <UserHeader
          user={storedUser}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
        />

      <div className="lead-main-wrapper">
        {/* Unified Pinned Left Sidebar (Stationary / Fixed) */}
        <UserSidebar
          activeTab="Leaders"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Scrollable Right Content Container */}
        <div className="lead-content-scroll-container" id="lead-content-scroll-container">
          {/* Content Body Container */}
          <div className="lead-body-wrapper">
          {/* Main Left Column (Desktop 895px / Responsive) */}
          <main className="lead-main-column">
            {/* Hero Banner (Frame 307: Matches Figma Image 2) */}
            <div className="lead-hero-banner">
              <div className="lead-hero-left">
                <div className="lead-hero-title-row">
                  <span className="lead-hero-crown">👑</span>
                  <h1 className="lead-hero-heading">Leaders</h1>
                </div>
                <p className="lead-hero-subtext">
                  Connect with successful leaders and grow your business with their guidance.
                </p>
              </div>
              <div className="lead-hero-right">
                <button
                  type="button"
                  className="lead-be-leader-btn"
                  onClick={() => navigate('/complete-profile')}
                >
                  <span>Be a Leader</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>→</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs Bar (Frame 340-348) */}
            <div className="lead-category-bar">
              <div className="lead-tabs-scrollable">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`lead-category-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCurrentPage(1);
                    }}
                  >
                    {tab.icon && <span className="lead-tab-icon">{tab.icon}</span>}
                    <span className="lead-tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Most Viewed Dropdown on Desktop */}
              <div className="lead-sort-dropdown-wrap">
                <select
                  className="lead-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="Most Viewed">Most Viewed ⌵</option>
                  <option value="Highest Followers">Highest Followers</option>
                  <option value="Newest">Newest Leaders</option>
                </select>
              </div>
            </div>

            {/* Mobile Search & Filter Bar */}
            <div className="lead-mob-search-row">
              <div className="lead-mob-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8892AC" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search people, posts, companies, products, opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="lead-mob-filter-toggle-btn"
                onClick={() => setMobileFilterOpen(true)}
                title="Filters"
                aria-label="Open Filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6220FE" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </button>
            </div>

            {/* 3-Column Leaders Cards Grid (2-Column on Mobile: 195px x 268px) */}
            <div className="lead-cards-grid">
              {paginatedLeaders.length === 0 ? (
                <div className="lead-empty-state">
                  <p className="lead-empty-title">No leaders found</p>
                  <p className="lead-empty-desc">Try clearing your search or filter options.</p>
                  <button type="button" className="lead-reset-btn" onClick={handleClearAll}>
                    Reset Filters
                  </button>
                </div>
              ) : (
                paginatedLeaders.map((leader) => {
                  const status =
                    followMap[leader.id] ||
                    followMap[Number(leader.id)] ||
                    followMap[String(leader.id)] ||
                    leader.follow_status ||
                    'none';

                  return (
                    <div
                      key={leader.id}
                      className="lead-card"
                      onClick={() => navigate(`/leader/${leader.id}`, { state: { leader } })}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Top Banner (Scenic Landscape Wallpaper matching Figma) */}
                      <div
                        className="lead-card-banner"
                        style={{
                          backgroundImage: `url(${leader.cover})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Tier Badge (💎 Diamond, ⭐ Platinum, 🏆 Gold, 🥈 Silver, 🥉 Bronze) */}
                        <div
                          className="lead-level-badge"
                          style={{
                            background: leader.tier?.badgeGradient || 'linear-gradient(135deg, #FF416C, #FF4B2B)',
                          }}
                        >
                          <span className="lead-badge-icon">{leader.tier?.icon || '💎'}</span>
                          <span className="lead-badge-text">{leader.tier?.label || leader.role || 'Diamond Leader'}</span>
                        </div>

                        {/* Dismiss X Icon Button (LinkedIn style) */}
                        <button
                          type="button"
                          className="lead-card-dismiss-btn"
                          onClick={(e) => handleDismissLeader(e, leader.id)}
                          title="Dismiss suggestion"
                          aria-label="Dismiss"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>

                        {/* Circular Avatar */}
                        <div className="lead-card-avatar-wrap">
                          <img
                            src={leader.avatar}
                            alt={leader.name}
                            className="lead-card-avatar-img"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name || 'User')}&background=6220FE&color=fff&size=150&bold=true`;
                            }}
                          />
                        </div>
                      </div>

                      {/* Card Content Details */}
                      <div className="lead-card-body">
                        {/* Name */}
                        <h3 className="lead-card-name" title={leader.name}>
                          {leader.name}
                        </h3>

                        {/* Level & Company with Icon */}
                        <div className="lead-card-level-row">
                          <span className="lead-level-icon-sm">{leader.tier?.icon || '⭐'}</span>
                          <span className="lead-card-level-text">
                            {leader.tier?.title || leader.tier?.label || 'Leader'}
                            {leader.company ? ` • ${leader.company}` : ''}
                          </span>
                        </div>

                        {/* Location */}
                        {leader.location ? (
                          <div className="lead-card-location-row">
                            <span className="lead-pin-icon">📍</span>
                            <span className="lead-card-location-text">{leader.location}</span>
                          </div>
                        ) : null}

                        {/* Stats Row */}
                        <div className="lead-card-stats-row">
                          <div className="lead-card-stat-col">
                            <span className="lead-card-stat-val">{leader.followers}</span>
                            <span className="lead-card-stat-lbl">Followers</span>
                          </div>
                          <div className="lead-card-stat-col">
                            <span className="lead-card-stat-val">{leader.following}</span>
                            <span className="lead-card-stat-lbl">Following</span>
                          </div>
                          <div className="lead-card-stat-col">
                            <span className="lead-card-stat-val">{leader.posts}</span>
                            <span className="lead-card-stat-lbl">Post</span>
                          </div>
                        </div>

                        {/* Quote / Bio (Only real bio, no static dummy quotes) */}
                        {leader.bio ? (
                          <p className="lead-card-quote">“{leader.bio}”</p>
                        ) : null}

                        {/* Skills / Tags Row (Only real skills, no static dummy tags) */}
                        {leader.tags && leader.tags.length > 0 ? (
                          <div className="lead-card-tags-row">
                            {leader.tags.slice(0, 3).map((tag, tIdx) => (
                              <span key={tIdx} className="lead-tag-pill">
                                <span className="lead-tag-icon">
                                  {tIdx === 0 ? '🎯' : tIdx === 1 ? '📈' : '⚡'}
                                </span>{' '}
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* Action Buttons: Follow & Message */}
                        <div className="lead-card-actions-row">
                          <button
                            type="button"
                            className={`lead-btn-follow ${status}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowClick(leader.id, leader.name);
                            }}
                            title={status === 'pending' ? 'Click to cancel request' : ''}
                          >
                            {status === 'accepted' ? 'Following ✓' : status === 'pending' ? 'Pending' : 'Follow'}
                          </button>
                          <button
                            type="button"
                            className="lead-btn-message"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages?userId=${leader.id}&name=${encodeURIComponent(leader.name || '')}&role=${encodeURIComponent(leader.role || '')}&avatar=${encodeURIComponent(leader.avatar || '')}`, {
                                state: {
                                  contact: {
                                    user_id: leader.id,
                                    name: leader.name,
                                    role: leader.role,
                                    avatar_url: leader.avatar,
                                  },
                                },
                              });
                            }}
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Row matching Figma */}
            {totalPages > 1 && (
              <div className="lead-pagination-row">
                <button
                  type="button"
                  className="lead-page-btn lead-page-nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`lead-page-btn ${currentPage === num ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="lead-page-btn lead-page-nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
                <button
                  type="button"
                  className="lead-page-btn lead-page-nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  »
                </button>
              </div>
            )}

            {/* Footer Row matching Figma */}
            <footer className="lead-footer-row">
              <div className="lead-footer-links">
                <a href="#about">About Us</a>
                <span className="lead-footer-sep">|</span>
                <a href="#contact">Contact Us</a>
                <span className="lead-footer-sep">|</span>
                <a href="#privacy">Privacy Policy</a>
                <span className="lead-footer-sep">|</span>
                <a href="#terms">Terms & Conditions</a>
                <span className="lead-footer-sep">|</span>
                <a href="#help">Help Center</a>
              </div>
              <p className="lead-footer-copy">© 2026 Fortaa. All rights reserved.</p>
            </footer>
          </main>

          {/* Right Column (Desktop Sidebar Widgets: 325px - 329px) */}
          <aside className="lead-sidebar-right">
            {/* 1. Filter Leaders Card (Frame 291: 324px x 471px) */}
            <div className="lead-filter-card">
              <div className="lead-filter-header">
                <div className="lead-filter-title-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#232356" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <h3 className="lead-filter-title">Filter Leaders</h3>
                </div>
                <button type="button" className="lead-clear-all-btn" onClick={handleClearAll}>
                  Clear All
                </button>
              </div>

              {/* Location Input */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Location</h4>
                <div className="lead-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. Delhi, Indore"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Role / Designation Input */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Role / Designation</h4>
                <div className="lead-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. Senior Leader, Marketing"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Apply Filters Button */}
              <button
                type="button"
                className="lead-apply-filters-btn"
                onClick={() => toast.success('Filters applied')}
              >
                <span>🔍</span> Apply Filters
              </button>
            </div>

            {/* 2. Top Performing Leaders Widget (Frame 136: 325px x 411px) */}
            <div className="lead-top-widget">
              <div className="lead-top-widget-header">
                <div className="lead-top-title-row">
                  <span className="lead-top-icon">👥</span>
                  <h3 className="lead-top-title">Top Performing Leaders</h3>
                </div>
                <button
                  type="button"
                  className="lead-top-view-all"
                  onClick={() => {
                    setActiveTab('top');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View All →
                </button>
              </div>

              {/* List of 6 ranked leaders */}
              <div className="lead-top-list">
                {topPerforming.map((topLdr) => {
                  const status =
                    followMap[topLdr.id] ||
                    followMap[Number(topLdr.id)] ||
                    followMap[String(topLdr.id)] ||
                    topLdr.follow_status ||
                    'none';

                  return (
                    <div
                      key={topLdr.id}
                      className="lead-top-item"
                      onClick={() => navigate(`/leader/${topLdr.id}`, { state: { leader: topLdr } })}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Rank Box (40px x 35px, #44297E) */}
                      <div className="lead-top-rank-box">{topLdr.rank}</div>

                      {/* Avatar */}
                      <img
                        src={topLdr.avatar}
                        alt={topLdr.name}
                        className="lead-top-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topLdr.name || 'User')}&background=6220FE&color=fff&size=150&bold=true`;
                        }}
                      />

                      {/* Meta */}
                      <div className="lead-top-meta">
                        <h4 className="lead-top-name">{topLdr.name}</h4>
                        <span className="lead-top-role">{topLdr.role}</span>
                        <span className="lead-top-followers">{topLdr.followers}</span>
                      </div>

                      {/* Follow Button */}
                      <button
                        type="button"
                        className={`lead-top-follow-btn ${status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowClick(topLdr.id, topLdr.name);
                        }}
                      >
                        {status === 'accepted' ? 'Following' : status === 'pending' ? 'Pending' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Expand Your Network Promo Card (Frame 140: 329px x 179px) */}
            <div className="lead-expand-promo-card">
              <div className="lead-expand-content">
                <h3 className="lead-expand-title">Expand your Network</h3>
                <p className="lead-expand-desc">
                  Connect with leaders, grow your team and unlock new opportunities.
                </p>
                <button
                  type="button"
                  className="lead-expand-join-btn"
                  onClick={() => {
                    toast.success('Welcome to Fortaa Leader Network! 🚀');
                    navigate('/signup');
                  }}
                >
                  Join Now <span className="lead-join-arrow">→</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      </div>

      {/* Mobile Filters Drawer / Modal */}
      {mobileFilterOpen && (
        <div className="lead-mob-filter-backdrop" onClick={() => setMobileFilterOpen(false)}>
          <div className="lead-mob-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="lead-mob-drawer-header">
              <h3>Filter Leaders</h3>
              <button
                type="button"
                className="lead-mob-drawer-close"
                onClick={() => setMobileFilterOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="lead-mob-drawer-body">
              {/* Location */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Location</h4>
                <input
                  type="text"
                  className="lead-mob-input"
                  placeholder="e.g. Delhi, Indore"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Role / Designation</h4>
                <input
                  type="text"
                  className="lead-mob-input"
                  placeholder="e.g. Senior Leader, Marketing"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
              </div>

              {/* Drawer Action Buttons */}
              <div className="lead-mob-drawer-actions">
                <button
                  type="button"
                  className="lead-mob-btn-clear"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  className="lead-mob-btn-apply"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar matching UserDashboard */}
      <UserMobileBottomNav active="Network" />
    </div>
    </>
  );
}
