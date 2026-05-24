const Attendance = require('../models/Attendance');
const logger = require('../config/logger');

// @desc    Request Overtime
// @route   POST /api/overtime/request
// @access  Employee
const requestOvertime = async (req, res) => {
  const { requestedHours, reason } = req.body;
  const userId = req.user._id;

  if (!requestedHours || requestedHours <= 0) {
    return res.status(400).json({ success: false, message: 'Valid overtime hours required.' });
  }

  const date = new Date().toISOString().split('T')[0];
  const attendance = await Attendance.findOne({ userId, date });

  if (!attendance) {
    return res.status(400).json({ success: false, message: 'No attendance record for today.' });
  }

  if (attendance.overtimeRequest && attendance.overtimeRequest.requested) {
    return res.status(400).json({ success: false, message: 'Overtime already requested for today.' });
  }

  attendance.overtimeRequest = {
    requested: true,
    requestedHours: Number(requestedHours),
    reason: reason || '',
    status: 'pending',
  };

  await attendance.save();
  logger.info(`Overtime requested by ${userId} for ${date} — ${requestedHours}h`);

  res.status(201).json({ success: true, message: 'Overtime request submitted.', attendance });
};

// @desc    Get pending OT requests (Manager/Admin)
// @route   GET /api/overtime/pending
// @access  Manager, Admin
const getPendingOvertime = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { 'overtimeRequest.requested': true, 'overtimeRequest.status': 'pending' };

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('userId', 'name email department role managerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), records });
};

// @desc    Get all OT requests
// @route   GET /api/overtime/all
// @access  Manager, Admin
const getAllOvertime = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { 'overtimeRequest.requested': true };
  if (status) filter['overtimeRequest.status'] = status;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('userId', 'name email department')
      .populate('overtimeRequest.reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), records });
};

// @desc    Get my OT requests (employee)
// @route   GET /api/overtime/my
// @access  Employee
const getMyOvertime = async (req, res) => {
  const records = await Attendance.find({
    userId: req.user._id,
    'overtimeRequest.requested': true,
  }).sort({ date: -1 });

  res.json({ success: true, records });
};

// @desc    Review OT (Approve/Reject)
// @route   PATCH /api/overtime/:id/review
// @access  Manager, Admin
const reviewOvertime = async (req, res) => {
  const { status, remarks } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
  }

  const attendance = await Attendance.findById(req.params.id).populate('userId', 'name email');

  if (!attendance) {
    return res.status(404).json({ success: false, message: 'Attendance record not found.' });
  }

  if (!attendance.overtimeRequest || !attendance.overtimeRequest.requested) {
    return res.status(400).json({ success: false, message: 'No overtime request on this record.' });
  }

  attendance.overtimeRequest.status = status;
  attendance.overtimeRequest.reviewedBy = req.user._id;
  attendance.overtimeRequest.reviewedAt = new Date();
  attendance.overtimeRequest.remarks = remarks || '';

  await attendance.save();

  logger.info(`Overtime ${req.params.id} ${status} by ${req.user.email}`);
  res.json({ success: true, message: `Overtime ${status}.`, attendance });
};

module.exports = { requestOvertime, getPendingOvertime, getAllOvertime, getMyOvertime, reviewOvertime };
