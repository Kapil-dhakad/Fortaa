const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getPosts,
  createPost,
  likePost,
  updatePost,
  deletePost,
  getPostComments,
  addPostComment,
  likePostComment,
  deletePostComment,
  sharePost,
  getTrainers,
  getLeaders,
  getServices,
  getEvents,
  getGroups,
  getOpportunities,
} = require('../controller/dashboard.controller');

// Dashboard Overview / Stats
router.get('/overview', getDashboardOverview);

// Posts
router.get('/posts', getPosts);
router.post('/posts', createPost);
router.post('/posts/:id/like', likePost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Comments & Shares
router.get('/posts/:id/comments', getPostComments);
router.post('/posts/:id/comments', addPostComment);
router.post('/comments/:id/like', likePostComment);
router.delete('/comments/:id', deletePostComment);
router.post('/posts/:id/share', sharePost);

// Supporting Cards
router.get('/trainers', getTrainers);
router.get('/leaders', getLeaders);
router.get('/services', getServices);
router.get('/events', getEvents);
router.get('/groups', getGroups);
router.get('/opportunities', getOpportunities);

module.exports = router;
