const express = require('express');
const router = express.Router();
const {
  getPublicAccountTypes,
  getAllAccountTypes,
  createAccountType,
  updateAccountType,
  deleteAccountType,
} = require('../controller/accountType.controller');

// Public route for Signup Page
router.get('/', getPublicAccountTypes);

// Admin routes for managing account types
router.get('/all', getAllAccountTypes);
router.post('/', createAccountType);
router.put('/:id', updateAccountType);
router.delete('/:id', deleteAccountType);

module.exports = router;
