const express = require('express');
const router = express.Router();
const {
  getActiveStories,
  createStory,
  recordStoryView,
  voteStoryPoll,
  deleteStory,
  getStoryViewers,
  toggleStoryLike,
  replyToStory,
} = require('../controller/story.controller');

// Get all active stories grouped by user
router.get('/', getActiveStories);

// Create new story (photo, video, text, poll)
router.post('/', createStory);

// Record story view
router.post('/:id/view', recordStoryView);

// Get story viewers list
router.get('/:id/viewers', getStoryViewers);

// Toggle story like
router.post('/:id/like', toggleStoryLike);

// Reply to a story
router.post('/:id/reply', replyToStory);

// Vote on a story poll
router.post('/:id/poll-vote', voteStoryPoll);

// Delete story
router.delete('/:id', deleteStory);

module.exports = router;
