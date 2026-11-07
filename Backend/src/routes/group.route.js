const express = require('express');
const router = express.Router();
const {
  getAllGroups,
  joinGroup,
  leaveGroup,
  createGroup,
  getUserGroups,
  getGroupMembers,
} = require('../controller/group.controller');

router.get('/', getAllGroups);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);
router.post('/create', createGroup);
router.get('/my-groups/:userId', getUserGroups);
router.get('/:groupId/members', getGroupMembers);

module.exports = router;
