import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  fetchPostComments,
  addPostCommentApi,
  likePostCommentApi,
  deletePostCommentApi,
} from '../../services/dashboard.service';
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
  FaTrashAlt,
  FaSmile,
} from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { HiOutlineDotsHorizontal, HiX } from 'react-icons/hi';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import './InstagramPostModal.css';

export default function InstagramPostModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onLike,
  onShare,
  onAuthorClick,
  onMenuClick,
  followingIds = [],
  onToggleFollow,
}) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);

  const inputRef = useRef(null);
  const commentsScrollRef = useRef(null);

  // Sync state when post changes
  useEffect(() => {
    if (post) {
      setIsLiked(Boolean(post.has_liked));
      setLikesCount(Number(post.likes_count) || 0);
    }
  }, [post]);

  // Load comments
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!post?.id) return;
      try {
        setLoadingComments(true);
        const data = await fetchPostComments(post.id);
        if (isMounted) {
          if (data.length === 0 && Number(post.comments_count) > 0) {
            setComments([
              {
                id: 'demo-c1',
                author_name: 'Amit Verma',
                author_role: 'Diamond Leader',
                author_avatar: userAvatarRahul,
                content: 'Great update, keep leading the way! 🚀',
                likes_count: 2,
                created_at: new Date(Date.now() - 3600000).toISOString(),
              },
            ]);
          } else {
            setComments(data);
          }
        }
      } catch (err) {
        console.error('Failed to load post comments:', err);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }

    if (isOpen && post) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, post]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const currentUserId = currentUser?.id || 13;
  const currentUserName = currentUser?.name || 'Kapil Dhakad';
  const currentUserRole = currentUser?.designation || currentUser?.role || 'Senior Leader';
  const currentUserAvatar = currentUser?.avatarUrl || userAvatarRahul;

  const isSelf = post.user_id && Number(post.user_id) === Number(currentUserId);
  const targetId = post.user_id ? Number(post.user_id) : null;
  const isFollowed = targetId && Array.isArray(followingIds) && followingIds.map(Number).includes(targetId);

  // Handle Like Toggle
  const handleLikeClick = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));
    if (onLike) onLike(post.id);
  };

  // Double click media to like
  const handleDoubleClickMedia = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      if (onLike) onLike(post.id);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  // Handle Submit Comment
  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    const clean = commentText.trim();
    if (!clean || submittingComment) return;

    setSubmittingComment(true);
    const tempComment = {
      id: `temp-${Date.now()}`,
      post_id: post.id,
      user_id: currentUserId,
      author_name: currentUserName,
      author_role: currentUserRole,
      author_avatar: currentUserAvatar,
      content: clean,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempComment]);
    setCommentText('');

    // scroll to bottom
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
      }
    }, 50);

    try {
      const res = await addPostCommentApi(post.id, {
        content: clean,
        userId: currentUserId,
        authorName: currentUserName,
        authorRole: currentUserRole,
        authorAvatar: currentUserAvatar,
      });

      if (res && res.success) {
        toast.success('Comment posted!');
        if (res.comment) {
          setComments((prev) =>
            prev.map((c) => (c.id === tempComment.id ? res.comment : c))
          );
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Like single comment
  const handleLikeComment = async (commentId) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const userLiked = c.user_liked;
          return {
            ...c,
            user_liked: !userLiked,
            likes_count: Math.max(0, (c.likes_count || 0) + (userLiked ? -1 : 1)),
          };
        }
        return c;
      })
    );
    try {
      if (typeof commentId === 'number') {
        await likePostCommentApi(commentId);
      }
    } catch {}
  };

  // Delete single comment
  const handleDeleteComment = async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success('Comment deleted');
    try {
      if (typeof commentId === 'number') {
        await deletePostCommentApi(commentId);
      }
    } catch {}
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😍', '🚀', '💯', '✨'];

  return (
    <div className="ipm-backdrop" onClick={onClose}>
      {/* Floating Close Button */}
      <button
        type="button"
        className="ipm-floating-close"
        onClick={onClose}
        title="Close (Esc)"
      >
        <HiX size={26} />
      </button>

      {/* Main Instagram Box */}
      <div
        className="ipm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ── LEFT: MEDIA / VISUAL VIEWPORT ── */}
        <div
          className={`ipm-media-col ${!post.image_url ? 'ipm-text-canvas' : ''}`}
          onDoubleClick={handleDoubleClickMedia}
        >
          {post.image_url ? (
            <div className="ipm-image-wrapper">
              <img
                src={post.image_url}
                alt="Post media"
                className="ipm-post-image"
              />
              <div className="ipm-watermark-pill">
                <img src={logoTextImg} alt="FORTAA" className="ipm-watermark-logo" />
              </div>
            </div>
          ) : (
            <div className="ipm-typography-card">
              <div className="ipm-typo-watermark">FORTAA</div>
              <p className="ipm-typo-content">"{post.content}"</p>
              {post.tags && <p className="ipm-typo-tags">{post.tags}</p>}
            </div>
          )}

          {/* Double Click Heart Animation */}
          {showHeartAnim && (
            <div className="ipm-heart-pop-anim">
              <FaHeart />
            </div>
          )}
        </div>

        {/* ── RIGHT: HEADER, CAPTION, COMMENTS & INTERACTION ── */}
        <div className="ipm-content-col">
          {/* Top Author Header */}
          <div className="ipm-header">
            <div
              className="ipm-author-info"
              onClick={() => {
                onClose();
                if (onAuthorClick) onAuthorClick(post);
              }}
              title="View Profile"
            >
              <img
                src={post.author_avatar || userAvatarRahul}
                alt={post.author_name}
                className="ipm-avatar"
              />
              <div className="ipm-author-meta">
                <div className="ipm-name-row">
                  <span className="ipm-author-name">{post.author_name || 'Leader'}</span>
                  <span className="ipm-verified-dot">•</span>
                  <span className="ipm-role-badge">{post.author_role || 'Senior Leader'}</span>
                </div>
                <span className="ipm-location-sub">India • Original audio</span>
              </div>
            </div>

            <div className="ipm-header-actions">
              {!isSelf && targetId && (
                <button
                  type="button"
                  className={`ipm-btn-follow ${isFollowed ? 'following' : ''}`}
                  onClick={() => onToggleFollow && onToggleFollow(targetId, post.author_name)}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              )}
              <button
                type="button"
                className="ipm-btn-dots"
                onClick={() => onMenuClick && onMenuClick(post)}
                title="More options"
              >
                <HiOutlineDotsHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Caption & Comments List */}
          <div className="ipm-comments-scroll" ref={commentsScrollRef}>
            {/* Post Caption (First Entry) */}
            <div className="ipm-comment-row ipm-caption-row">
              <img
                src={post.author_avatar || userAvatarRahul}
                alt=""
                className="ipm-comment-avatar"
                onClick={() => {
                  onClose();
                  if (onAuthorClick) onAuthorClick(post);
                }}
              />
              <div className="ipm-comment-body">
                <p className="ipm-comment-text">
                  <span
                    className="ipm-comment-author-bold"
                    onClick={() => {
                      onClose();
                      if (onAuthorClick) onAuthorClick(post);
                    }}
                  >
                    {post.author_name || 'Leader'}
                  </span>{' '}
                  {post.content}
                </p>
                {post.tags && <p className="ipm-caption-tags">{post.tags}</p>}
                <div className="ipm-comment-footer">
                  <span className="ipm-comment-time">{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="ipm-divider" />

            {/* Comments List */}
            {loadingComments ? (
              <div className="ipm-loading-box">
                <span className="ipm-spinner" />
                <span>Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="ipm-empty-comments">
                <h4>No comments yet.</h4>
                <p>Start the conversation and share your thoughts.</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = Number(comment.user_id) === Number(currentUserId);
                return (
                  <div key={comment.id} className="ipm-comment-row">
                    <img
                      src={comment.author_avatar || userAvatarRahul}
                      alt={comment.author_name}
                      className="ipm-comment-avatar"
                      onError={(e) => {
                        e.currentTarget.src = userAvatarRahul;
                      }}
                    />
                    <div className="ipm-comment-body">
                      <p className="ipm-comment-text">
                        <span className="ipm-comment-author-bold">
                          {comment.author_name}
                        </span>{' '}
                        {comment.content}
                      </p>
                      <div className="ipm-comment-footer">
                        <span className="ipm-comment-time">{formatTimeAgo(comment.created_at)}</span>
                        {comment.likes_count > 0 && (
                          <span className="ipm-comment-like-count">
                            {comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}
                          </span>
                        )}
                        <button
                          type="button"
                          className="ipm-comment-reply-btn"
                          onClick={() => {
                            setCommentText(`@${comment.author_name} `);
                            inputRef.current?.focus();
                          }}
                        >
                          Reply
                        </button>
                        {isCommentAuthor && (
                          <button
                            type="button"
                            className="ipm-comment-del-btn"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete"
                          >
                            <FaTrashAlt size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`ipm-comment-heart-btn ${comment.user_liked ? 'liked' : ''}`}
                      onClick={() => handleLikeComment(comment.id)}
                      title="Like comment"
                    >
                      {comment.user_liked ? <FaHeart size={12} color="#EF4444" /> : <FaRegHeart size={12} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Interactive Bar */}
          <div className="ipm-bottom-section">
            <div className="ipm-actions-row">
              <div className="ipm-actions-left">
                <button
                  type="button"
                  className={`ipm-action-icon-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeClick}
                  title="Like"
                >
                  {isLiked ? (
                    <FaHeart size={22} color="#EF4444" />
                  ) : (
                    <FaRegHeart size={22} />
                  )}
                </button>
                <button
                  type="button"
                  className="ipm-action-icon-btn"
                  onClick={() => inputRef.current?.focus()}
                  title="Comment"
                >
                  <FaRegComment size={21} />
                </button>
                <button
                  type="button"
                  className="ipm-action-icon-btn"
                  onClick={() => onShare && onShare(post)}
                  title="Share"
                >
                  <FiShare2 size={21} />
                </button>
              </div>

              <button
                type="button"
                className="ipm-action-icon-btn ipm-save-btn"
                onClick={() => {
                  setIsSaved(!isSaved);
                  toast.success(!isSaved ? 'Post saved to collection' : 'Post removed from saved');
                }}
                title="Save post"
              >
                {isSaved ? <FaBookmark size={20} color="#6D28D9" /> : <FaRegBookmark size={20} />}
              </button>
            </div>

            {/* Likes Count Summary */}
            <div className="ipm-likes-summary">
              <span className="ipm-likes-bold">
                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            </div>

            {/* Post Timestamp */}
            <div className="ipm-time-stamp">
              {post.created_at
                ? new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).toUpperCase()
                : 'RECENTLY'}
            </div>

            {/* Quick Emojis Drawer */}
            {showEmojiTray && (
              <div className="ipm-quick-emoji-row">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="ipm-quick-emoji-btn"
                    onClick={() => {
                      setCommentText((prev) => prev + em);
                      inputRef.current?.focus();
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Add Comment Input Row */}
            <form className="ipm-input-form" onSubmit={handleCommentSubmit}>
              <button
                type="button"
                className="ipm-emoji-toggle-btn"
                onClick={() => setShowEmojiTray(!showEmojiTray)}
                title="Emojis"
              >
                <FaSmile size={18} />
              </button>

              <input
                ref={inputRef}
                type="text"
                className="ipm-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
              />

              <button
                type="submit"
                className="ipm-btn-post-submit"
                disabled={!commentText.trim() || submittingComment}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
