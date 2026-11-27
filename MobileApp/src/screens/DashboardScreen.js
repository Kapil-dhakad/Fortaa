import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Share,
  Modal,
  FlatList,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';
import StoriesBar from '../components/StoriesBar';
import CreatePostModal from '../components/CreatePostModal';
import PostActionModal from '../components/PostActionModal';
import FeedVideoPlayer from '../components/FeedVideoPlayer';
import LeaderProfileModal from '../components/LeaderProfileModal';
import {
  fetchPostsApi,
  likePostApi,
  votePollApi,
  getPostCommentsApi,
  addPostCommentApi,
  sharePostApi,
  getPostLikersApi,
  toggleFollowApi,
} from '../services/api';

const { width } = Dimensions.get('window');

// ─── INSTAGRAM-STYLE POST CARD COMPONENT ───
function DashboardPostCard({
  post,
  user,
  isFollowing,
  onToggleLike,
  onToggleFollow,
  onOpenLikers,
  onOpenComments,
  onSharePost,
  onActionMenu,
  onVote,
  timeAgo,
  onPressAuthor,
  isVideoActive = true,
}) {
  const hasLiked = !!post.has_liked;
  const likesCount = Number(post.likes_count) || 0;
  const commentsCount = Number(post.comments_count) || 0;
  const sharesCount = Number(post.shares_count) || 1;
  const authorInit = (post.author_name || 'U')[0].toUpperCase();

  // Determine Instagram-style like summary text
  const myName = user?.name || 'you';
  const otherName =
    post.latest_liker_name ||
    (hasLiked ? myName : post.author_name !== myName ? post.author_name : 'Rajkumar Meena');

  let likerDisplayText = '';
  let othersCount = 0;

  if (likesCount <= 0) {
    likerDisplayText = hasLiked ? 'you' : null;
  } else if (likesCount === 1) {
    likerDisplayText = hasLiked ? 'you' : otherName;
  } else if (likesCount === 2) {
    likerDisplayText = hasLiked ? 'you' : otherName;
    othersCount = 1;
  } else {
    likerDisplayText = hasLiked ? (otherName || 'you') : otherName;
    othersCount = likesCount - 1;
  }

  // Double tap heart popup animation
  const [showHeartPopup, setShowHeartPopup] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastImageTap = useRef(0);

  // Like button bounce animation
  const likeBtnScale = useRef(new Animated.Value(1)).current;

  const triggerDoubleTapLike = () => {
    // Optimistically like if not liked
    if (!hasLiked) {
      animateLikeButton();
      onToggleLike(post);
    }

    // Trigger big center Instagram heart popup
    setShowHeartPopup(true);
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.25,
        friction: 3.5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 350,
        delay: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHeartPopup(false);
    });
  };

  const handleImagePress = () => {
    const now = Date.now();
    if (now - lastImageTap.current < 300) {
      triggerDoubleTapLike();
      lastImageTap.current = 0;
    } else {
      lastImageTap.current = now;
    }
  };

  const animateLikeButton = () => {
    Animated.sequence([
      Animated.spring(likeBtnScale, {
        toValue: 1.35,
        friction: 3,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.spring(likeBtnScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLikePress = () => {
    animateLikeButton();
    onToggleLike(post);
  };

  // Parse poll data if present
  let poll = null;
  if (post.poll_data) {
    try {
      poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    } catch (e) {}
  }
  const voterKey = String(user?.id || 'guest');
  const userVoteOptionId = poll?.voters ? poll.voters[voterKey] : null;
  const totalPollVotes = poll?.totalVotes || (poll?.options?.reduce((s, o) => s + (Number(o.votes) || 0), 0)) || 0;

  return (
    <View style={styles.postCard}>
      {/* Post Header (Matching User's Web Mobile Screenshot) */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthorTouchable}
          onPress={() => onPressAuthor && onPressAuthor({ id: post.user_id, name: post.author_name })}
          activeOpacity={0.7}
        >
          <View style={styles.authorAvatarWrap}>
            {post.author_avatar ? (
              <Image source={{ uri: post.author_avatar }} style={styles.postAuthorAvatar} />
            ) : (
              <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.postAuthorAvatarCircle}>
                <Text style={styles.postAuthorAvatarText}>{authorInit}</Text>
              </LinearGradient>
            )}
            {/* Green Online Status Dot */}
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{post.author_name || 'Fortaa Leader'}</Text>
            <View style={styles.authorMetaRow}>
              <Text style={styles.postAuthorRole}>{post.author_role || 'Leader'}</Text>
              <Text style={styles.authorDot}>·</Text>
              <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.postMoreBtn}
            onPress={() => onActionMenu(post)}
            activeOpacity={0.7}
          >
            <Feather name="more-vertical" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Content Text */}
      {post.content ? (
        <Text style={styles.postText}>{post.content}</Text>
      ) : null}

      {/* Post Tags */}
      {post.tags ? (
        <Text style={styles.postTagsText}>{post.tags}</Text>
      ) : null}

      {/* Interactive Poll Card */}
      {poll && Array.isArray(poll.options) && (
        <View style={styles.pollCard}>
          <View style={styles.pollTitleRow}>
            <Feather name="bar-chart-2" size={16} color="#10B981" />
            <Text style={styles.pollTitleText}>
              {poll.question || post.content || 'Poll'}
            </Text>
          </View>

          {poll.options.map((opt) => {
            const optVotes = Number(opt.votes) || 0;
            const pct = totalPollVotes > 0 ? Math.round((optVotes / totalPollVotes) * 100) : 0;
            const isVoted = userVoteOptionId === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.pollOptionBox, isVoted && styles.pollOptionBoxVoted]}
                onPress={() => onVote(post, opt.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.pollProgressFill, { width: `${pct}%` }]} />
                <View style={styles.pollOptionContentRow}>
                  <View style={styles.pollOptionLeft}>
                    <View style={[styles.pollRadio, isVoted && styles.pollRadioSelected]}>
                      {isVoted && <View style={styles.pollRadioInner} />}
                    </View>
                    <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>
                      {opt.text}
                    </Text>
                  </View>
                  <Text style={styles.pollPercentText}>{pct}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.pollFooterVotes}>
            {totalPollVotes} {totalPollVotes === 1 ? 'vote' : 'votes'} · Poll active
          </Text>
        </View>
      )}

      {/* ─── POST MEDIA: VIDEO (AUTO PLAY) OR PHOTO (DOUBLE TAP TO LIKE) ─── */}
      {post.video_url || post.media_type === 'video' ? (
        <View style={styles.postMediaBox}>
          <FeedVideoPlayer
            videoUrl={post.video_url}
            isActive={isVideoActive}
            onDoubleTap={triggerDoubleTapLike}
          />

          {/* Instagram Center Heart Popup Overlay */}
          {showHeartPopup && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.instagramHeartOverlay,
                {
                  opacity: heartOpacity,
                  transform: [{ scale: heartScale }],
                },
              ]}
            >
              <Ionicons name="heart" size={100} color="#FF2D55" style={styles.instagramHeartGlow} />
            </Animated.View>
          )}
        </View>
      ) : post.image_url ? (
        <TouchableOpacity
          activeOpacity={0.98}
          onPress={handleImagePress}
          style={styles.postMediaBox}
        >
          <Image
            source={{ uri: post.image_url }}
            style={styles.postMediaImg}
            resizeMode="cover"
          />

          {/* Instagram Center Heart Popup Overlay */}
          {showHeartPopup && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.instagramHeartOverlay,
                {
                  opacity: heartOpacity,
                  transform: [{ scale: heartScale }],
                },
              ]}
            >
              <Ionicons name="heart" size={100} color="#FF2D55" style={styles.instagramHeartGlow} />
            </Animated.View>
          )}
        </TouchableOpacity>
      ) : null}

      {/* ─── ENGAGEMENT ROW (INSTAGRAM-STYLE LIKES & COMMENTS SUMMARY) ─── */}
      <View style={styles.engagementRow}>
        <TouchableOpacity
          style={styles.engagementLikesLeft}
          onPress={() => onOpenLikers && onOpenLikers(post.id)}
          activeOpacity={0.7}
        >
          <View style={styles.redHeartCircle}>
            <Ionicons name="heart" size={12} color="#EF4444" />
          </View>
          {post.latest_liker_avatar ? (
            <Image source={{ uri: post.latest_liker_avatar }} style={styles.likerThumbAvatar} />
          ) : null}
          <Text style={styles.engagementLikesText} numberOfLines={1}>
            {likerDisplayText ? (
              <>
                Liked by <Text style={styles.engagementBold}>{likerDisplayText}</Text>
                {othersCount > 0 ? (
                  <> and <Text style={styles.engagementBold}>{othersCount} {othersCount === 1 ? 'other' : 'others'}</Text></>
                ) : null}
              </>
            ) : (
              <Text style={styles.beFirstText}>Be the first to like this</Text>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.engagementStatsRight}
          onPress={() => onOpenComments(post)}
          activeOpacity={0.7}
        >
          <View style={styles.metricItem}>
            <Feather name="message-square" size={13} color="#64748B" />
            <Text style={styles.metricText}>{commentsCount}</Text>
          </View>
          <Text style={styles.metricDot}>·</Text>
          <View style={styles.metricItem}>
            <Feather name="share-2" size={13} color="#64748B" />
            <Text style={styles.metricText}>{sharesCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionDivider} />

      {/* ─── ACTION BUTTONS (LIKE, COMMENT, SHARE - MATCHING WEB APP) ─── */}
      <View style={styles.actionButtonsRow}>
        {/* Like Button (Heart - Red when liked) */}
        <TouchableOpacity
          style={[styles.actionButton, hasLiked && styles.actionButtonLiked]}
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: likeBtnScale }] }}>
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={hasLiked ? '#FF2D55' : '#475569'}
            />
          </Animated.View>
          <Text style={[styles.actionBtnLabel, hasLiked && styles.actionBtnLabelLikedRed]}>
            {hasLiked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onOpenComments(post)}
          activeOpacity={0.7}
        >
          <Feather name="message-square" size={17} color="#475569" />
          <Text style={styles.actionBtnLabel}>Comment</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSharePost(post)}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={17} color="#475569" />
          <Text style={styles.actionBtnLabel}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DashboardScreen({
  user,
  onNavigateTab,
  onNavigateToMessages,
  onNavigateToProfile,
  onNavigateToNotifications,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createPostVisible, setCreatePostVisible] = useState(false);

  // Comments Modal State
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Post Likers Modal State
  const [likersModalPostId, setLikersModalPostId] = useState(null);
  const [likersList, setLikersList] = useState([]);
  const [likersLoading, setLikersLoading] = useState(false);

  // Follow State
  const [followingIds, setFollowingIds] = useState(new Set());

  // Leader Profile Modal State (Opens on author avatar/name tap or search dropdown click)
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Active Video in Screen Viewport
  const [activeVideoId, setActiveVideoId] = useState(null);

  // Instagram Style Three-Dots Action Menu State
  const [actionMenuPost, setActionMenuPost] = useState(null);

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    Alert.alert('Post Deleted', 'Your post has been removed successfully.');
  };

  const handleToggleFollow = async (post) => {
    const targetUserId = post.user_id;
    if (!targetUserId || !user?.id) return;

    const nextSet = new Set(followingIds);
    const wasFollowing = nextSet.has(targetUserId);
    if (wasFollowing) {
      nextSet.delete(targetUserId);
    } else {
      nextSet.add(targetUserId);
    }
    setFollowingIds(nextSet);

    try {
      await toggleFollowApi(targetUserId, user.id);
    } catch (err) {
      console.warn('Follow error:', err);
    }
  };

  const handleOpenLikers = async (postId) => {
    setLikersModalPostId(postId);
    setLikersLoading(true);
    try {
      const likers = await getPostLikersApi(postId, user?.id);
      setLikersList(likers || []);
    } catch (err) {
      setLikersList([]);
    } finally {
      setLikersLoading(false);
    }
  };

  // Load real posts from backend
  const loadPosts = async () => {
    try {
      const data = await fetchPostsApi({ userId: user?.id, filter: 'all' });
      setPosts(data || []);
      // Auto-set the first video post as active if present
      const firstVidPost = (data || []).find((p) => p.video_url || p.media_type === 'video');
      if (firstVidPost) {
        setActiveVideoId(firstVidPost.id);
      }
    } catch (err) {
      console.warn('Failed to load posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  // Handle Like / Unlike (Instagram-style optimistic update)
  const handleToggleLike = async (post) => {
    const wasLiked = !!post.has_liked;
    const prevCount = Number(post.likes_count) || 0;
    const myName = user?.name || 'you';
    const myAvatar = user?.avatarUrl || user?.avatar_url;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          const nextLiked = !wasLiked;
          return {
            ...p,
            has_liked: nextLiked,
            likes_count: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
            latest_liker_name: nextLiked ? myName : p.latest_liker_name,
            latest_liker_avatar: nextLiked ? (myAvatar || p.latest_liker_avatar) : p.latest_liker_avatar,
          };
        }
        return p;
      })
    );

    // Call API
    try {
      await likePostApi(post.id, user?.id);
    } catch (err) {
      console.warn('Like API error:', err);
    }
  };

  // Handle Poll Vote
  const handleVote = async (post, optionId) => {
    try {
      // Call API
      const res = await votePollApi(post.id, optionId, user?.id);
      if (res.success && res.pollData) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === post.id) {
              return { ...p, poll_data: res.pollData };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.warn('Vote error:', err);
    }
  };

  // Handle Comments Modal Open
  const handleOpenComments = async (post) => {
    setActiveCommentsPost(post);
    setCommentsLoading(true);
    setNewCommentText('');
    try {
      const list = await getPostCommentsApi(post.id);
      setCommentsList(list);
    } catch (err) {
      console.warn('Fetch comments error:', err);
      setCommentsList([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit New Comment
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !activeCommentsPost) return;

    try {
      setIsSubmittingComment(true);
      const newComment = await addPostCommentApi(activeCommentsPost.id, {
        userId: user?.id || null,
        authorName: user?.name || 'Fortaa Leader',
        authorAvatar: user?.avatar_url || null,
        text: newCommentText.trim(),
      });

      setCommentsList((prev) => [newComment, ...prev]);
      setNewCommentText('');

      // Update comment count on post
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === activeCommentsPost.id) {
            return {
              ...p,
              comments_count: (Number(p.comments_count) || 0) + 1,
            };
          }
          return p;
        })
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Share Post
  const handleSharePost = async (post) => {
    try {
      await sharePostApi(post.id, user?.id);
      const postUrl = `https://fortaa.com/post/${post.id}`;
      await Share.share({
        title: `Post by ${post.author_name}`,
        message: `${post.author_name} on Fortaa:\n"${post.content}"\n\nCheck it out: ${postUrl}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // When a post is created
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Format Time Ago
  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.content || '').toLowerCase().includes(q) ||
      (p.author_name || '').toLowerCase().includes(q) ||
      (p.tags || '').toLowerCase().includes(q)
    );
  });

  const userInitial = (user?.name || 'Y')[0].toUpperCase();

  return (
    <View style={styles.container}>
      {/* 1. Purple Header Bar with Search */}
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectLeader={(person) => setSelectedLeader({ id: person.id, name: person.name })}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      <ScrollView
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          // Approximate height of stories + create post ~200px, post card ~460px
          const postIndex = Math.max(0, Math.floor((y - 100) / 460));
          if (filteredPosts[postIndex]) {
            setActiveVideoId(filteredPosts[postIndex].id);
          }
        }}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPosts();
            }}
            tintColor="#5321E8"
          />
        }
      >
        {/* 2. Real Instagram-like Story Bar */}
        <StoriesBar user={user} />

        {/* 3. Create Post Trigger Widget (Matching Web Mobile Screenshot) */}
        <View style={styles.createPostCard}>
          <TouchableOpacity
            style={styles.createPostInputRow}
            onPress={() => setCreatePostVisible(true)}
            activeOpacity={0.8}
          >
            {user?.avatarUrl || user?.avatar_url ? (
              <Image
                source={{ uri: user.avatarUrl || user.avatar_url }}
                style={styles.createPostAvatarImg}
              />
            ) : (
              <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.createPostAvatarCircle}>
                <Text style={styles.createPostAvatarText}>{userInitial}</Text>
              </LinearGradient>
            )}
            <View style={styles.fakeInput}>
              <Text style={styles.fakeInputPlaceholder}>
                Share your thoughts, success, opportunity or updates...
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.createPostActionsRow}>
            <View style={styles.mediaPillsRow}>
              <TouchableOpacity
                style={styles.mediaPill}
                onPress={() => setCreatePostVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="image" size={14} color="#334155" />
                <Text style={styles.mediaPillText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaPill}
                onPress={() => setCreatePostVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="video" size={14} color="#334155" />
                <Text style={styles.mediaPillText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaPill}
                onPress={() => setCreatePostVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="bar-chart-2" size={14} color="#334155" />
                <Text style={styles.mediaPillText}>Poll</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnPost}
              onPress={() => setCreatePostVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPostText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Real Feed Posts */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5321E8" />
            <Text style={styles.loadingText}>Loading network updates...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Feather name="rss" size={48} color="#C4B5FD" />
            <Text style={styles.emptyFeedTitle}>No posts yet</Text>
            <Text style={styles.emptyFeedSub}>
              Be the first to share an update with the Fortaa network!
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => setCreatePostVisible(true)}
            >
              <Text style={styles.emptyCreateBtnText}>+ Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <DashboardPostCard
              key={post.id}
              post={post}
              user={user}
              isFollowing={followingIds.has(post.user_id)}
              onToggleLike={handleToggleLike}
              onToggleFollow={handleToggleFollow}
              onOpenLikers={handleOpenLikers}
              onOpenComments={handleOpenComments}
              onSharePost={handleSharePost}
              onActionMenu={setActionMenuPost}
              onVote={handleVote}
              timeAgo={timeAgo}
              onPressAuthor={(author) => setSelectedLeader(author)}
              isVideoActive={activeVideoId === post.id}
            />
          ))
        )}
      </ScrollView>

      {/* ─── REAL INSTAGRAM / WEB STYLE POST LIKERS BOTTOM SHEET MODAL ─── */}
      <Modal
        visible={!!likersModalPostId}
        animationType="slide"
        transparent
        onRequestClose={() => setLikersModalPostId(null)}
      >
        <TouchableOpacity
          style={styles.commentsBackdrop}
          activeOpacity={1}
          onPress={() => setLikersModalPostId(null)}
        />
        <View style={styles.likersSheet}>
          <View style={styles.commentsDragHandle} />

          <View style={styles.likersHeader}>
            <View style={styles.likersHeaderLeft}>
              <View style={styles.redHeartCircle}>
                <Ionicons name="heart" size={14} color="#EF4444" />
              </View>
              <Text style={styles.likersTitle}>People who reacted</Text>
            </View>
            <TouchableOpacity onPress={() => setLikersModalPostId(null)} style={{ padding: 4 }}>
              <Feather name="x" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsDivider} />

          {likersLoading ? (
            <ActivityIndicator size="small" color="#5321E8" style={{ marginTop: 24 }} />
          ) : likersList.length === 0 ? (
            <View style={styles.noCommentsWrap}>
              <Ionicons name="heart-outline" size={36} color="#CBD5E1" />
              <Text style={styles.noCommentsText}>No reactions yet</Text>
              <Text style={styles.noCommentsSub}>Be the first to react to this post!</Text>
            </View>
          ) : (
            <FlatList
              data={likersList}
              keyExtractor={(item, index) => item.id || String(index)}
              style={styles.likersScroll}
              renderItem={({ item }) => {
                const isItemFollowing = followingIds.has(item.id);
                return (
                  <View style={styles.likerItem}>
                    <View style={styles.likerAvatarCircle}>
                      {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.likerAvatarImg} />
                      ) : (
                        <Text style={styles.likerAvatarText}>
                          {(item.name || 'U')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.likerBody}>
                      <Text style={styles.likerName}>{item.name || 'User'}</Text>
                      <Text style={styles.likerRole}>{item.role || item.designation || 'Leader'}</Text>
                    </View>
                    {user?.id && Number(user.id) !== Number(item.id) && (
                      <TouchableOpacity
                        style={[styles.btnFollowSmall, isItemFollowing && styles.btnFollowingSmall]}
                        onPress={() => handleToggleFollow({ user_id: item.id })}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.btnFollowSmallText, isItemFollowing && styles.btnFollowingSmallText]}>
                          {isItemFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* ─── REAL INSTAGRAM-LIKE COMMENTS BOTTOM SHEET MODAL ─── */}
      <Modal
        visible={!!activeCommentsPost}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveCommentsPost(null)}
      >
        <TouchableOpacity
          style={styles.commentsBackdrop}
          activeOpacity={1}
          onPress={() => setActiveCommentsPost(null)}
        />
        <View style={styles.commentsSheet}>
          <View style={styles.commentsDragHandle} />

          {/* Comments Header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActiveCommentsPost(null)}>
              <Feather name="x" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsDivider} />

          {/* Comments List */}
          {commentsLoading ? (
            <ActivityIndicator size="small" color="#5321E8" style={{ marginTop: 20 }} />
          ) : commentsList.length === 0 ? (
            <View style={styles.noCommentsWrap}>
              <Feather name="message-circle" size={36} color="#CBD5E1" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSub}>Start the conversation!</Text>
            </View>
          ) : (
            <FlatList
              data={commentsList}
              keyExtractor={(item, index) => item.id || String(index)}
              style={styles.commentsScroll}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(item.author_name || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentAuthor}>{item.author_name || 'User'}</Text>
                    <Text style={styles.commentText}>{item.text || item.comment}</Text>
                    <Text style={styles.commentTime}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* Add Comment Input Bar */}
          <View style={styles.addCommentBar}>
            <TextInput
              style={styles.addCommentInput}
              placeholder="Add a comment for the network..."
              placeholderTextColor="#9CA3AF"
              value={newCommentText}
              onChangeText={setNewCommentText}
            />
            <TouchableOpacity
              style={[
                styles.sendCommentBtn,
                !newCommentText.trim() && styles.sendCommentBtnDisabled,
              ]}
              onPress={handleAddComment}
              disabled={isSubmittingComment || !newCommentText.trim()}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Create Post Modal */}
      <CreatePostModal
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        user={user}
        onPostCreated={handlePostCreated}
      />

      {/* 3. Instagram-Style 3-Dots Post Action Menu Modal */}
      <PostActionModal
        visible={!!actionMenuPost}
        onClose={() => setActionMenuPost(null)}
        post={actionMenuPost}
        currentUser={user}
        onDeletePost={handleDeletePost}
        onGoToPost={(post) => {
          Alert.alert(post.author_name || 'Post', post.content || 'Viewing post');
        }}
      />

      {/* 4. Full Leader Profile Modal (Opens when tapping author name/avatar or search leader) */}
      <LeaderProfileModal
        visible={!!selectedLeader}
        onClose={() => setSelectedLeader(null)}
        leaderId={selectedLeader?.id}
        leaderName={selectedLeader?.name}
        currentUser={user}
        onOpenChat={(targetId) => {
          setSelectedLeader(null);
          if (onNavigateToMessages) onNavigateToMessages(targetId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  feedContent: { paddingBottom: 30 },

  // Create Post Card
  createPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createPostInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  createPostAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  fakeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fakeInputPlaceholder: { fontSize: 12.5, color: '#94A3B8' },
  createPostActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mediaPillsRow: { flexDirection: 'row', gap: 6 },
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  mediaPillText: { fontSize: 11.5, fontWeight: '600', color: '#334155' },
  btnPost: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  btnPostText: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF' },

  // Feed Posts
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  emptyFeed: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30, gap: 8 },
  emptyFeedTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B' },
  emptyFeedSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
  emptyCreateBtn: {
    marginTop: 10,
    backgroundColor: '#5321E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyCreateBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  createPostAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
  },

  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  authorAvatarWrap: { position: 'relative', width: 42, height: 42 },
  postAuthorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#334155' },
  postAuthorAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorAvatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  postAuthorInfo: { flex: 1, marginLeft: 10 },
  postAuthorName: { fontSize: 14.5, fontWeight: '700', color: '#0F172A' },
  authorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  postAuthorRole: { fontSize: 11.5, color: '#64748B' },
  authorDot: { fontSize: 12, color: '#94A3B8' },
  postTime: { fontSize: 11, color: '#94A3B8' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnFollow: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnFollowing: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#5321E8',
  },
  btnFollowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnFollowingText: {
    color: '#5321E8',
    fontWeight: '700',
  },
  postMoreBtn: { padding: 4 },

  postText: { fontSize: 14, color: '#1E293B', lineHeight: 21, marginBottom: 8 },
  postTagsText: { fontSize: 12, color: '#5321E8', fontWeight: '600', marginBottom: 8 },

  // Poll
  pollCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 8,
  },
  pollTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pollTitleText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  pollOptionBox: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  pollOptionBoxVoted: { borderColor: '#5321E8' },
  pollProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#EDE9FE',
  },
  pollOptionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  pollOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pollRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollRadioSelected: { borderColor: '#5321E8' },
  pollRadioInner: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#5321E8' },
  pollOptionText: { fontSize: 12.5, fontWeight: '500', color: '#334155' },
  pollOptionTextVoted: { fontWeight: '700', color: '#5321E8' },
  pollPercentText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  pollFooterVotes: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // Media
  postMediaBox: {
    width: '100%',
    minHeight: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F092A',
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMediaImg: { width: '100%', height: 260 },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  instagramHeartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    backgroundColor: 'transparent',
  },
  instagramHeartGlow: {
    // Pure icon without rectangular box-shadow on web
    backgroundColor: 'transparent',
  },

  // Engagement Row (Instagram / Web Exact Match)
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  engagementLikesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  redHeartCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likerThumbAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#334155',
  },
  engagementLikesText: {
    fontSize: 12,
    color: '#334155',
    flexShrink: 1,
  },
  engagementBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  beFirstText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  engagementStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metricDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },

  // Action Buttons Row (Like, Comment, Share)
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: '#F5F3FF',
  },
  actionButtonLiked: {
    backgroundColor: '#FFF1F2',
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnLabelLiked: {
    color: '#5321E8',
    fontWeight: '700',
  },
  actionBtnLabelLikedRed: {
    color: '#FF2D55',
    fontWeight: '700',
  },
  postAuthorTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Post Likers Sheet
  likersSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  likersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  likersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  likersScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  likerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  likerAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  likerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  likerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5321E8',
  },
  likerBody: {
    flex: 1,
  },
  likerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  likerRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  btnFollowSmall: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnFollowingSmall: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#5321E8',
  },
  btnFollowSmallText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnFollowingSmallText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5321E8',
  },

  // Comments Bottom Sheet
  commentsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  commentsDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  commentsDivider: { height: 1, backgroundColor: '#F1F5F9' },
  commentsScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  noCommentsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  noCommentsText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  noCommentsSub: { fontSize: 12, color: '#94A3B8' },

  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: '#5321E8' },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 12.5, fontWeight: '700', color: '#0F172A' },
  commentText: { fontSize: 13, color: '#334155', marginTop: 2, lineHeight: 18 },
  commentTime: { fontSize: 10.5, color: '#94A3B8', marginTop: 3 },

  addCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  addCommentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendCommentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCommentBtnDisabled: { opacity: 0.5 },
});
