import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';
import StoriesBar from '../components/StoriesBar';
import CreatePostModal from '../components/CreatePostModal';
import PostActionModal from '../components/PostActionModal';
import {
  fetchPostsApi,
  likePostApi,
  votePollApi,
  getPostCommentsApi,
  addPostCommentApi,
  sharePostApi,
} from '../services/api';

const { width } = Dimensions.get('window');

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

  // Instagram Style Three-Dots Action Menu State
  const [actionMenuPost, setActionMenuPost] = useState(null);

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    Alert.alert('Post Deleted', 'Your post has been removed successfully.');
  };

  // Load real posts from backend
  const loadPosts = async () => {
    try {
      const data = await fetchPostsApi({ userId: user?.id, filter: 'all' });
      setPosts(data || []);
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

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            has_liked: !wasLiked,
            likes_count: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
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
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      <ScrollView
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
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

        {/* 3. Create Post Trigger Widget */}
        <View style={styles.createPostCard}>
          <TouchableOpacity
            style={styles.createPostInputRow}
            onPress={() => setCreatePostVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.createPostAvatarCircle}>
              <Text style={styles.createPostAvatarText}>{userInitial}</Text>
            </LinearGradient>
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
          filteredPosts.map((post) => {
            const hasLiked = !!post.has_liked;
            const likesCount = Number(post.likes_count) || 0;
            const commentsCount = Number(post.comments_count) || 0;
            const authorInit = (post.author_name || 'U')[0].toUpperCase();

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
              <View key={post.id} style={styles.postCard}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  {post.author_avatar ? (
                    <Image source={{ uri: post.author_avatar }} style={styles.postAuthorAvatar} />
                  ) : (
                    <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.postAuthorAvatarCircle}>
                      <Text style={styles.postAuthorAvatarText}>{authorInit}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.postAuthorInfo}>
                    <Text style={styles.postAuthorName}>{post.author_name || 'Fortaa Leader'}</Text>
                    <Text style={styles.postAuthorRole}>{post.author_role || 'Senior Leader'}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.postMoreBtn}
                    onPress={() => setActionMenuPost(post)}
                  >
                    <Feather name="more-vertical" size={18} color="#64748B" />
                  </TouchableOpacity>
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
                          onPress={() => handleVote(post, opt.id)}
                          activeOpacity={0.7}
                        >
                          {/* Progress fill */}
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

                {/* Post Media (Image or Video) */}
                {post.image_url ? (
                  <View style={styles.postMediaBox}>
                    <Image
                      source={{ uri: post.image_url }}
                      style={styles.postMediaImg}
                      resizeMode="cover"
                    />
                  </View>
                ) : post.video_url ? (
                  <View style={styles.postMediaBox}>
                    <Image
                      source={{ uri: post.video_url }}
                      style={styles.postMediaImg}
                      resizeMode="cover"
                    />
                    <View style={styles.videoPlayOverlay}>
                      <Feather name="play" size={32} color="#fff" />
                    </View>
                  </View>
                ) : null}

                {/* Post Stats (Likes count & Comments count) */}
                <View style={styles.postStatsRow}>
                  <View style={styles.statsLeft}>
                    <View style={styles.likeIconCircle}>
                      <Feather name="heart" size={10} color="#DC2626" />
                    </View>
                    <Text style={styles.statsText}>
                      <Text style={styles.boldText}>{likesCount}</Text> likes
                    </Text>
                  </View>
                  <Text style={styles.statsText}>
                    <Text style={styles.boldText}>{commentsCount}</Text> comments
                  </Text>
                </View>

                <View style={styles.postDivider} />

                {/* Post Actions (Like, Comment, Share) */}
                <View style={styles.postActionsRow}>
                  <TouchableOpacity
                    style={styles.postActionBtn}
                    onPress={() => handleToggleLike(post)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="heart"
                      size={18}
                      color={hasLiked ? '#EF4444' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.postActionText,
                        hasLiked && styles.postActionTextLiked,
                      ]}
                    >
                      {hasLiked ? 'Liked' : 'Like'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.postActionBtn}
                    onPress={() => handleOpenComments(post)}
                    activeOpacity={0.7}
                  >
                    <Feather name="message-square" size={18} color="#64748B" />
                    <Text style={styles.postActionText}>Comment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.postActionBtn}
                    onPress={() => handleSharePost(post)}
                    activeOpacity={0.7}
                  >
                    <Feather name="share-2" size={18} color="#64748B" />
                    <Text style={styles.postActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

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

  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAuthorAvatar: { width: 42, height: 42, borderRadius: 21 },
  postAuthorAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorAvatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  postAuthorInfo: { flex: 1, marginLeft: 10 },
  postAuthorName: { fontSize: 14.5, fontWeight: '700', color: '#0F172A' },
  postAuthorRole: { fontSize: 11.5, color: '#64748B' },
  postTime: { fontSize: 10.5, color: '#94A3B8', marginTop: 1 },
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
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F092A',
    marginBottom: 10,
    position: 'relative',
  },
  postMediaImg: { width: '100%', height: '100%' },
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

  // Stats
  postStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statsLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsText: { fontSize: 11.5, color: '#64748B' },
  boldText: { fontWeight: '700', color: '#334155' },
  postDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  // Actions
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  postActionText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },
  postActionTextLiked: { color: '#EF4444', fontWeight: '700' },

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
