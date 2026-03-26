const router = require('express').Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');

// All assignment routes require authentication
router.use(authenticate);

router.get('/', getAssignments);              // GET all (role-filtered)
router.get('/:id', getAssignment);            // GET single
router.post('/', adminOnly, createAssignment);         // Admin: create
router.put('/:id', adminOnly, updateAssignment);       // Admin: edit
router.delete('/:id', adminOnly, deleteAssignment);    // Admin: delete

module.exports = router;
