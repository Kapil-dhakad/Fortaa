const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminDashboardStats,
  getAdminRecentActivities,
  getAdminLatestUsers,
  getAdminTopCategories,
  getAdminLatestCompanies,
  getAdminRecentEvents,
  getAdminPlatformStats,
} = require('../controller/admin.controller');

// Admin Login Endpoint
router.post('/login', adminLogin);

// Admin Dashboard Stats (Total Users, Companies, Products, Events)
router.get('/stats', getAdminDashboardStats);

// Recent Activities feed
router.get('/recent-activities', getAdminRecentActivities);

// Latest Users / Leads table
router.get('/latest-users', getAdminLatestUsers);

// Top Categories
router.get('/top-categories', getAdminTopCategories);

// Latest Companies / Groups
router.get('/latest-companies', getAdminLatestCompanies);

// Recent Events
router.get('/recent-events', getAdminRecentEvents);

// Platform Statistics
router.get('/platform-stats', getAdminPlatformStats);

module.exports = router;
