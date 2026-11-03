const express = require('express');
const router = express.Router();
const {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowingIds,
  getUserSocialCounts,
} = require('../controller/follow.controller');

// Follow / Unfollow Toggle
router.post('/toggle/:targetUserId', toggleFollow);

// Followers & Following Lists
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

// Quick array of followed IDs for the current user (e.g. [2, 5, 8])
router.get('/following-ids/:userId', getFollowingIds);

// Counts (Followers, Following, Posts)
router.get('/counts/:userId', getUserSocialCounts);

module.exports = router;
