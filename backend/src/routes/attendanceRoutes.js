const express = require('express');
const router = express.Router();
const {
  punchIn,
  punchOut,
  getMyAttendance,
  getTodayAttendance,
  getTeamAttendance,
  getAllAttendance,
  getAttendanceById,
  validateAttendance,
  getDailyReport,
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/punch-in', authorize('employee'), punchIn);
router.post('/punch-out', authorize('employee'), punchOut);
router.get('/my', authorize('employee'), getMyAttendance);
router.get('/today', authorize('employee'), getTodayAttendance);

// Manager + Admin routes
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);
router.patch('/:id/validate', authorize('manager', 'admin'), validateAttendance);

// Admin only
router.get('/all', authorize('admin'), getAllAttendance);

// Report — all roles (filtered by role in controller)
router.get('/report/daily', getDailyReport);

// Single record
router.get('/:id', getAttendanceById);

module.exports = router;
