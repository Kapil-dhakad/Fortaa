import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  recordStoryView,
  voteStoryPoll,
  deleteStory,
  fetchStoryViewers,
  toggleStoryLike,
  replyStory,
} from '../../services/story.service';
import { fetchConversations, sendChatMessageHttp } from '../../services/message.service';
import { emitSendMessage } from '../../services/socket.service';
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

  // Likes state: { [storyId]: boolean }
  const [likesState, setLikesState] = useState({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Reply states
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState('');

  // Share Sheet modal states
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareContacts, setShareContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sharedStatus, setSharedStatus] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Three dots menu state
  const [showMenu, setShowMenu] = useState(false);

  // Viewers sheet modal state
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewersLikesCount, setViewersLikesCount] = useState(0);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Optimistic poll voting state: { [storyId]: { optionId, pollData } }
  const [pollStates, setPollStates] = useState({});
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);

  const videoRef = useRef(null);
  const pressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  // Sync initial group index when opened & manage background audio/video playback
  useEffect(() => {
    if (isOpen) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowMenu(false);
      setShowViewersSheet(false);
      setShowShareSheet(false);
      setShowHeartBurst(false);
      setReplyText('');
      setReplyFeedback('');
      setSharedStatus({});
      setCopiedLink(false);

      // Immediately pause all external background videos (e.g. Feed videos)
      const allVids = document.querySelectorAll('video');
      allVids.forEach((v) => {
        if (videoRef.current && v === videoRef.current) return;
        try {
          if (!v.paused) v.pause();
        } catch (_) {}
      });

      // Notify dashboard feed videos to pause
      window.dispatchEvent(new CustomEvent('fortaa:modal_video_active', { detail: { active: true } }));

      return () => {
        if (videoRef.current && !videoRef.current.paused) {
          try {
            videoRef.current.pause();
          } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent('fortaa:modal_video_active', { detail: { active: false } }));
      };
    }
  }, [isOpen, initialGroupIndex]);

  const currentGroup = storyGroups[groupIndex] || null;
  const storiesList = currentGroup?.stories || [];
  const currentStory = storiesList[storyIndex] || null;

  // Live refs to guarantee callbacks and timers never run with stale state
  const groupIndexRef = useRef(groupIndex);
  groupIndexRef.current = groupIndex;
  const storyIndexRef = useRef(storyIndex);
  storyIndexRef.current = storyIndex;
  const storyGroupsRef = useRef(storyGroups);
  storyGroupsRef.current = storyGroups;
  const storiesListRef = useRef(storiesList);
  storiesListRef.current = storiesList;

  // Record view whenever currentStory changes (Only when viewer is NOT the owner)
  useEffect(() => {
    if (!isOpen || !currentStory?.id || !currentUserId) return;
    if (Number(currentStory.user_id) === Number(currentUserId)) return; // Owner viewing own story is NOT counted
    recordStoryView(currentStory.id, currentUserId);
  }, [isOpen, currentStory?.id, currentStory?.user_id, currentUserId]);

  // Navigate to Next Story / Next User
  const handleNext = useCallback(() => {
    setShowMenu(false);
    setShowViewersSheet(false);
    setProgress(0);

    const sIdx = storyIndexRef.current;
    const gIdx = groupIndexRef.current;
    const gList = storyGroupsRef.current;
    const cGroup = gList[gIdx];
    const sList = cGroup?.stories || [];

    if (sIdx < sList.length - 1) {
      setStoryIndex(sIdx + 1);
    } else if (gIdx < gList.length - 1) {
      setGroupIndex(gIdx + 1);
      setStoryIndex(0);
    } else {
      onClose?.();
    }
  }, [onClose]);

  // Navigate to Previous Story / Previous User
  const handlePrev = useCallback(() => {
    setShowMenu(false);
    setShowViewersSheet(false);
    setProgress(0);

    const sIdx = storyIndexRef.current;
    const gIdx = groupIndexRef.current;
    const gList = storyGroupsRef.current;

    if (sIdx > 0) {
      setStoryIndex(sIdx - 1);
    } else if (gIdx > 0) {
      const prevGroup = gList[gIdx - 1];
      const prevStoriesCount = prevGroup?.stories?.length || 1;
      setGroupIndex(gIdx - 1);
      setStoryIndex(Math.max(0, prevStoriesCount - 1));
    } else {
      setProgress(0);
    }
  }, []);

  // Timer loop for auto-progressing slides (White line progresses to 100% -> auto next story/user)
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || showViewersSheet || showShareSheet || showMenu || replyText.trim().length > 0) {
      return;
    }

    // Video duration drive
    if (currentStory.media_type === 'video') {
      const vid = videoRef.current;
      if (!vid) return;

      const onTimeUpdate = () => {
        if (vid.duration && !isNaN(vid.duration)) {
          const p = (vid.currentTime / vid.duration) * 100;
          setProgress(Math.min(100, p));
        }
      };
      const onEnded = () => {
        handleNext();
      };

      vid.addEventListener('timeupdate', onTimeUpdate);
      vid.addEventListener('ended', onEnded);

      // Ensure no background video is playing
      document.querySelectorAll('video').forEach((v) => {
        if (v !== vid && !v.paused) {
          try { v.pause(); } catch (_) {}
        }
      });

      // Attempt to play story video
      vid.play().catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });

      return () => {
        vid.removeEventListener('timeupdate', onTimeUpdate);
        vid.removeEventListener('ended', onEnded);
      };
    }

    // 5-second auto-advance timer for Photo, Text, Poll
    const stepInterval = 30; // 30ms step for ultra-smooth progress
    const stepIncrement = (stepInterval / SLIDE_DURATION_MS) * 100;

    const intervalId = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(intervalId);
          handleNext();
          return 100;
        }
        return next;
      });
    }, stepInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, currentStory?.id, currentStory?.media_type, isPaused, showViewersSheet, showShareSheet, showMenu, replyText, handleNext]);

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
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }

    try {
      await toggleStoryLike(currentStory.id, currentUserId);
    } catch (err) {
      console.error('Like story error:', err);
    }
  };

  // Send Story Reply Message via Backend + Socket
  const handleSendReply = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const textToSend = replyText.trim();
    const targetUserId = currentStory?.user_id || currentGroup?.userId;
    if (!textToSend || !currentUserId || !targetUserId || isSendingReply) return;

    setIsSendingReply(true);
    const authorName = currentGroup?.userName || 'Leader';

    try {
      const res = await replyStory(currentStory.id, currentUserId, textToSend);
      if (res?.success) {
        setReplyText('');
        setReplyFeedback(`Sent to ${authorName}! 💬`);
        toast.success(`Sent to ${authorName}! 💬`);
        setTimeout(() => {
          setReplyFeedback('');
          setIsPaused(false);
        }, 2200);
      } else {
        toast.error(res?.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Failed to send story reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Open Share Sheet
  const handleOpenShare = async (e) => {
    e.stopPropagation();
    setIsPaused(true);
    setShowShareSheet(true);
    setCopiedLink(false);
    setLoadingContacts(true);

    try {
      const convs = await fetchConversations(currentUserId);
      setShareContacts(Array.isArray(convs) ? convs.slice(0, 10) : []);
    } catch (err) {
      console.error('Failed to load contacts for share:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Copy Story Link
  const handleCopyStoryLink = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/dashboard`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Native / App Share
  const handleNativeShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/dashboard`;
    if (navigator.share) {
      navigator.share({
        title: `${currentGroup.userName}'s Story on Fortaa`,
        text: `Watch ${currentGroup.userName}'s story on Fortaa:`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Check out ${currentGroup.userName}'s story on Fortaa: ${shareUrl}`
        )}`,
        '_blank'
      );
    }
  };

  // Share Story directly to a Contact in Chat
  const handleShareToContact = async (contact) => {
    const contactId = contact.user_id;
    if (!contactId || sharedStatus[contactId]) return;

    try {
      const msgText = `Shared ${currentGroup.userName}'s story with you! 🌟`;
      const attachment = {
        type: 'story_share',
        storyId: currentStory.id,
        mediaType: currentStory.media_type,
        mediaUrl: currentStory.media_url,
        authorName: currentGroup.userName,
        authorAvatar: currentGroup.userAvatar,
      };

      await sendChatMessageHttp({
        senderId: currentUserId,
        receiverId: contactId,
        text: msgText,
        attachment,
      });

      emitSendMessage({
        senderId: currentUserId,
        receiverId: contactId,
        text: msgText,
        attachment,
      });

      setSharedStatus((prev) => ({ ...prev, [contactId]: true }));
    } catch (err) {
      console.error('Failed to share story to contact:', err);
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
        // toast.success('Vote submitted! 📊');
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
      setViewersLikesCount(viewers.likesCount || viewers.filter((v) => v.has_liked).length || 0);
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
        // toast.success('Story deleted');
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

  // Long-press hold-to-pause logic
  const handlePointerDown = (e) => {
    // If clicking buttons, inputs, dropdown, or interactive sheet, don't pause
    if (
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('.svm-poll-opt-btn') ||
      e.target.closest('.svm-dropdown-menu') ||
      e.target.closest('.svm-viewers-sheet') ||
      e.target.closest('.svm-footer-bar')
    ) {
      return;
    }

    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPaused(true);
    }, 220); // 220ms is the standard threshold for hold-to-pause
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      setIsPaused(false);
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
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          background:
            currentStory.media_type === 'photo' || currentStory.media_type === 'video'
              ? '#000000'
              : currentStory.background_style || 'linear-gradient(135deg, #6366F1, #9333EA)',
        }}
      >
        {/* Floating Heart Burst on Like */}
        {showHeartBurst && (
          <div className="svm-floating-heart-burst">
            <svg width="84" height="84" viewBox="0 0 24 24" fill="#EF4444">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        )}

        {/* In-Story Reply Feedback Toast */}
        {replyFeedback && (
          <div className="svm-in-story-toast">
            <span>✓ {replyFeedback}</span>
          </div>
        )}

        {/* Left Screen Tap Area -> Previous Story (covers left 35%) */}
        <div
          className="svm-tap-area svm-tap-left"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLongPressRef.current) {
              handlePrev();
            }
          }}
          aria-label="Previous story"
        />

        {/* Right Screen Tap Area -> Next Story (covers right 65%) */}
        <div
          className="svm-tap-area svm-tap-right"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLongPressRef.current) {
              handleNext();
            }
          }}
          aria-label="Next story"
        />

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
                preload="auto"
                className="svm-media-video"
                onWaiting={() => setIsVideoBuffering(true)}
                onPlaying={() => setIsVideoBuffering(false)}
                onCanPlay={() => setIsVideoBuffering(false)}
                onError={() => {
                  const vid = videoRef.current;
                  if (vid) {
                    const t = vid.currentTime || 0;
                    setTimeout(() => {
                      if (vid) {
                        vid.load();
                        vid.currentTime = t;
                        vid.play().catch(() => {});
                      }
                    }, 500);
                  }
                }}
              />
              {isVideoBuffering && (
                <div className="svm-video-spinner-wrap">
                  <div className="svm-video-spinner" />
                </div>
              )}
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
        <div className="svm-footer-bar svm-interactive" onClick={(e) => e.stopPropagation()}>
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
            <div className="svm-reply-bar" onClick={(e) => e.stopPropagation()}>
              <div className="svm-reply-input-wrap">
                <input
                  type="text"
                  value={replyText}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => {
                    if (!replyText.trim() && !showShareSheet && !showViewersSheet) {
                      setIsPaused(false);
                    }
                  }}
                  placeholder={`Reply to ${currentGroup?.userName || 'Leader'}...`}
                  className="svm-reply-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
                {replyText.trim().length > 0 && (
                  <button
                    type="button"
                    className="svm-reply-send-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSendReply}
                    disabled={isSendingReply}
                    title="Send Reply"
                  >
                    {isSendingReply ? (
                      <span className="svm-send-spinner" />
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="#7C3AED" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

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
                onClick={handleOpenShare}
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
                <h4>Story Views</h4>
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
                      className={`svm-viewer-item ${viewer.has_liked ? 'has-liked' : ''}`}
                      onClick={() => {
                        onClose?.();
                        navigate(`/leader/${viewer.id}`);
                      }}
                    >
                      <div className="svm-viewer-avatar-wrap">
                        <img
                          src={viewer.avatar_url || userAvatarImg}
                          alt={viewer.name}
                          className="svm-viewer-avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = userAvatarImg;
                          }}
                        />
                        {viewer.has_liked && (
                          <span className="svm-viewer-avatar-heart" title="Liked this story">
                            ❤️
                          </span>
                        )}
                      </div>
                      <div className="svm-viewer-info">
                        <div className="svm-viewer-name-row">
                          <span className="svm-viewer-name">{viewer.name}</span>
                          {viewer.has_liked && (
                            <span className="svm-viewer-liked-badge">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              Liked
                            </span>
                          )}
                        </div>
                        <span className="svm-viewer-role">{viewer.designation || 'Business Leader'}</span>
                      </div>
                      <div className="svm-viewer-meta">
                        {viewer.has_liked && (
                          <svg className="svm-viewer-like-icon" width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        )}
                        <span className="svm-viewer-time">{formatTimeAgo(viewer.viewed_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Story Share Bottom Sheet Modal ── */}
        {showShareSheet && (
          <div className="svm-share-sheet svm-interactive" onClick={(e) => e.stopPropagation()}>
            <div className="svm-share-header">
              <div className="svm-share-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <h4>Share Story</h4>
              </div>
              <button
                type="button"
                className="svm-share-close"
                onClick={() => {
                  setShowShareSheet(false);
                  setIsPaused(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Actions: Copy Link & External Apps */}
            <div className="svm-share-quick-row">
              <button
                type="button"
                className={`svm-share-quick-btn ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyStoryLink}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copiedLink ? 'Link Copied! ✓' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                className="svm-share-quick-btn svm-share-app-btn"
                onClick={handleNativeShare}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share via Apps</span>
              </button>
            </div>

            {/* Send Directly in Chat to Leaders */}
            <div className="svm-share-leaders-heading">
              <span>Send in Chat</span>
            </div>

            <div className="svm-share-contacts-list">
              {loadingContacts ? (
                <div className="svm-share-empty">Loading leaders...</div>
              ) : shareContacts.length === 0 ? (
                <div className="svm-share-empty">Use Copy Link to share with anyone!</div>
              ) : (
                shareContacts.map((contact) => {
                  const isSent = Boolean(sharedStatus[contact.user_id]);
                  return (
                    <div key={contact.user_id} className="svm-share-contact-item">
                      <img
                        src={contact.avatar || userAvatarImg}
                        alt={contact.name}
                        className="svm-share-contact-avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = userAvatarImg;
                        }}
                      />
                      <div className="svm-share-contact-info">
                        <span className="svm-share-contact-name">{contact.name}</span>
                        <span className="svm-share-contact-sub">{contact.role || contact.company || 'Leader'}</span>
                      </div>
                      <button
                        type="button"
                        className={`svm-share-send-btn ${isSent ? 'sent' : ''}`}
                        onClick={() => !isSent && handleShareToContact(contact)}
                        disabled={isSent}
                      >
                        {isSent ? 'Sent ✓' : 'Send'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
