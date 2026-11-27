import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fetchUserProfileApi,
  fetchUserSocialCountsApi,
  fetchPostsApi,
  toggleFollowApi,
  likePostApi,
  sharePostApi,
  fetchFollowersApi,
  fetchFollowingApi,
} from '../services/api';

const { width } = Dimensions.get('window');

const sanitizeWebsite = (url) => {
  if (!url) return '';
  if (url.includes('Enter your') || url.includes('Business Name') || url.length > 80) return '';
  return url.trim();
};

const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://fortaa.com${url}`;
  return url;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return 'recently';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 4) return `${diffWk}w`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function LeaderPostImage({ uri }) {
  const [aspectRatio, setAspectRatio] = useState(null);

  useEffect(() => {
    if (!uri) return;
    let isMounted = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (isMounted && w > 0 && h > 0) {
          const ratio = Math.max(0.65, Math.min(1.91, w / h));
          setAspectRatio(ratio);
        }
      },
      () => {
        if (isMounted) setAspectRatio(1);
      }
    );
    return () => {
      isMounted = false;
    };
  }, [uri]);

  return (
    <Image
      source={{ uri }}
      style={[
        styles.fullPostMediaImg,
        aspectRatio ? { aspectRatio } : { minHeight: 200 },
      ]}
      resizeMode="contain"
    />
  );
}

export default function LeaderProfileModal({
  visible,
  onClose,
  leaderId: leaderIdProp,
  leaderName: leaderNameProp,
  leader,
  currentUser,
  onOpenChat,
}) {
  const leaderId = leaderIdProp || leader?.id;
  const leaderName = leaderNameProp || leader?.name;

  const scrollViewRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [socialCounts, setSocialCounts] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [followStatus, setFollowStatus] = useState('none'); // 'none' | 'pending' | 'accepted'
  
  // 4 Tabs: About, Posts, Network, Achievements
  const [activeTab, setActiveTab] = useState('About');
  const TABS = ['About', 'Posts', 'Network', 'Achievements'];

  // Instagram-style Followers/Following Popup Modal
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkModalTab, setNetworkModalTab] = useState('followers'); // 'followers' | 'following'
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingNetworkList, setLoadingNetworkList] = useState(false);

  useEffect(() => {
    if (visible && leaderId) {
      setActiveTab('About');
      if (leader) {
        setProfile({
          id: leader.id,
          name: leader.name,
          username: leader.username || (leader.name || 'leader').toLowerCase().replace(/\s+/g, ''),
          designation: leader.designation || leader.accountTypeName || leader.role || 'Leader',
          company_brand: leader.companyBrand || leader.company_brand || leader.company || 'Fortaa',
          location: leader.city || leader.location || 'India',
          bio: leader.bio || '',
          website: sanitizeWebsite(leader.website || leader.website_social || ''),
          followers_count:
            leader.followers_count !== undefined ? leader.followers_count : (leader.followers ?? 0),
          following_count:
            leader.following_count !== undefined ? leader.following_count : (leader.following ?? 0),
          posts_count: leader.posts_count !== undefined ? leader.posts_count : (leader.posts ?? 0),
          avatar_url: leader.avatarUrl || leader.avatar_url || leader.avatar,
          cover_url: leader.cover_url || leader.cover,
          skills: leader.skills || leader.tags,
          experience: leader.experience,
          created_at: leader.created_at,
          profile_visibility: leader.profile_visibility || 'public',
        });
        const initStatus =
          leader.follow_status || (leader.is_following ? 'accepted' : 'none');
        setFollowStatus(initStatus);
      } else {
        setProfile(null);
        setFollowStatus('none');
      }
      loadFullProfileData();
    } else if (!visible) {
      setProfile(null);
      setUserPosts([]);
      setSocialCounts(null);
      setActiveTab('About');
      setShowNetworkModal(false);
    }
  }, [visible, leaderId]);

  const loadFullProfileData = async () => {
    if (!leaderId) return;
    setLoading(!leader);
    setLoadingPosts(true);
    try {
      const [profileData, countsData, postsData] = await Promise.all([
        fetchUserProfileApi(leaderId, currentUser?.id).catch(() => null),
        fetchUserSocialCountsApi(leaderId).catch(() => null),
        fetchPostsApi({ userId: leaderId, filter: 'mine', currentUserId: currentUser?.id }).catch(
          () => []
        ),
      ]);

      if (profileData) {
        setProfile((prev) => ({ ...(prev || {}), ...profileData }));
        if (profileData.follow_status) {
          setFollowStatus(profileData.follow_status);
        } else if (profileData.is_following !== undefined) {
          setFollowStatus(profileData.is_following ? 'accepted' : 'none');
        }
      }
      if (countsData) {
        setSocialCounts(countsData);
      }
      if (Array.isArray(postsData)) {
        const targetLeaderName = (profileData?.name || leader?.name || '').toLowerCase().trim();
        const filtered = postsData.filter(
          (p) =>
            String(p.user_id) === String(leaderId) ||
            String(p.author_id) === String(leaderId) ||
            (targetLeaderName && p.author_name && p.author_name.toLowerCase().trim() === targetLeaderName)
        );
        setUserPosts(filtered.length > 0 ? filtered : postsData);
      }
    } catch (err) {
      console.warn('Load full leader profile error:', err);
    } finally {
      setLoading(false);
      setLoadingPosts(false);
    }
  };

  const openNetworkPopup = async (initialTab = 'followers') => {
    setNetworkModalTab(initialTab);
    setShowNetworkModal(true);
    setLoadingNetworkList(true);
    try {
      const [fList, fgList] = await Promise.all([
        fetchFollowersApi(leaderId).catch(() => []),
        fetchFollowingApi(leaderId).catch(() => []),
      ]);
      setFollowersList(fList || []);
      setFollowingList(fgList || []);
    } catch (e) {
      console.warn('Load followers/following error:', e);
    } finally {
      setLoadingNetworkList(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in to follow leaders.');
      return;
    }
    const prevStatus = followStatus;
    const isCurrentlyFollowing = prevStatus === 'accepted';
    const nextStatus = isCurrentlyFollowing ? 'none' : 'accepted';

    setFollowStatus(nextStatus);
    setProfile((prev) => {
      if (!prev) return prev;
      const curCount = Number(prev.followers_count ?? 0);
      return {
        ...prev,
        followers_count: isCurrentlyFollowing ? Math.max(0, curCount - 1) : curCount + 1,
      };
    });

    try {
      const res = await toggleFollowApi(leaderId, currentUser.id);
      if (res?.status) {
        setFollowStatus(res.status);
      }
    } catch (err) {
      setFollowStatus(prevStatus);
    }
  };

  const handleToggleLikePost = async (post) => {
    if (!currentUser?.id) return;
    const wasLiked = !!post.has_liked;
    const prevLikes = Number(post.likes_count) || 0;
    const nextLiked = !wasLiked;
    const nextCount = wasLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;

    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, has_liked: nextLiked, likes_count: nextCount } : p
      )
    );

    try {
      await likePostApi(post.id, currentUser.id);
    } catch (e) {
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, has_liked: wasLiked, likes_count: prevLikes } : p
        )
      );
    }
  };

  const handleShareProfile = async () => {
    const shareUrl = `https://fortaa.com/leader/${leaderId}`;
    try {
      await Share.share({
        message: `Check out ${displayName} on Fortaa: ${shareUrl}`,
        url: shareUrl,
        title: `${displayName} on Fortaa`,
      });
    } catch (e) {}
  };

  const handleSharePost = async (post) => {
    try {
      if (currentUser?.id) {
        await sharePostApi(post.id, currentUser.id).catch(() => {});
      }
      const postUrl = `https://fortaa.com/post/${post.id}`;
      await Share.share({
        message: `${post.content ? post.content.substring(0, 100) + '... ' : ''}${postUrl}`,
        url: postUrl,
        title: `Post by ${displayName}`,
      });
    } catch (e) {}
  };

  const handleOpenWebsite = (url) => {
    if (!url) return;
    const target = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(target).catch(() => {
      Alert.alert('Website', target);
    });
  };

  const displayName = profile?.name || leaderName || 'Fortaa Leader';
  const displayUsername =
    profile?.username || displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const displayRole = profile?.designation || profile?.role || 'Leader';
  const displayCompany = profile?.company_brand || profile?.business_name || profile?.companyBrand || 'Fortaa';
  const displayLocation = profile?.location || 'Indore, India';
  const displayWebsite = sanitizeWebsite(profile?.website || profile?.website_social || '');
  const displayBio = (profile?.bio || '').trim();
  const displayAvatar =
    resolveAssetUrl(
      profile?.avatar_url && !profile.avatar_url.includes('user_avatar_rahul')
        ? profile.avatar_url
        : null
    ) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6220FE&color=fff&size=200&bold=true`;

  const displayCover = resolveAssetUrl(profile?.cover_url);

  const followersCount =
    socialCounts?.followersCount ??
    (profile?.followers_count !== undefined ? profile.followers_count : 0);
  const followingCount =
    socialCounts?.followingCount ??
    (profile?.following_count !== undefined ? profile.following_count : 0);
  const postsCount = userPosts.length || profile?.posts_count || 0;

  const isOwnProfile = currentUser?.id && String(currentUser.id) === String(leaderId);
  const isPrivate = profile?.profile_visibility === 'private';
  const canViewContent = isOwnProfile || !isPrivate || followStatus === 'accepted';

  const joinedDateText = profile?.created_at
    ? 'Joined ' +
      new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Joined Nov 2026';

  const experienceText = profile?.experience || '12 year';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenContainer}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <TouchableOpacity style={styles.loadingBackBtn} onPress={onClose}>
                <Feather name="chevron-left" size={22} color="#1E293B" />
              </TouchableOpacity>
              <ActivityIndicator size="large" color="#6220FE" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* 1. COVER PHOTO BANNER WITH FLOATING ICONS */}
              <View style={styles.coverBox}>
                {displayCover ? (
                  <Image source={{ uri: displayCover }} style={styles.coverImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={['#0e0725', '#200d45', '#3f156d', '#6322a3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coverImage}
                  />
                )}
                <View style={styles.coverOverlay} />

                {/* Floating Nav Row */}
                <View style={styles.coverNavRow}>
                  <TouchableOpacity style={styles.navCircleBtn} onPress={onClose} activeOpacity={0.85}>
                    <Feather name="chevron-left" size={20} color="#1E293B" />
                  </TouchableOpacity>

                  <View style={styles.navRightRow}>
                    <TouchableOpacity style={styles.navCircleBtn} onPress={handleShareProfile} activeOpacity={0.85}>
                      <Feather name="share-2" size={17} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navCircleBtn}
                      onPress={() => Alert.alert(displayName, `${displayRole}\n${displayCompany}`)}
                      activeOpacity={0.85}
                    >
                      <Feather name="more-vertical" size={17} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 2. MAIN PROFILE HEADER CARD (IMAGE 2 STRUCTURE + INSTAGRAM STATS) */}
              <View style={styles.mainCard}>
                {/* Top Row: Avatar on Left + Instagram-Style Stats on Right */}
                <View style={styles.avatarStatsRow}>
                  {/* Left: Overlapping Circle Avatar */}
                  <View style={styles.avatarBox}>
                    <Image source={{ uri: displayAvatar }} style={styles.avatarImg} />
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatarCrownBadge}>
                      <FontAwesome5 name="crown" size={9} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  {/* Right: Instagram Profile Stats (Posts, Followers, Following) */}
                  <View style={styles.instaStatsWrap}>
                    <TouchableOpacity
                      style={styles.instaStatItem}
                      onPress={() => {
                        setActiveTab('Posts');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.instaStatNum}>{postsCount}</Text>
                      <Text style={styles.instaStatLbl}>Posts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.instaStatItem}
                      onPress={() => openNetworkPopup('followers')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.instaStatNum}>{followersCount}</Text>
                      <Text style={styles.instaStatLbl}>Followers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.instaStatItem}
                      onPress={() => openNetworkPopup('following')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.instaStatNum}>{followingCount}</Text>
                      <Text style={styles.instaStatLbl}>Following</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Identity Information (Image 2 style) */}
                <View style={styles.infoBlock}>
                  <View style={styles.nameHeaderRow}>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Ionicons name="diamond" size={14} color="#7C3AED" />
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{displayRole}</Text>
                    </View>
                    {displayCompany ? (
                      <View style={styles.companyPill}>
                        <FontAwesome5 name="medal" size={10} color="#7C3AED" />
                        <Text style={styles.companyPillText} numberOfLines={1}>{displayCompany}</Text>
                      </View>
                    ) : null}
                  </View>

                  {displayUsername ? (
                    <Text style={styles.usernameText}>@{displayUsername}</Text>
                  ) : null}

                  <Text style={styles.headlineText}>
                    {displayRole} at {displayCompany}
                  </Text>

                  <View style={styles.metaLine}>
                    <Feather name="map-pin" size={12} color="#64748B" />
                    <Text style={styles.locationText}>{displayLocation}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          'Contact Info',
                          displayWebsite
                            ? `Website: ${displayWebsite}`
                            : `Connect with ${displayName} via Fortaa Messages`
                        )
                      }
                    >
                      <Text style={styles.contactInfoLink}>Contact info</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Followers / Connections clickable text */}
                  <View style={styles.socialProofRow}>
                    <TouchableOpacity onPress={() => openNetworkPopup('followers')}>
                      <Text style={styles.followersHighlight}>
                        <Text style={{ fontWeight: '800' }}>{followersCount}</Text> followers
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.metaDot}>•</Text>
                    <TouchableOpacity onPress={() => openNetworkPopup('following')}>
                      <Text style={styles.connectionsSub}>
                        {followingCount} connections
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.mottoTextFigma}>
                    "{displayBio || 'Small steps every day lead to big result'}"
                  </Text>
                </View>

                {/* Action Buttons Row (Image 2 Style) */}
                {!isOwnProfile && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.btnPrimary}
                      onPress={() => {
                        onClose();
                        if (onOpenChat) {
                          onOpenChat(
                            profile || {
                              id: leaderId,
                              name: displayName,
                              avatar_url: displayAvatar,
                              designation: displayRole,
                            }
                          );
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Feather name="message-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.btnPrimaryText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnSecondary,
                        followStatus === 'accepted' && styles.btnSecondaryFollowing,
                        followStatus === 'pending' && styles.btnSecondaryPending,
                      ]}
                      onPress={handleToggleFollow}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name={
                          followStatus === 'accepted'
                            ? 'user-check'
                            : followStatus === 'pending'
                            ? 'clock'
                            : 'user-plus'
                        }
                        size={14}
                        color={followStatus === 'pending' ? '#D97706' : '#7C3AED'}
                      />
                      <Text
                        style={[
                          styles.btnSecondaryText,
                          followStatus === 'pending' && { color: '#D97706' },
                        ]}
                      >
                        {followStatus === 'accepted'
                          ? 'Following ✓'
                          : followStatus === 'pending'
                          ? 'Pending'
                          : 'Follow'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnCircleIcon}
                      onPress={handleShareProfile}
                      activeOpacity={0.8}
                    >
                      <Feather name="share-2" size={15} color="#475569" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. FOUR SECTION TABS ROW (About, Posts, Network, Achievements) */}
                <View style={styles.tabsBarFour}>
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtnFour, isActive && styles.tabBtnFourActive]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.tabBtnTextFour, isActive && styles.tabBtnTextFourActive]}>
                          {tab}
                        </Text>
                        {isActive && <View style={styles.tabActiveIndicator} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. TAB CONTENT VIEWS */}
              {!canViewContent ? (
                <View style={[styles.sectionCard, styles.privateCard]}>
                  <View style={styles.privateLockCircle}>
                    <Feather name="lock" size={32} color="#0F172A" />
                  </View>
                  <Text style={styles.privateTitle}>This profile is private</Text>
                  <Text style={styles.privateDesc}>Follow to see their posts, network and achievements.</Text>
                </View>
              ) : (
                <View style={styles.tabContentContainer}>
                  {/* ─── TAB 1: ABOUT (About info only) ─── */}
                  {activeTab === 'About' && (
                    <View style={styles.tabContentFade}>
                      <View style={styles.sectionCard}>
                        <View style={styles.cardHeaderRowFigma}>
                          <View style={styles.headTitleRow}>
                            <Feather name="user" size={16} color="#1E293B" />
                            <Text style={styles.sectionHeadingFigma}>About</Text>
                          </View>
                        </View>

                        <Text style={styles.sectionParagraphFigma}>
                          {displayBio ||
                            'Network marketing leader and entrepreneur dedicated to team growth and collaboration.'}
                        </Text>

                        <View style={styles.aboutMetaBlock}>
                          <View style={styles.aboutMetaRowFigma}>
                            <Feather name="map-pin" size={13} color="#64748B" />
                            <Text style={styles.aboutMetaTextFigma}>{displayLocation}</Text>
                          </View>
                          <View style={styles.aboutMetaRowFigma}>
                            <Ionicons name="chatbubbles-outline" size={14} color="#64748B" />
                            <Text style={styles.aboutMetaTextFigma}>Hindi, English</Text>
                          </View>
                          {displayWebsite ? (
                            <TouchableOpacity
                              style={styles.aboutMetaRowFigma}
                              onPress={() => handleOpenWebsite(displayWebsite)}
                            >
                              <Feather name="globe" size={13} color="#7C3AED" />
                              <Text style={styles.aboutMetaLinkFigma}>{displayWebsite}</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>

                        {/* Motivational Quote Bubble */}
                        <View style={styles.quoteBubbleBox}>
                          <Text style={styles.quoteBubbleText}>
                            “Success is not a destination, it's a journey of continuous growth.”
                          </Text>
                          <Text style={styles.quoteAuthorText}>-{displayName.toLowerCase()}</Text>
                        </View>
                      </View>

                      {/* Professional Experience */}
                      <View style={styles.sectionCard}>
                        <View style={styles.headTitleRow}>
                          <FontAwesome5 name="medal" size={15} color="#7C3AED" />
                          <Text style={styles.sectionHeadingFigma}>Experience</Text>
                        </View>
                        <Text style={styles.expRoleText}>{displayRole} at {displayCompany}</Text>
                        <Text style={styles.expDurationText}>{joinedDateText} • {experienceText}</Text>
                        <Text style={styles.sectionParagraphFigma}>
                          {profile?.experience ||
                            'Actively growing business networks, mentoring leaders, and driving growth.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* ─── TAB 2: POSTS (All Real Posts) ─── */}
                  {activeTab === 'Posts' && (
                    <View style={styles.tabContentFade}>
                      <View style={styles.tabHeaderStrip}>
                        <Text style={styles.tabHeaderStripTitle}>
                          Posts by {displayName} ({userPosts.length})
                        </Text>
                      </View>

                      {loadingPosts ? (
                        <View style={styles.centeredLoadingBox}>
                          <ActivityIndicator size="large" color="#6220FE" />
                          <Text style={styles.loadingPostsText}>Fetching posts...</Text>
                        </View>
                      ) : userPosts && userPosts.length > 0 ? (
                        userPosts.map((post) => {
                          const postImg = resolveAssetUrl(post.image_url);
                          const hasLiked = !!post.has_liked;
                          return (
                            <View key={post.id} style={styles.fullPostCard}>
                              {/* Post Header */}
                              <View style={styles.fullPostHeader}>
                                <Image source={{ uri: displayAvatar }} style={styles.fullPostAuthorAvatar} />
                                <View style={styles.fullPostAuthorMeta}>
                                  <Text style={styles.fullPostAuthorName}>{displayName}</Text>
                                  <View style={styles.fullPostRoleTimeRow}>
                                    <Text style={styles.fullPostRoleText}>{displayRole}</Text>
                                    <Text style={styles.metaDot}>•</Text>
                                    <Text style={styles.fullPostTimeText}>{timeAgo(post.created_at)}</Text>
                                  </View>
                                </View>
                              </View>

                              {/* Content */}
                              {post.content ? (
                                <Text style={styles.fullPostContentText}>{post.content}</Text>
                              ) : null}

                              {/* Media */}
                              {postImg ? (
                                <LeaderPostImage uri={postImg} />
                              ) : null}

                              {/* Actions Row */}
                              <View style={styles.fullPostActionsRow}>
                                <TouchableOpacity
                                  style={styles.fullPostActionBtn}
                                  onPress={() => handleToggleLikePost(post)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name={hasLiked ? 'heart' : 'heart-outline'}
                                    size={18}
                                    color={hasLiked ? '#EF4444' : '#64748B'}
                                  />
                                  <Text
                                    style={[
                                      styles.fullPostActionLabel,
                                      hasLiked && { color: '#EF4444', fontWeight: '700' },
                                    ]}
                                  >
                                    {post.likes_count || 0} Likes
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.fullPostActionBtn}
                                  onPress={() => Alert.alert('Comments', `This post has ${post.comments_count || 0} comments.`)}
                                  activeOpacity={0.7}
                                >
                                  <Feather name="message-square" size={16} color="#64748B" />
                                  <Text style={styles.fullPostActionLabel}>
                                    {post.comments_count || 0} Comments
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.fullPostActionBtn}
                                  onPress={() => handleSharePost(post)}
                                  activeOpacity={0.7}
                                >
                                  <Feather name="share-2" size={16} color="#64748B" />
                                  <Text style={styles.fullPostActionLabel}>Share</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.emptySectionBox}>
                          <Ionicons name="document-text-outline" size={42} color="#CBD5E1" />
                          <Text style={styles.emptyTitle}>No Posts Yet</Text>
                          <Text style={styles.emptySubtitle}>{displayName} has not published any posts yet.</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ─── TAB 3: NETWORK (Followers & Following List) ─── */}
                  {activeTab === 'Network' && (
                    <View style={styles.tabContentFade}>
                      <View style={styles.sectionCard}>
                        <View style={styles.cardHeaderRowFigma}>
                          <Text style={styles.sectionHeadingFigma}>Network & Connections</Text>
                          <TouchableOpacity
                            onPress={() => openNetworkPopup('followers')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.viewAllLinkFigma}>Open List ↗</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.sectionParagraphFigma}>
                          {displayName} has <Text style={{ fontWeight: '700', color: '#6220FE' }}>{followersCount}</Text> followers and is following <Text style={{ fontWeight: '700', color: '#6220FE' }}>{followingCount}</Text> members in the network.
                        </Text>

                        <View style={styles.networkStatsRow}>
                          <TouchableOpacity
                            style={styles.networkStatCard}
                            onPress={() => openNetworkPopup('followers')}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.networkStatNum}>{followersCount}</Text>
                            <Text style={styles.networkStatLbl}>Followers</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.networkStatCard}
                            onPress={() => openNetworkPopup('following')}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.networkStatNum}>{followingCount}</Text>
                            <Text style={styles.networkStatLbl}>Following</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ─── TAB 4: ACHIEVEMENTS (Milestones & Recognition - Image 1 Style) ─── */}
                  {activeTab === 'Achievements' && (
                    <View style={styles.tabContentFade}>
                      <View style={styles.sectionCard}>
                        <Text style={styles.sectionHeadingFigma}>Milestones & Recognition</Text>
                        <View style={styles.achieveGrid2x2}>
                          <View style={styles.achieveCardItem}>
                            <Ionicons name="diamond" size={24} color="#7C3AED" />
                            <Text style={styles.achieveVal} numberOfLines={1}>{displayRole}</Text>
                            <Text style={styles.achieveLbl}>Current Tier</Text>
                          </View>
                          <View style={styles.achieveCardItem}>
                            <Ionicons name="medal" size={24} color="#F59E0B" />
                            <Text style={styles.achieveVal}>{experienceText}</Text>
                            <Text style={styles.achieveLbl}>Industry Experience</Text>
                          </View>
                          <View style={styles.achieveCardItem}>
                            <Ionicons name="trophy" size={24} color="#10B981" />
                            <Text style={styles.achieveVal}>Top 10</Text>
                            <Text style={styles.achieveLbl}>Leadership Award</Text>
                          </View>
                          <View style={styles.achieveCardItem}>
                            <Ionicons name="flash" size={24} color="#EF4444" />
                            <Text style={styles.achieveVal}>Verified</Text>
                            <Text style={styles.achieveLbl}>Leader Status</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* 5. INSTAGRAM-STYLE FOLLOWERS / FOLLOWING POPUP MODAL */}
          <Modal
            visible={showNetworkModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowNetworkModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                {/* Modal Header */}
                <View style={styles.modalHeadRow}>
                  <Text style={styles.modalTitle}>Network</Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowNetworkModal(false)}
                  >
                    <Ionicons name="close" size={22} color="#1E293B" />
                  </TouchableOpacity>
                </View>

                {/* Sub-tabs: Followers / Following */}
                <View style={styles.modalSubtabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalSubtabBtn,
                      networkModalTab === 'followers' && styles.modalSubtabBtnActive,
                    ]}
                    onPress={() => setNetworkModalTab('followers')}
                  >
                    <Text
                      style={[
                        styles.modalSubtabText,
                        networkModalTab === 'followers' && styles.modalSubtabTextActive,
                      ]}
                    >
                      Followers ({followersCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalSubtabBtn,
                      networkModalTab === 'following' && styles.modalSubtabBtnActive,
                    ]}
                    onPress={() => setNetworkModalTab('following')}
                  >
                    <Text
                      style={[
                        styles.modalSubtabText,
                        networkModalTab === 'following' && styles.modalSubtabTextActive,
                      ]}
                    >
                      Following ({followingCount})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Member List */}
                {loadingNetworkList ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#6220FE" />
                    <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.modalListScroll}>
                    {(() => {
                      const list = networkModalTab === 'followers' ? followersList : followingList;
                      if (!list || list.length === 0) {
                        return (
                          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="people-outline" size={38} color="#CBD5E1" />
                            <Text style={{ marginTop: 8, color: '#94A3B8', fontSize: 13 }}>
                              No {networkModalTab} yet.
                            </Text>
                          </View>
                        );
                      }
                      return list.map((item, idx) => {
                        const mAv = item.avatar_url || item.avatar;
                        const mInit = (item.name || 'M')[0].toUpperCase();
                        return (
                          <View key={item.id || idx} style={styles.memberRow}>
                            {mAv ? (
                              <Image source={{ uri: mAv }} style={styles.memberAvatar} />
                            ) : (
                              <View style={styles.memberInitCircle}>
                                <Text style={styles.memberInitText}>{mInit}</Text>
                              </View>
                            )}
                            <View style={styles.memberInfo}>
                              <Text style={styles.memberName}>{item.name}</Text>
                              <Text style={styles.memberRole}>{item.designation || item.role || 'Member'}</Text>
                            </View>
                            {currentUser?.id && String(currentUser.id) !== String(item.id) && (
                              <TouchableOpacity
                                style={styles.memberFollowBtn}
                                onPress={() => toggleFollowApi(item.id, currentUser.id)}
                              >
                                <Text style={styles.memberFollowBtnText}>Follow</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      });
                    })()}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 36,
  },

  // 1. Cover Photo
  coverBox: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#200d45',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  coverNavRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // 2. Main Profile Header Card
  mainCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: -24,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  // Top Row: Avatar on Left + Instagram-Style Stats on Right
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: -42,
    marginBottom: 6,
  },
  avatarBox: {
    position: 'relative',
  },
  avatarImg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EDE9FE',
  },
  avatarCrownBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Instagram Stats Wrap
  instaStatsWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginLeft: 14,
    paddingTop: 52,
    paddingBottom: 4,
  },
  instaStatItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  instaStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  instaStatLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  // Identity Information
  infoBlock: {
    marginTop: 6,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  badgePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#6D28D9',
    fontSize: 10.5,
    fontWeight: '700',
  },
  companyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  companyPillText: {
    color: '#7C3AED',
    fontSize: 10.5,
    fontWeight: '700',
  },
  usernameText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headlineText: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 4,
    fontWeight: '500',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: '#64748B',
    marginVertical: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaDot: {
    color: '#94A3B8',
    fontSize: 12,
  },
  contactInfoLink: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  followersHighlight: {
    color: '#6220FE',
    fontSize: 12.5,
    fontWeight: '600',
  },
  connectionsSub: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '500',
  },
  mottoTextFigma: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 8,
    lineHeight: 16,
  },

  // Action Buttons Row (Image 2 Style)
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#6220FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSecondary: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSecondaryFollowing: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  btnSecondaryPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  btnSecondaryText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
  },
  btnCircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Four Section Tabs Bar (About, Posts, Network, Achievements)
  tabsBarFour: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
  },
  tabBtnFour: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnFourActive: {},
  tabBtnTextFour: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextFourActive: {
    color: '#6220FE',
    fontWeight: '800',
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '14%',
    right: '14%',
    height: 3,
    backgroundColor: '#6220FE',
    borderRadius: 2,
  },

  // 4. Tab Content Containers
  tabContentContainer: {
    marginHorizontal: 12,
    marginTop: 10,
  },
  tabContentFade: {
    gap: 10,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderRowFigma: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeadingFigma: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllLinkFigma: {
    fontSize: 11.5,
    color: '#6220FE',
    fontWeight: '700',
  },
  sectionParagraphFigma: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  aboutMetaBlock: {
    marginTop: 10,
    gap: 6,
  },
  aboutMetaRowFigma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutMetaTextFigma: {
    fontSize: 12,
    color: '#475569',
  },
  aboutMetaLinkFigma: {
    fontSize: 12,
    color: '#6220FE',
    fontWeight: '600',
  },
  quoteBubbleBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
    padding: 10,
    marginTop: 12,
  },
  quoteBubbleText: {
    fontSize: 11.5,
    color: '#5B21B6',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  quoteAuthorText: {
    fontSize: 10.5,
    color: '#7C3AED',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  expRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  expDurationText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 8,
  },

  // Achievements 2x2 Grid (Milestones & Recognition)
  achieveGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  achieveCardItem: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  achieveVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  achieveLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  // Posts Tab
  tabHeaderStrip: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tabHeaderStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  centeredLoadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingPostsText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  fullPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  fullPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  fullPostAuthorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
  },
  fullPostAuthorMeta: {
    flex: 1,
  },
  fullPostAuthorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  fullPostRoleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  fullPostRoleText: {
    fontSize: 11,
    color: '#6220FE',
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fullPostTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fullPostContentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  fullPostMediaImg: {
    width: '100%',
    maxHeight: 460,
    borderRadius: 10,
    backgroundColor: '#0F092A',
    marginBottom: 8,
  },
  fullPostActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  fullPostActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  fullPostActionLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // Network Tab
  networkStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  networkStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  networkStatNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6220FE',
  },
  networkStatLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  emptySectionBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Private Lock
  privateCard: {
    marginHorizontal: 12,
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 10,
  },
  privateLockCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  privateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  privateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  // 5. Instagram-Style Followers/Following Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSubtabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubtabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6220FE',
  },
  modalSubtabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubtabTextActive: {
    color: '#6220FE',
    fontWeight: '800',
  },
  modalListScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
  },
  memberInitCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6220FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  memberFollowBtn: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberFollowBtnText: {
    color: '#6220FE',
    fontSize: 12,
    fontWeight: '700',
  },
});
