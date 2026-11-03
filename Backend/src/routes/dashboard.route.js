const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getPosts,
  createPost,
  likePost,
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

// Supporting Cards
router.get('/trainers', getTrainers);
router.get('/leaders', getLeaders);
router.get('/services', getServices);
router.get('/events', getEvents);
router.get('/groups', getGroups);
router.get('/opportunities', getOpportunities);

module.exports = router;
