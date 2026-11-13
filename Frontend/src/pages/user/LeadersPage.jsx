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
import { joinChat, subscribeToFollowEvents } from '../../services/socket.service';
import './LeadersPage.css';

// Default / Figma Demo Leaders Dataset (100% matching Figma screenshot and specs)
const INITIAL_LEADERS = [
  {
    id: 1,
    name: 'Vikram Yadav',
    level: 'Diamond',
    levelTitle: 'Diamond Leaders',
    badgeType: 'diamond',
    badgeColor: '#F60808',
    location: 'Hyderabad, India',
    followers: '3.9k',
    followersCount: 3900,
    following: '2.1k',
    posts: '8',
    quote: '“Small steps every day lead to big result.”',
    tags: [],
    role: 'Digital Marketing',
    bannerImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #4A0E4E 100%)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    networkSize: '1k-5k',
  },
  {
    id: 2,
    name: 'Kristin Watson',
    level: 'Silver',
    levelTitle: 'Silver Leaders',
    badgeType: 'silver',
    badgeColor: '#D51CFD',
    location: 'Delhi, India',
    followers: '9k',
    followersCount: 9000,
    following: '21k',
    posts: '8',
    quote: '“Build your team, Build your dreams.”',
    tags: [],
    role: 'Team Building',
    bannerImg: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #6B11FF 0%, #B845ED 50%, #200052 100%)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    networkSize: '5k-10k',
  },
  {
    id: 3,
    name: 'Floyd Miles',
    level: 'Platinum',
    levelTitle: 'Platinum Leaders',
    badgeType: 'platinum',
    badgeColor: '#5A2CE4',
    location: 'Punjab, India',
    followers: '3k',
    followersCount: 3000,
    following: '1k',
    posts: '8',
    quote: '“Together we grow stronger.”',
    tags: [],
    role: 'Direct Selling',
    bannerImg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #F39C12 0%, #E67E22 50%, #2C3E50 100%)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    networkSize: '1k-5k',
  },
  {
    id: 4,
    name: 'Savannah Nguyen',
    level: 'Diamond',
    levelTitle: 'Diamond Leaders',
    badgeType: 'diamond',
    badgeColor: '#F60808',
    location: 'Indore, Madhya Pradesh',
    followers: '12k',
    followersCount: 12000,
    following: '22k',
    posts: '8',
    quote: '“Small steps every day lead to big result.”',
    tags: [],
    role: 'Business Strategy',
    bannerImg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    networkSize: '10k+',
  },
  {
    id: 5,
    name: 'Jerome Bell',
    level: 'Platinum',
    levelTitle: 'Platinum Leaders',
    badgeType: 'platinum',
    badgeColor: '#5A2CE4',
    location: 'Nigeria',
    followers: '30k',
    followersCount: 30000,
    following: '2.1k',
    posts: '8',
    quote: '“Together we grow stronger.”',
    tags: [],
    role: 'Global Expansion',
    bannerImg: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    networkSize: '10k+',
  },
  {
    id: 6,
    name: 'Bessie Cooper',
    level: 'Silver',
    levelTitle: 'Silver Leaders',
    badgeType: 'silver',
    badgeColor: '#D51CFD',
    location: 'Oman',
    followers: '3.9k',
    followersCount: 3900,
    following: '2k',
    posts: '8',
    quote: '“Build your team, Build your dreams.”',
    tags: [],
    role: 'Sales Coach',
    bannerImg: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
    bannerGradient: 'linear-gradient(135deg, #1D2671 0%, #C33764 100%)',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    networkSize: '1k-5k',
  },
  {
    id: 7,
    name: 'Cameron Williamson',
    level: 'Gold',
    levelTitle: 'Gold Leaders',
    badgeType: 'gold',
    badgeColor: '#F59E0B',
    location: 'Mumbai, India',
    followers: '15k',
    followersCount: 15000,
    following: '3.2k',
    posts: '14',
    quote: '“Empowering others to achieve excellence.”',
    tags: ['Leadership', 'Sales', 'Growth'],
    role: 'Product Specialist',
    bannerGradient: 'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    networkSize: '10k+',
  },
  {
    id: 8,
    name: 'Eleanor Pena',
    level: 'Bronze',
    levelTitle: 'Bronze Leaders',
    badgeType: 'bronze',
    badgeColor: '#CD7F32',
    location: 'Bangalore, India',
    followers: '2.4k',
    followersCount: 2400,
    following: '850',
    posts: '6',
    quote: '“Consistency is the mother of mastery.”',
    tags: ['Network', 'Mentorship', 'Strategy'],
    role: 'Affiliate Coach',
    bannerGradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    networkSize: '1k-5k',
  },
  {
    id: 9,
    name: 'Albert Flores',
    level: 'Top',
    levelTitle: 'Top Leaders',
    badgeType: 'top',
    badgeColor: '#6220FE',
    location: 'Jaipur, Rajasthan',
    followers: '45k',
    followersCount: 45000,
    following: '5k',
    posts: '32',
    quote: '“Lead with vision, inspire with actions.”',
    tags: ['Vision', 'Marketing', 'Scale'],
    role: 'Executive Director',
    bannerGradient: 'linear-gradient(135deg, #2E0854 0%, #8A2387 100%)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    networkSize: '10k+',
  },
];

// Top Performing Leaders for the right widget
const INITIAL_TOP_PERFORMING = [
  { id: 101, rank: '01', name: 'Arlene', role: 'Diamond Leader', followers: '3.8k Followers', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 102, rank: '02', name: 'Kyle', role: 'Silver Leader', followers: '4k Followers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 103, rank: '03', name: 'Kristin', role: 'Gold Leader', followers: '1.2k Followers', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 104, rank: '04', name: 'Cameron', role: 'Platinum Leader', followers: '2k Followers', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80' },
  { id: 105, rank: '05', name: 'Angel', role: 'Gold Leader', followers: '1.2k Followers', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
  { id: 106, rank: '06', name: 'Ann', role: 'Platinum Leader', followers: '2k Followers', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80' },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Leaders', icon: null },
  { id: 'top', label: 'Top Leaders', icon: '👑' },
  { id: 'diamond', label: 'Diamond', icon: '💎' },
  { id: 'platinum', label: 'Platinum', icon: '⭐' },
  { id: 'gold', label: 'Gold', icon: '🏆' },
  { id: 'silver', label: 'Silver', icon: '🥈' },
  { id: 'bronze', label: 'Bronze', icon: '🥉' },
];

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

  // Auto-resolve user ID if missing from localStorage
  useEffect(() => {
    if (storedUser.id || storedUser._id) {
      setResolvedUserId(storedUser.id || storedUser._id);
      return;
    }
    if (storedUser.email) {
      fetch(`/api/dashboard/overview?email=${encodeURIComponent(storedUser.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data?.user?.id) {
            setResolvedUserId(data.user.id);
            try {
              const cur = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
              localStorage.setItem('fortaa_user', JSON.stringify({ ...cur, id: data.user.id, ...data.user }));
              window.dispatchEvent(new CustomEvent('fortaa_user_synced', { detail: data.user }));
            } catch {}
          }
        })
        .catch((e) => console.log('Resolve user id in leaders error:', e));
    }
  }, [storedUser.id, storedUser._id, storedUser.email]);

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
  const [levelFilters, setLevelFilters] = useState({
    top: false,
    diamond: false,
    platinum: false,
    gold: false,
    silver: false,
    bronze: false,
  });
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [networkSizeFilter, setNetworkSizeFilter] = useState('');

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

        // Map database leaders into the leader card shape with ACTUAL real data
        const mapped = dbLeaders.map((u, idx) => {
          const levelNames = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Top'];
          const chosenLevel = levelNames[idx % levelNames.length];
          const badgeColors = {
            Diamond: '#F60808',
            Platinum: '#5A2CE4',
            Gold: '#F59E0B',
            Silver: '#D51CFD',
            Bronze: '#CD7F32',
            Top: '#6220FE',
          };
          const gradients = [
            'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #4A0E4E 100%)',
            'linear-gradient(135deg, #6B11FF 0%, #B845ED 50%, #200052 100%)',
            'linear-gradient(135deg, #F39C12 0%, #E67E22 50%, #2C3E50 100%)',
            'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
          ];

          const followersCount = typeof u.followers_count === 'number' ? u.followers_count : 0;
          const followingCount = typeof u.following_count === 'number' ? u.following_count : 0;
          const postsCount = typeof u.posts_count === 'number' ? u.posts_count : 0;
          const formattedFollowers = followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : `${followersCount}`;
          const formattedFollowing = followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}k` : `${followingCount}`;

          const resolvedQuote = u.bio
            ? `“${u.bio}”`
            : u.company_brand
            ? `“Growing business with ${u.company_brand}.”`
            : '“Small steps every day lead to big result.”';

          const resolvedTags = u.skills
            ? (typeof u.skills === 'string' ? u.skills.split(',').map((s) => s.trim()).filter(Boolean) : (Array.isArray(u.skills) ? u.skills : []))
            : [];

          const resolvedLocation = u.location
            ? `${u.location}, India`
            : u.company_brand
            ? `${u.company_brand}, India`
            : 'India';

          return {
            id: u.id,
            name: u.name,
            level: chosenLevel,
            levelTitle: `${chosenLevel} Leaders`,
            badgeType: chosenLevel.toLowerCase(),
            badgeColor: badgeColors[chosenLevel] || '#5A2CE4',
            location: resolvedLocation,
            followers: formattedFollowers,
            followersCount: followersCount,
            following: formattedFollowing,
            posts: String(postsCount),
            quote: resolvedQuote,
            tags: resolvedTags.slice(0, 3),
            role: u.role || 'Business Leader',
            bannerGradient: gradients[idx % gradients.length],
            avatar: u.avatar_url || `https://images.unsplash.com/photo-${1534528741775 + idx}?w=150&auto=format&fit=crop&q=80`,
            networkSize: `${followersCount} network`,
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
      toast(`Unfollowed ${targetName}`);
      try {
        await unfollowUser(targetId, currentUserId);
      } catch (err) {
        console.error(err);
      }
    } else if (currentStatus === 'pending') {
      const confirm = window.confirm(`Cancel follow request to ${targetName}?`);
      if (!confirm) return;
      updateFollowMap({ [targetId]: 'none' });
      toast('Follow request cancelled', { icon: '✖' });
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
            toast.success(`You are now following ${targetName}! 🎉`);
          } else {
            toast.success(`Follow request sent to ${targetName}! ⏳`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Toggle Level Checkbox in filter sidebar
  const handleLevelCheckbox = (key) => {
    setLevelFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Clear all filters
  const handleClearAll = () => {
    setLevelFilters({
      top: false,
      diamond: false,
      platinum: false,
      gold: false,
      silver: false,
      bronze: false,
    });
    setLocationFilter('');
    setRoleFilter('');
    setNetworkSizeFilter('');
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
    return leaders.filter((leader) => {
      // Exclude dismissed cards (LinkedIn style dismissal)
      if (dismissedIds.includes(leader.id)) return false;

      // Category Tab filter
      if (activeTab !== 'all') {
        if (activeTab === 'top' && leader.level !== 'Top') return false;
        if (activeTab === 'diamond' && leader.level !== 'Diamond') return false;
        if (activeTab === 'platinum' && leader.level !== 'Platinum') return false;
        if (activeTab === 'gold' && leader.level !== 'Gold') return false;
        if (activeTab === 'silver' && leader.level !== 'Silver') return false;
        if (activeTab === 'bronze' && leader.level !== 'Bronze') return false;
      }

      // Checkbox filters (if any checked)
      const anyLevelChecked = Object.values(levelFilters).some(Boolean);
      if (anyLevelChecked) {
        const leaderLvlKey = leader.level.toLowerCase();
        if (!levelFilters[leaderLvlKey]) return false;
      }

      // Search bar
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = leader.name.toLowerCase().includes(q);
        const matchRole = leader.role.toLowerCase().includes(q);
        const matchLoc = leader.location.toLowerCase().includes(q);
        const matchTags = leader.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchLoc && !matchTags) return false;
      }

      // Location filter
      if (locationFilter.trim()) {
        if (!leader.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }

      // Role filter
      if (roleFilter.trim()) {
        if (!leader.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      }

      // Network size filter
      if (networkSizeFilter && networkSizeFilter !== 'all') {
        if (leader.networkSize !== networkSizeFilter) return false;
      }

      return true;
    });
  }, [leaders, activeTab, levelFilters, searchQuery, locationFilter, roleFilter, networkSizeFilter, dismissedIds]);

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
                      {/* Top Banner */}
                      <div
                        className="lead-card-banner"
                        style={{
                          backgroundImage: leader.bannerImg
                            ? `url(${leader.bannerImg})`
                            : leader.bannerGradient,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Level Badge Pill (Frame 302: 152px x 25px) */}
                        <div
                          className="lead-level-badge"
                          style={{ background: leader.badgeColor }}
                        >
                          <span className="lead-badge-icon">
                            {leader.level === 'Diamond' && '💎'}
                            {leader.level === 'Silver' && '🥈'}
                            {leader.level === 'Platinum' && '⭐'}
                            {leader.level === 'Gold' && '🏆'}
                            {leader.level === 'Bronze' && '🥉'}
                            {leader.level === 'Top' && '👑'}
                          </span>
                          <span className="lead-badge-text">{leader.level} Leader</span>
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

                        {/* Circular Avatar (Ellipse 43: 114px x 114px, top 71px, left 4px) */}
                        <div className="lead-card-avatar-wrap">
                          <img
                            src={leader.avatar}
                            alt={leader.name}
                            className="lead-card-avatar-img"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
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

                        {/* Level Title with mini icon */}
                        <div className="lead-card-level-row">
                          <span className="lead-level-icon-sm">
                            {leader.level === 'Diamond' && '💎'}
                            {leader.level === 'Silver' && '🥈'}
                            {leader.level === 'Platinum' && '⭐'}
                            {leader.level === 'Gold' && '🏆'}
                            {leader.level === 'Bronze' && '🥉'}
                            {leader.level === 'Top' && '👑'}
                          </span>
                          <span className="lead-card-level-text">{leader.levelTitle}</span>
                        </div>

                        {/* Location */}
                        <div className="lead-card-location-row">
                          <span className="lead-pin-icon">📍</span>
                          <span className="lead-card-location-text">{leader.location}</span>
                        </div>

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

                        {/* Quote */}
                        <p className="lead-card-quote">{leader.quote}</p>

                        {/* Real Skills Tags - only if user has skills */}
                        {leader.tags && leader.tags.length > 0 && (
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
                        )}

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
                            {status === 'accepted' ? 'Following ✓' : status === 'pending' ? 'Request Pending' : 'Follow'}
                          </button>
                          <button
                            type="button"
                            className="lead-btn-message"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages?user=${leader.id}&name=${encodeURIComponent(leader.name)}`);
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

              {/* Leader Level Checkboxes */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Leader Level</h4>
                <div className="lead-checkbox-group">
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.top}
                      onChange={() => handleLevelCheckbox('top')}
                    />
                    <span className="lead-check-icon">👑</span>
                    <span className="lead-check-text">Top Leaders</span>
                  </label>

                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.diamond}
                      onChange={() => handleLevelCheckbox('diamond')}
                    />
                    <span className="lead-check-icon">💎</span>
                    <span className="lead-check-text">Diamond Leader</span>
                  </label>

                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.platinum}
                      onChange={() => handleLevelCheckbox('platinum')}
                    />
                    <span className="lead-check-icon">⭐</span>
                    <span className="lead-check-text">Platinum Leader</span>
                  </label>

                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.gold}
                      onChange={() => handleLevelCheckbox('gold')}
                    />
                    <span className="lead-check-icon">🏆</span>
                    <span className="lead-check-text">Gold Leader</span>
                  </label>

                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.silver}
                      onChange={() => handleLevelCheckbox('silver')}
                    />
                    <span className="lead-check-icon">🥈</span>
                    <span className="lead-check-text">Silver Leader</span>
                  </label>

                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.bronze}
                      onChange={() => handleLevelCheckbox('bronze')}
                    />
                    <span className="lead-check-icon">🥉</span>
                    <span className="lead-check-text">Bronze Leader</span>
                  </label>
                </div>
              </div>

              {/* Location Input */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Location</h4>
                <div className="lead-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Role Input */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Role</h4>
                <div className="lead-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. Digital marketing"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Network Size Dropdown */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Network Size</h4>
                <div className="lead-input-wrap">
                  <select
                    value={networkSizeFilter}
                    onChange={(e) => setNetworkSizeFilter(e.target.value)}
                  >
                    <option value="">Select Network Size</option>
                    <option value="1k-5k">1k - 5k Members</option>
                    <option value="5k-10k">5k - 10k Members</option>
                    <option value="10k+">10k+ Members</option>
                  </select>
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
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
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
                        {status === 'accepted' ? 'Following' : status === 'pending' ? 'Request Pending' : 'Follow'}
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
              {/* Leader Level Checkboxes */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Leader Level</h4>
                <div className="lead-checkbox-group">
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.top}
                      onChange={() => handleLevelCheckbox('top')}
                    />
                    <span className="lead-check-icon">👑</span>
                    <span className="lead-check-text">Top Leaders</span>
                  </label>
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.diamond}
                      onChange={() => handleLevelCheckbox('diamond')}
                    />
                    <span className="lead-check-icon">💎</span>
                    <span className="lead-check-text">Diamond Leader</span>
                  </label>
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.platinum}
                      onChange={() => handleLevelCheckbox('platinum')}
                    />
                    <span className="lead-check-icon">⭐</span>
                    <span className="lead-check-text">Platinum Leader</span>
                  </label>
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.gold}
                      onChange={() => handleLevelCheckbox('gold')}
                    />
                    <span className="lead-check-icon">🏆</span>
                    <span className="lead-check-text">Gold Leader</span>
                  </label>
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.silver}
                      onChange={() => handleLevelCheckbox('silver')}
                    />
                    <span className="lead-check-icon">🥈</span>
                    <span className="lead-check-text">Silver Leader</span>
                  </label>
                  <label className="lead-checkbox-label">
                    <input
                      type="checkbox"
                      checked={levelFilters.bronze}
                      onChange={() => handleLevelCheckbox('bronze')}
                    />
                    <span className="lead-check-icon">🥉</span>
                    <span className="lead-check-text">Bronze Leader</span>
                  </label>
                </div>
              </div>

              {/* Location */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Location</h4>
                <input
                  type="text"
                  className="lead-mob-input"
                  placeholder="e.g. Delhi"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Role</h4>
                <input
                  type="text"
                  className="lead-mob-input"
                  placeholder="e.g. Digital marketing"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
              </div>

              {/* Network Size */}
              <div className="lead-filter-section">
                <h4 className="lead-filter-subtitle">Network Size</h4>
                <select
                  className="lead-mob-select"
                  value={networkSizeFilter}
                  onChange={(e) => setNetworkSizeFilter(e.target.value)}
                >
                  <option value="">Select Network Size</option>
                  <option value="1k-5k">1k - 5k Members</option>
                  <option value="5k-10k">5k - 10k Members</option>
                  <option value="10k+">10k+ Members</option>
                </select>
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
