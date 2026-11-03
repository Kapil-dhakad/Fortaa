import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchPosts, likePostApi } from '../../services/dashboard.service';
import { toggleFollowUser, fetchFollowingIds } from '../../services/follow.service';
import { fetchDashboardOverview } from '../../services/dashboard.service';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import './AllPostsPage.css';

export default function AllPostsPage() {
  const navigate = useNavigate();
  const [storedUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fortaa_user') || '{}'); }
    catch { return {}; }
  });

  const [posts, setPosts] = useState([]);
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

        const [fIds, livePosts] = await Promise.all([
          fetchFollowingIds(currentId),
          fetchPosts(currentId),
        ]);
        setFollowingIds(fIds || []);
        if (livePosts?.length) setPosts(livePosts);
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

  const handleToggleFollow = async (targetUserId, targetName) => {
    if (!targetUserId || targetUserId === profileId) return;
    const res = await toggleFollowUser(targetUserId, profileId);
    if (res?.success) {
      if (res.isFollowing) {
        setFollowingIds((prev) => [...prev, Number(targetUserId)]);
        toast.success(`Following ${targetName}!`);
      } else {
        setFollowingIds((prev) => prev.filter((id) => Number(id) !== Number(targetUserId)));
        toast(`Unfollowed ${targetName}`);
      }
      const updated = await fetchPosts(profileId);
      if (updated?.length) setPosts(updated);
    }
  };

  return (
    <div className="ap-page">
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
                  />
                  <div className="ap-post-author-meta">
                    <div className="ap-post-author-row">
                      <span className="ap-post-author-name">{post.author_name}</span>
                      <span className="ap-post-badge">{post.author_role || 'Member'}</span>
                      <span className="ap-post-time">
                        •{' '}
                        {post.created_at
                          ? new Date(post.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}{' '}
                        • 🌐
                      </span>
                    </div>
                  </div>
                  {post.user_id !== profileId && (
                    <button
                      className={`ap-follow-btn ${followingIds.includes(post.user_id) ? 'following' : ''}`}
                      onClick={() => handleToggleFollow(post.user_id, post.author_name)}
                    >
                      {followingIds.includes(post.user_id) ? 'Following ✓' : 'Follow'}
                    </button>
                  )}
                  <button className="ap-menu-btn">⋮</button>
                </div>

                <div className="ap-post-body">
                  <p className="ap-post-text">{post.content}</p>
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
                  <span>👍 ❤️ 👏 {post.likes_count || 0}</span>
                  <span>
                    {post.comments_count || 0} comments · 12 shares
                  </span>
                </div>

                <div className="ap-post-interact-bar">
                  <button
                    className={`ap-interact-btn ${post.has_liked ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.has_liked ? '👍 Liked' : '👍 Like'}
                  </button>
                  <button
                    className="ap-interact-btn"
                    onClick={() => toast('Comment feature coming soon!')}
                  >
                    💬 Comment
                  </button>
                  <button
                    className="ap-interact-btn"
                    onClick={() => toast.success('Link copied!')}
                  >
                    ↗️ Share
                  </button>
                </div>

                <div className="ap-post-comments-preview">
                  <div className="ap-comment-item">
                    <span className="ap-commenter-name">Amit Verma</span>
                    <span className="ap-commenter-text">Great sharing keep inspiring!</span>
                  </div>
                  <div className="ap-comment-input-box">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      className="ap-comment-input"
                    />
                    <button className="ap-comment-submit">➤</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
