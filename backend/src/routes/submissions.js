const router = require('express').Router();
const { authenticate, adminOnly, studentOnly } = require('../middleware/auth');
const { confirmSubmission, getSubmissions, getAnalytics } = require('../controllers/submissionController');

router.use(authenticate);

router.post('/confirm', studentOnly, confirmSubmission);     // Student: two-step confirm
router.get('/', getSubmissions);                             // Admin/Student: list
router.get('/analytics', adminOnly, getAnalytics);          // Admin: summary analytics

module.exports = router;
