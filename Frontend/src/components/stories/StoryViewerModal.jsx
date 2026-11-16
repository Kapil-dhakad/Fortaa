import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  recordStoryView,
  voteStoryPoll,
  deleteStory,
  fetchStoryViewers,
  toggleStoryLike,
} from '../../services/story.service';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import './StoryViewerModal.css';

const SLIDE_DURATION_MS = 5000; // 5 seconds per slide

export default function StoryViewerModal({
  isOpen,
  onClose,
  storyGroups = [],
  initialGroupIndex = 0,
  currentUserId,
  onStoryDeleted,
  onPollVoted,
}) {
  const navigate = useNavigate();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Likes state: { [storyId]: boolean }
  const [likesState, setLikesState] = useState({});

  // Three dots menu state
  const [showMenu, setShowMenu] = useState(false);

  // Viewers sheet modal state
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Optimistic poll voting state: { [storyId]: { optionId, pollData } }
  const [pollStates, setPollStates] = useState({});

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);

  // Sync initial group index when opened
  useEffect(() => {
    if (isOpen) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowMenu(false);
      setShowViewersSheet(false);
    }
  }, [isOpen, initialGroupIndex]);

  const currentGroup = storyGroups[groupIndex] || null;
  const storiesList = currentGroup?.stories || [];
  const currentStory = storiesList[storyIndex] || null;

  // Record view whenever currentStory changes (Only when viewer is NOT the owner)
  useEffect(() => {
    if (!isOpen || !currentStory?.id || !currentUserId) return;
    if (Number(currentStory.user_id) === Number(currentUserId)) return; // Owner viewing own story is NOT counted
    recordStoryView(currentStory.id, currentUserId);
  }, [isOpen, currentStory?.id, currentStory?.user_id, currentUserId]);

  // Navigate to Next Story / Next User
  const handleNext = useCallback(() => {
    if (!currentGroup) return;

    setShowMenu(false);
    setShowViewersSheet(false);

    if (storyIndex < storiesList.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose?.();
    }
  }, [currentGroup, storyIndex, storiesList.length, groupIndex, storyGroups.length, onClose]);

  // Navigate to Previous Story / Previous User
  const handlePrev = useCallback(() => {
    setShowMenu(false);
    setShowViewersSheet(false);

    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(Math.max(0, (prevGroup?.stories?.length || 1) - 1));
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Timer loop for auto-progressing slides
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || showViewersSheet || showMenu) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      return;
    }

    // Video duration drive
    if (currentStory.media_type === 'video' && videoRef.current) {
      const vid = videoRef.current;
      const onTimeUpdate = () => {
        if (vid.duration) {
          const p = (vid.currentTime / vid.duration) * 100;
          setProgress(p);
        }
      };
      const onEnded = () => {
        handleNext();
      };

      vid.addEventListener('timeupdate', onTimeUpdate);
      vid.addEventListener('ended', onEnded);
      return () => {
        vid.removeEventListener('timeupdate', onTimeUpdate);
        vid.removeEventListener('ended', onEnded);
      };
    }

    // 5s timer for Photo, Text, Poll
    let animationFrameId;
    startTimeRef.current = performance.now() - (progress / 100) * SLIDE_DURATION_MS;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNext();
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    timerRef.current = animationFrameId;

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, currentStory, isPaused, showViewersSheet, showMenu, handleNext, progress]);

  if (!isOpen || !currentStory) return null;

  const isOwner = Number(currentStory.user_id) === Number(currentUserId);
  const activePoll = pollStates[currentStory.id]?.pollData || currentStory.poll_data;
  const userVotedOption =
    pollStates[currentStory.id]?.optionId ||
    currentStory.user_poll_vote ||
    (activePoll?.voters ? activePoll.voters[String(currentUserId)] : null);

  const isLiked =
    likesState[currentStory.id] !== undefined
      ? likesState[currentStory.id]
      : Boolean(currentStory.is_liked);

  // Navigate to story author's profile
  const handleAuthorProfileClick = (e) => {
    e.stopPropagation();
    onClose?.();
    if (Number(currentGroup.userId) === Number(currentUserId)) {
      navigate('/profile');
    } else {
      navigate(`/leader/${currentGroup.userId}`);
    }
  };

  // Toggle Like on Story
  const handleLikeStory = async (e) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast.error('Please sign in to like this story');
      return;
    }

    const nextLiked = !isLiked;
    setLikesState((prev) => ({ ...prev, [currentStory.id]: nextLiked }));

    if (nextLiked) {
      toast('Liked story! ❤️', { icon: '❤️' });
    }

    try {
      await toggleStoryLike(currentStory.id, currentUserId);
    } catch (err) {
      console.error('Like story error:', err);
    }
  };

  // Share Story
  const handleShareStory = (e) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + `/dashboard`;
    if (navigator.share) {
      navigator.share({
        title: `${currentGroup.userName}'s Story on Fortaa`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Story link copied to clipboard! 🔗');
    }
  };

  // Poll Voting Handler
  const handleVotePoll = async (e, optionId) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast.error('Please sign in to vote in story poll');
      return;
    }

    const storyId = currentStory.id;
    const currentPoll = pollStates[storyId]?.pollData || currentStory.poll_data || { options: [] };

    const updatedOptions = (currentPoll.options || []).map((opt) => ({
      ...opt,
      votes: opt.id === optionId ? (opt.votes || 0) + 1 : opt.votes || 0,
    }));
    const newTotal = (currentPoll.totalVotes || 0) + 1;

    setPollStates((prev) => ({
      ...prev,
      [storyId]: {
        optionId,
        pollData: {
          ...currentPoll,
          options: updatedOptions,
          totalVotes: newTotal,
        },
      },
    }));

    try {
      const res = await voteStoryPoll(storyId, optionId, currentUserId);
      if (res?.success) {
        toast.success('Vote submitted! 📊');
        onPollVoted?.(storyId, res.pollData, optionId);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  // Open Viewers Sheet
  const handleOpenViewers = async (e) => {
    e.stopPropagation();
    setIsPaused(true);
    setShowViewersSheet(true);
    setLoadingViewers(true);

    try {
      const viewers = await fetchStoryViewers(currentStory.id);
      setViewersList(viewers);
    } catch (err) {
      console.error('Failed to load viewers:', err);
    } finally {
      setLoadingViewers(false);
    }
  };

  // Delete Story Handler
  const handleDeleteCurrentStory = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      const res = await deleteStory(currentStory.id, currentUserId);
      if (res?.success) {
        toast.success('Story deleted');
        onStoryDeleted?.(currentStory.id, currentGroup.userId);
        if (storiesList.length > 1) {
          handleNext();
        } else {
          onClose?.();
        }
      }
    } catch (err) {
      console.error('Delete story error:', err);
      toast.error('Failed to delete story');
    }
  };

  // Screen click handler: left 30% goes back, right 70% advances
  const handleScreenClick = (e) => {
    if (e.target.closest('.svm-interactive') || e.target.closest('button') || e.target.closest('input')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="svm-backdrop" onClick={onClose}>
      {/* Main 9:16 Story Frame */}
      <div
        className="svm-story-frame"
        onClick={handleScreenClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          background:
            currentStory.media_type === 'photo' || currentStory.media_type === 'video'
              ? '#000000'
              : currentStory.background_style || 'linear-gradient(135deg, #6366F1, #9333EA)',
        }}
      >
        {/* Top Progress Bars (Segmented) */}
        <div className="svm-progress-bar-wrap">
          {storiesList.map((st, idx) => {
            let fillPercent = 0;
            if (idx < storyIndex) fillPercent = 100;
            else if (idx === storyIndex) fillPercent = progress;
            else fillPercent = 0;

            return (
              <div key={st.id || idx} className="svm-progress-track">
                <div
                  className="svm-progress-fill"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header: Author Details & Actions */}
        <div className="svm-header svm-interactive">
          {/* Clickable Profile: Avatar + Name -> Opens Profile */}
          <div
            className="svm-header-left"
            onClick={handleAuthorProfileClick}
            title={`View ${currentGroup.userName}'s profile`}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={currentGroup.userAvatar || userAvatarImg}
              alt={currentGroup.userName}
              className="svm-author-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = userAvatarImg;
              }}
            />
            <div className="svm-author-info">
              <span className="svm-author-name">{currentGroup.userName}</span>
              <span className="svm-author-time">{formatTimeAgo(currentStory.created_at)}</span>
            </div>
          </div>

          <div className="svm-header-right">
            {/* Sound toggle for video */}
            {currentStory.media_type === 'video' && (
              <button
                type="button"
                className="svm-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            )}

            {/* Three dots menu for Story Owner -> Contains Delete */}
            {isOwner && (
              <div className="svm-menu-wrapper" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="svm-icon-btn svm-menu-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  title="Story options"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="svm-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="svm-dropdown-item svm-delete-item"
                      onClick={handleDeleteCurrentStory}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Delete Story</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              className="svm-icon-btn svm-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="svm-content-body">
          {/* Photo Slide */}
          {currentStory.media_type === 'photo' && (
            <div className="svm-media-wrap">
              <img
                src={currentStory.media_url}
                alt="Story"
                className="svm-media-img"
              />
            </div>
          )}

          {/* Video Slide */}
          {currentStory.media_type === 'video' && (
            <div className="svm-media-wrap">
              <video
                ref={videoRef}
                src={currentStory.media_url}
                autoPlay
                playsInline
                muted={isMuted}
                className="svm-media-video"
              />
            </div>
          )}

          {/* Text Slide */}
          {currentStory.media_type === 'text' && (
            <div className="svm-text-container">
              <h2 className="svm-text-quote">
                "{currentStory.text_content}"
              </h2>
            </div>
          )}

          {/* Poll Slide */}
          {currentStory.media_type === 'poll' && activePoll && (
            <div className="svm-poll-container">
              <div className="svm-poll-sticker svm-interactive">
                <h3 className="svm-poll-question">
                  {activePoll.question || currentStory.text_content || 'Poll'}
                </h3>

                <div className="svm-poll-options">
                  {(activePoll.options || []).map((opt) => {
                    const hasVoted = Boolean(userVotedOption);
                    const isSelected = Number(userVotedOption) === Number(opt.id);
                    const totalVotes = activePoll.totalVotes || 0;
                    const optVotes = opt.votes || 0;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                    return (
                      <div
                        key={opt.id}
                        className={`svm-poll-opt-btn ${hasVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          if (!hasVoted) handleVotePoll(e, opt.id);
                        }}
                      >
                        {hasVoted && (
                          <div
                            className="svm-poll-fill-bar"
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <span className="svm-poll-opt-text">
                          {isSelected && '✓ '}
                          {opt.text}
                        </span>

                        {hasVoted && (
                          <span className="svm-poll-percent">{percent}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="svm-poll-footer">
                  <span>{activePoll.totalVotes || 0} votes</span>
                  {userVotedOption && <span>• You voted</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Views / Actions Footer */}
        <div className="svm-footer-bar svm-interactive">
          {isOwner ? (
            /* Author View: Views indicator on LEFT with SVG Eye Icon, clickable to see viewers */
            <div className="svm-footer-owner-row">
              <button
                type="button"
                className="svm-views-btn-left"
                onClick={handleOpenViewers}
                title="See who viewed your story"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{currentStory.views_count || 0} views</span>
              </button>
            </div>
          ) : (
            /* Viewer View: Reply input pill + Heart SVG Like Button + Share Paper Plane Icon */
            <div className="svm-reply-bar">
              <input
                type="text"
                placeholder={`Reply to ${currentGroup.userName}...`}
                className="svm-reply-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    toast.success('Reply sent via chat! 💬');
                    e.target.value = '';
                  }
                }}
              />

              {/* Heart Like SVG Button */}
              <button
                type="button"
                className={`svm-action-btn svm-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLikeStory}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={isLiked ? '#EF4444' : 'none'}
                  stroke={isLiked ? '#EF4444' : '#FFFFFF'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isLiked ? 'svm-heart-burst' : ''}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {/* Share Paper Plane SVG Button */}
              <button
                type="button"
                className="svm-action-btn svm-share-btn"
                onClick={handleShareStory}
                title="Share story"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Story Viewers Bottom Sheet Modal ── */}
        {showViewersSheet && (
          <div className="svm-viewers-sheet svm-interactive" onClick={(e) => e.stopPropagation()}>
            <div className="svm-viewers-header">
              <div className="svm-viewers-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <h4>Story Views ({viewersList.length})</h4>
              </div>
              <button
                type="button"
                className="svm-viewers-close"
                onClick={() => {
                  setShowViewersSheet(false);
                  setIsPaused(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="svm-viewers-body">
              {loadingViewers ? (
                <div className="svm-viewers-empty">Loading viewers...</div>
              ) : viewersList.length === 0 ? (
                <div className="svm-viewers-empty">
                  <span style={{ fontSize: '28px' }}>👀</span>
                  <p>No views yet. When leaders view your story, they'll appear here.</p>
                </div>
              ) : (
                <div className="svm-viewers-list">
                  {viewersList.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="svm-viewer-item"
                      onClick={() => {
                        onClose?.();
                        navigate(`/leader/${viewer.id}`);
                      }}
                    >
                      <img
                        src={viewer.avatar_url || userAvatarImg}
                        alt={viewer.name}
                        className="svm-viewer-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarImg;
                        }}
                      />
                      <div className="svm-viewer-info">
                        <span className="svm-viewer-name">{viewer.name}</span>
                        <span className="svm-viewer-role">{viewer.designation || 'Business Leader'}</span>
                      </div>
                      <span className="svm-viewer-time">{formatTimeAgo(viewer.viewed_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
