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
  FaTrashAlt,
  FaPaperPlane,
} from 'react-icons/fa';
import userAvatarRahul from '../../assets/dashboard/user_avatar_rahul.png';
import './PostComments.css';

export default function PostComments({
  postId,
  currentUser,
  onCommentAdded,
  initialCount = 0,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, author_name }
  const inputRef = useRef(null);

  // Fetch comments on mount
  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      try {
        setLoading(true);
        const data = await fetchPostComments(postId);
        if (isMounted) {
          // If no server comments, provide a demo preview comment if initialCount > 0
          if (data.length === 0 && initialCount > 0) {
            setComments([
              {
                id: 'demo-1',
                author_name: 'Amit Verma',
                author_role: 'Diamond Leader',
                author_avatar: userAvatarRahul,
                content: 'Great sharing, keep inspiring!',
                likes_count: 3,
                created_at: new Date(Date.now() - 3600000).toISOString(),
              },
            ]);
          } else {
            setComments(data);
          }
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (postId) loadComments();

    return () => {
      isMounted = false;
    };
  }, [postId, initialCount]);

  // Focus input when opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Format relative time (e.g., 2m, 1h, 2d)
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // Handle clicking Reply on a comment (Instagram style)
  const handleReplyClick = (comment) => {
    setReplyingTo({ id: comment.id, author_name: comment.author_name });
    const mention = `@${comment.author_name} `;
    setNewText((prev) => {
      if (prev.startsWith(mention)) return prev;
      return `${mention}${prev.replace(/^@[a-zA-Z0-9_.]+\s*/, '')}`;
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewText((prev) => prev.replace(/^@[a-zA-Z0-9_.]+\s*/, ''));
  };

  // Submit comment
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newText.trim() || submitting) return;

    const trimmed = newText.trim();
    setSubmitting(true);
    setReplyingTo(null);

    const userName = currentUser?.name || 'Kapil Dhakad';
    const userRole = currentUser?.designation || currentUser?.role || 'Member';
    const userAvatar = currentUser?.avatarUrl || userAvatarRahul;
    const userId = currentUser?.id || 13;

    // Optimistic comment item
    const tempComment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      author_name: userName,
      author_role: userRole,
      author_avatar: userAvatar,
      content: trimmed,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempComment]);
    setNewText('');

    try {
      const res = await addPostCommentApi(postId, {
        content: trimmed,
        userId,
        authorName: userName,
        authorRole: userRole,
        authorAvatar: userAvatar,
      });

      if (res && res.success) {
        toast.success('Comment added!');
        // Replace temp comment with confirmed one from server
        if (res.comment) {
          setComments((prev) =>
            prev.map((c) => (c.id === tempComment.id ? res.comment : c))
          );
        }
        if (onCommentAdded) {
          onCommentAdded(res.comments_count || comments.length + 1);
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Like a comment
  const handleLikeComment = async (commentId) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const hasLiked = c.user_liked;
          return {
            ...c,
            user_liked: !hasLiked,
            likes_count: Math.max(0, (c.likes_count || 0) + (hasLiked ? -1 : 1)),
          };
        }
        return c;
      })
    );

    try {
      if (typeof commentId === 'number') {
        const res = await likePostCommentApi(commentId, currentUser?.id);
        if (res?.success && res?.likes_count !== undefined) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, likes_count: res.likes_count, user_liked: res.user_liked }
                : c
            )
          );
        }
      }
    } catch {
      // Optimistic UI
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success('Comment deleted');
    try {
      if (typeof commentId === 'number') {
        const res = await deletePostCommentApi(commentId);
        if (res?.comments_count !== undefined && onCommentAdded) {
          onCommentAdded(res.comments_count);
        }
      }
    } catch {
      // Optimistic UI
    }
  };

  return (
    <div className="pc-container">
      {/* Existing Comments List */}
      <div className="pc-list">
        {loading && comments.length === 0 ? (
          <div className="pc-loading">
            <span className="pc-spinner"></span>
            <span>Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="pc-empty">
            <span>No comments yet. Be the first to start the conversation!</span>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor =
              currentUser?.id &&
              comment.user_id &&
              Number(currentUser.id) === Number(comment.user_id);

            return (
              <div key={comment.id} className="pc-item">
                <img
                  src={comment.author_avatar || userAvatarRahul}
                  alt={comment.author_name}
                  className="pc-avatar"
                  onError={(e) => {
                    e.currentTarget.src = userAvatarRahul;
                  }}
                />
                <div className="pc-bubble-wrap">
                  <div className="pc-bubble">
                    <div className="pc-header">
                      <span className="pc-author">{comment.author_name}</span>
                      {comment.author_role && (
                        <span className="pc-badge">{comment.author_role}</span>
                      )}
                    </div>
                    <p className="pc-text">
                      {(() => {
                        const match = comment.content?.match(/^(@[a-zA-Z0-9_.]+)\s*(.*)/);
                        if (match) {
                          return (
                            <>
                              <span className="pc-mention">{match[1]}</span> {match[2]}
                            </>
                          );
                        }
                        return comment.content;
                      })()}
                    </p>
                  </div>

                  {/* Instagram-style comment footer: time • likes • Reply */}
                  <div className="pc-meta-row">
                    <span className="pc-time">{formatTimeAgo(comment.created_at)}</span>

                    {comment.likes_count > 0 && (
                      <span className="pc-likes-count">
                        {comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}
                      </span>
                    )}

                    <button
                      type="button"
                      className="pc-reply-btn"
                      onClick={() => handleReplyClick(comment)}
                    >
                      Reply
                    </button>

                    {isAuthor && (
                      <button
                        type="button"
                        className="pc-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <FaTrashAlt size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Instagram Heart Button on the right */}
                <button
                  type="button"
                  className={`pc-heart-btn ${comment.user_liked ? 'liked' : ''}`}
                  onClick={() => handleLikeComment(comment.id)}
                  title="Like comment"
                >
                  {comment.user_liked ? (
                    <FaHeart size={12} color="#EF4444" />
                  ) : (
                    <FaRegHeart size={12} />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Instagram Replying-To Banner */}
      {replyingTo && (
        <div className="pc-replying-bar">
          <span className="pc-replying-text">
            Replying to <strong>@{replyingTo.author_name}</strong>
          </span>
          <button
            type="button"
            className="pc-cancel-reply-btn"
            onClick={handleCancelReply}
            title="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      {/* Write New Comment Input Box */}
      <form className="pc-input-row" onSubmit={handleSubmit}>
        <img
          src={currentUser?.avatarUrl || userAvatarRahul}
          alt="Your avatar"
          className="pc-input-avatar"
          onError={(e) => {
            e.currentTarget.src = userAvatarRahul;
          }}
        />
        <div className="pc-input-field-wrap">
          <input
            ref={inputRef}
            type="text"
            className="pc-input"
            placeholder={replyingTo ? `Reply to @${replyingTo.author_name}...` : "Write a comment..."}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            className="pc-submit-btn"
            disabled={!newText.trim() || submitting}
            title="Send comment"
          >
            <FaPaperPlane size={13} />
          </button>
        </div>
      </form>
    </div>
  );
}
