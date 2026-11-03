const express = require('express');
const router = express.Router();
const {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  toggleFollow,
  getPendingRequests,
  getFollowers,
  getFollowing,
  getFollowingIds,
  getUserSocialCounts,
} = require('../controller/follow.controller');

// Send Follow Request (Status: pending)
router.post('/request/:targetUserId', sendFollowRequest);

// Accept Follow Request (Status: accepted)
router.post('/accept/:requesterId', acceptFollowRequest);

// Reject / Decline Follow Request
router.post('/reject/:requesterId', rejectFollowRequest);

// Cancel Sent Request
router.post('/cancel/:targetUserId', cancelFollowRequest);

// Unfollow
router.post('/unfollow/:targetUserId', unfollowUser);

// Legacy Follow / Unfollow Toggle
router.post('/toggle/:targetUserId', toggleFollow);

// Pending Incoming Follow Requests for a user
router.get('/requests/pending/:userId', getPendingRequests);

// Followers & Following Lists
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

// Quick array of followed IDs & pending IDs for current user
router.get('/following-ids/:userId', getFollowingIds);

// Profile Social Counts
router.get('/counts/:userId', getUserSocialCounts);

module.exports = router;
