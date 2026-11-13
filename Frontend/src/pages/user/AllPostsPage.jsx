import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchPosts, likePostApi } from '../../services/dashboard.service';
import { toggleFollowUser, fetchFollowingIds } from '../../services/follow.service';
import { fetchDashboardOverview } from '../../services/dashboard.service';
import { FaRegComment } from 'react-icons/fa';
import { RiShareForwardLine } from 'react-icons/ri';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import PostComments from '../../components/posts/PostComments';
import ShareModal from '../../components/posts/ShareModal';
import PostActionMenu from '../../components/posts/PostActionMenu';
import AboutAccountModal from '../../components/posts/AboutAccountModal';
import InstagramPostModal from '../../components/posts/InstagramPostModal';
import PostLikersModal from '../../components/posts/PostLikersModal';
import AuthGateModal from '../../components/auth/AuthGateModal';
import { formatRelativeTime, renderFormattedContent } from './UserDashboard';
import './AllPostsPage.css';

export default function AllPostsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('post');

  const [storedUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fortaa_user') || '{}'); }
    catch { return {}; }
  });

  const isUserAuthenticated = Boolean(storedUser && (storedUser.id || storedUser.email));

  const [posts, setPosts] = useState([]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [activeMenuPost, setActiveMenuPost] = useState(null);
  const [aboutAccountPost, setAboutAccountPost] = useState(null);
  const [instagramModalPost, setInstagramModalPost] = useState(null);
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const uid = storedUser.id;
    const email = storedUser.email;
    async function load() {
      setLoading(true);
      try {
        const overview = await fetchDashboardOverview(email || '');
        let currentId = uid;
        if (overview?.user?.id) currentId = overview.user.id;
        setProfileId(currentId);

        const [fData, livePosts] = await Promise.all([
          fetchFollowingIds(currentId),
          fetchPosts(currentId),
        ]);
        const ids = Array.isArray(fData?.followingIds) 
          ? fData.followingIds 
          : (Array.isArray(fData) ? fData : []);
        setFollowingIds(ids);
        if (Array.isArray(livePosts)) {
          setPosts(livePosts);
          if (targetPostId && isUserAuthenticated) {
            const found = livePosts.find((p) => String(p.id) === String(targetPostId));
            if (found) {
              setInstagramModalPost(found);
            }
          }
        }
      } catch (err) {
        console.error('[AllPosts load error]:', err);
        toast.error('Could not load posts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async (postId) => {
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;
    const isAlreadyLiked = Boolean(currentPost.has_liked);
    const nextLiked = !isAlreadyLiked;
    const nextCount = Math.max(0, (Number(currentPost.likes_count) || 0) + (nextLiked ? 1 : -1));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: nextCount, has_liked: nextLiked } : p))
    );
    const res = await likePostApi(postId, profileId);
    if (res?.post) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: res.post.likes_count, has_liked: res.liked } : p))
      );
    }
  };

  const handleAuthorClick = (post) => {
    if (!post) return;
    const targetId = post.user_id || post.author_id || post.userId || post.id;
    const isSelf = targetId && Number(targetId) === Number(profileId || storedUser.id);
    if (isSelf) {
      navigate('/profile');
    } else if (targetId) {
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

  const handleToggleFollow = async (targetUserId, targetName) => {
    if (!targetUserId || Number(targetUserId) === Number(profileId)) return;
    const res = await toggleFollowUser(targetUserId, profileId);
    if (res?.success) {
      if (res.isFollowing) {
        setFollowingIds((prev) => [...(Array.isArray(prev) ? prev : []), Number(targetUserId)]);
        toast.success(`Following ${targetName}!`);
      } else {
        setFollowingIds((prev) => (Array.isArray(prev) ? prev.filter((id) => Number(id) !== Number(targetUserId)) : []));
        toast(`Unfollowed ${targetName}`);
      }
      const updated = await fetchPosts(profileId);
      if (Array.isArray(updated)) setPosts(updated);
    }
  };

  const targetPost =
    targetPostId && posts.length > 0 ? posts.find((p) => String(p.id) === String(targetPostId)) : null;

  return (
    <>
      {!isUserAuthenticated && (
        <AuthGateModal type="post" targetName={targetPost?.author_name || ''} />
      )}
      <div className={`ap-page ${!isUserAuthenticated ? 'auth-gated-blur' : ''}`}>
        {/* Header */}
        <div className="ap-topbar">
          <button className="ap-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="ap-title">All Posts</h1>
          <span className="ap-count">{posts.length} posts</span>
        </div>

      <div className="ap-container">
        {loading ? (
          <div className="ap-loading">
            <div className="ap-spinner" />
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="ap-empty">
            <p>No posts found. Follow some leaders to see their posts here!</p>
            <button className="ap-explore-btn" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="ap-feed">
            {posts.map((post, pIdx) => (
              <div key={post.id || pIdx} className="ap-post-card">
                <div className="ap-post-header">
                  <img
                    src={post.author_avatar || userAvatarImg}
                    alt=""
                    className="ap-post-avatar"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleAuthorClick(post)}
                    title="View Profile"
                  />
                  <div className="ap-post-author-meta">
                    <div className="ap-post-author-row">
                      <span
                        className="ap-post-author-name"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleAuthorClick(post)}
                        title="View Profile"
                      >
                        {post.author_name}
                      </span>
                    </div>
                    <div className="ap-post-author-headline">
                      {post.author_role || 'Senior Leader • Fortaa'}
                    </div>
                    <div className="ap-post-time-row">
                      <span className="ap-post-time">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                  </div>
                  {post.user_id && Number(post.user_id) !== Number(profileId) && (
                    <button
                      className={`ap-follow-btn ${Array.isArray(followingIds) && followingIds.map(Number).includes(Number(post.user_id)) ? 'following' : ''}`}
                      onClick={() => handleToggleFollow(post.user_id, post.author_name)}
                    >
                      {Array.isArray(followingIds) && followingIds.map(Number).includes(Number(post.user_id)) ? 'Following ✓' : 'Follow'}
                    </button>
                  )}
                  <button
                    className="ap-menu-btn"
                    type="button"
                    onClick={() => setActiveMenuPost(post)}
                    title="More options"
                  >
                    ⋮
                  </button>
                </div>

                <div className="ap-post-body">
                  <p className="ap-post-text">{renderFormattedContent(post.content)}</p>
                  {post.tags && <p className="ap-post-tags">{post.tags}</p>}
                  {post.image_url && (
                    <div className="ap-post-image-box">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="ap-post-img"
                      />
                    </div>
                  )}
                </div>

                <div className="ap-post-reactions-row">
                  <div
                    className="ap-insta-like-text"
                    style={{
                      fontSize: '13.5px',
                      color: '#334155',
                      cursor: post.likes_count > 0 ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (post.likes_count > 0) setLikesModalPostId(post.id);
                    }}
                    title={post.likes_count > 0 ? 'View who liked this post' : undefined}
                  >
                    {post.likes_count > 0 ? (
                      <>
                        ❤️ Liked by <strong>{post.has_liked ? 'you' : (post.latest_liker_name || 'Fortaa member')}</strong>
                        {post.likes_count > 1 ? ` and ${post.likes_count - 1} others` : ''}
                      </>
                    ) : (
                      '0 likes'
                    )}
                  </div>
                  <div
                    className="ud-post-comment-counts"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    title="View comments"
                  >
                    <span className="ud-metric-pill" title={`${post.comments_count || 0} comments`}>
                      <FaRegComment size={14} className="ud-metric-icon" />
                      <span>{post.comments_count || 0}</span>
                    </span>
                    <span className="ud-metric-dot">•</span>
                    <span className="ud-metric-pill" title={`${post.shares_count || 12} shares`}>
                      <RiShareForwardLine size={15} className="ud-metric-icon" />
                      <span>{post.shares_count || 12}</span>
                    </span>
                  </div>
                </div>

                <div className="ap-post-interact-bar">
                  <button
                    className={`ap-interact-btn ${post.has_liked ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.has_liked ? '👍 Liked' : '👍 Like'}
                  </button>
                  <button
                    className={`ap-interact-btn ${openCommentsPostId === post.id ? 'active' : ''}`}
                    onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                  >
                    💬 Comment
                  </button>
                  <button
                    className="ap-interact-btn"
                    onClick={() => setShareModalPost(post)}
                  >
                    ↗️ Share
                  </button>
                </div>

                {openCommentsPostId === post.id && (
                  <PostComments
                    postId={post.id}
                    currentUser={storedUser}
                    initialCount={post.comments_count || 0}
                    onCommentAdded={(newCount) => {
                      setPosts((prev) =>
                        prev.map((p) => (p.id === post.id ? { ...p, comments_count: newCount } : p))
                      );
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareModal
        isOpen={Boolean(shareModalPost)}
        post={shareModalPost}
        currentUser={storedUser}
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

      {/* ── Post Action Menu ── */}
      <PostActionMenu
        isOpen={Boolean(activeMenuPost)}
        onClose={() => setActiveMenuPost(null)}
        post={activeMenuPost}
        onAboutAccount={(p) => setAboutAccountPost(p)}
        onGoToPost={(p) => setInstagramModalPost(p)}
        onShare={(p) => setShareModalPost(p)}
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
        currentUser={storedUser}
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
        currentUserId={profileId || storedUser?.id}
        followingIds={followingIds}
        onToggleFollow={handleToggleFollow}
        onUserClick={(userId) => navigate(`/leader/${userId}`)}
      />
    </div>
    </>
  );
}
