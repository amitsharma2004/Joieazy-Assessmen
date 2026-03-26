const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createGroup, getGroups, addMember, removeMember } = require('../controllers/groupController');

router.use(authenticate);

router.get('/', getGroups);                                // All: list groups
router.post('/', createGroup);                            // Student: create group
router.post('/:id/members', addMember);                   // Creator: add member
router.delete('/:id/members/:userId', removeMember);      // Creator: remove member

module.exports = router;
