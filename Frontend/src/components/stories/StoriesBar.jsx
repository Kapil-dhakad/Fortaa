import React, { useState, useEffect } from 'react';
import { fetchStories } from '../../services/story.service';
import { getSocket } from '../../services/socket.service';
import CreateStoryModal from './CreateStoryModal';
import StoryViewerModal from './StoryViewerModal';
import userAvatarImg from '../../assets/dashboard/user_avatar_rahul.png';
import './StoriesBar.css';

export default function StoriesBar({
  currentUser = {},
  variant = 'mobile', // 'mobile' | 'desktop'
}) {
  const currentUserId = Number(currentUser?.id || 13);

  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Load active stories from backend
  const loadActiveStories = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const groups = await fetchStories(currentUserId);
      setStoryGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveStories();

    // Listen for real-time new stories via socket
    const s = getSocket();
    const handleNewStory = () => {
      loadActiveStories(true);
    };

    if (s) {
      s.on('new_story', handleNewStory);
    }

    return () => {
      if (s) {
        s.off('new_story', handleNewStory);
      }
    };
  }, [currentUserId]);

  // Check if current user has active stories
  const myGroupIndex = storyGroups.findIndex((g) => Number(g.userId) === Number(currentUserId));
  const myStoryGroup = myGroupIndex !== -1 ? storyGroups[myGroupIndex] : null;
  const myStories = myStoryGroup?.stories || [];

  // When a story is created
  const handleStoryCreated = (newStory) => {
    loadActiveStories(true);
  };

  // When a story is deleted
  const handleStoryDeleted = (storyId, authorId) => {
    setStoryGroups((prev) =>
      prev
        .map((g) => {
          if (Number(g.userId) === Number(authorId)) {
            const remaining = g.stories.filter((s) => s.id !== storyId);
            return remaining.length > 0 ? { ...g, stories: remaining } : null;
          }
          return g;
        })
        .filter(Boolean)
    );
  };

  // Open viewer at specific user group
  const handleOpenGroup = (index) => {
    setActiveGroupIndex(index);
    setViewerOpen(true);
  };

  // Update poll state in local groups when voted
  const handlePollVoted = (storyId, newPollData, votedOptionId) => {
    setStoryGroups((prev) =>
      prev.map((g) => ({
        ...g,
        stories: g.stories.map((s) =>
          s.id === storyId
            ? { ...s, poll_data: newPollData, user_poll_vote: votedOptionId }
            : s
        ),
      }))
    );
  };

  return (
    <>
      <div className={`sb-container sb-${variant}`}>
        {/* Card 1: Add Story / My Active Story */}
        <div
          className={`sb-card sb-card-my ${myStories.length > 0 ? 'has-active' : ''}`}
          onClick={() => {
            if (myStories.length > 0) {
              handleOpenGroup(myGroupIndex);
            } else {
              setIsCreateOpen(true);
            }
          }}
          title={myStories.length > 0 ? 'View your story or tap + to add' : 'Add Story'}
        >
          <div className="sb-avatar-wrap">
            <img
              src={currentUser?.avatarUrl || userAvatarImg}
              alt="My Story"
              className={`sb-avatar-img ${myStories.length > 0 ? 'has-ring' : ''}`}
            />
            <button
              type="button"
              className="sb-add-badge"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              title="Add to story"
            >
              +
            </button>
          </div>
          <span className="sb-card-name">
            {myStories.length > 0 ? 'Your Story' : 'Add Story'}
          </span>
        </div>

        {/* Other Leaders / Users Stories */}
        {storyGroups.map((group, gIdx) => {
          // Skip my own story card since it's rendered first in Card 1
          if (Number(group.userId) === Number(currentUserId)) return null;

          const isUnviewed = group.hasUnviewed;

          return (
            <div
              key={group.userId || gIdx}
              className={`sb-card ${isUnviewed ? 'is-unviewed' : 'is-viewed'}`}
              onClick={() => handleOpenGroup(gIdx)}
              title={`View ${group.userName}'s story`}
            >
              <div className="sb-avatar-wrap">
                <div className={`sb-ring-wrap ${isUnviewed ? 'ring-rainbow' : 'ring-muted'}`}>
                  <img
                    src={group.userAvatar || userAvatarImg}
                    alt={group.userName}
                    className="sb-avatar-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = userAvatarImg;
                    }}
                  />
                </div>
                {group.stories.length > 1 && (
                  <span className="sb-count-badge">{group.stories.length}</span>
                )}
              </div>
              <span className="sb-card-name">{group.userName}</span>
            </div>
          );
        })}
      </div>

      {/* Story Creator Modal */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        storyGroups={storyGroups}
        initialGroupIndex={activeGroupIndex}
        currentUserId={currentUserId}
        onStoryDeleted={handleStoryDeleted}
        onPollVoted={handlePollVoted}
      />
    </>
  );
}
