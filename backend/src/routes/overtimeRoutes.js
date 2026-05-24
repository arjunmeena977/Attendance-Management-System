const express = require('express');
const router = express.Router();
const {
  requestOvertime,
  getPendingOvertime,
  getAllOvertime,
  getMyOvertime,
  reviewOvertime,
} = require('../controllers/overtimeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/request', authorize('employee'), requestOvertime);
router.get('/my', authorize('employee'), getMyOvertime);
router.get('/pending', authorize('manager', 'admin'), getPendingOvertime);
router.get('/all', authorize('manager', 'admin'), getAllOvertime);
router.patch('/:id/review', authorize('manager', 'admin'), reviewOvertime);

module.exports = router;
