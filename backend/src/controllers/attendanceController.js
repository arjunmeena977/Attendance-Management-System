const Attendance = require('../models/Attendance');
const User = require('../models/User');
const logger = require('../config/logger');

// Helper: get today's date string YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Helper: calculate hours between two dates
const calcHours = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
};

// @desc    Punch In
// @route   POST /api/attendance/punch-in
// @access  Employee
const punchIn = async (req, res) => {
  const { latitude, longitude, selfie } = req.body;
  const userId = req.user._id;
  const date = getTodayDate();

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Location is required.' });
  }
  if (!selfie) {
    return res.status(400).json({ success: false, message: 'Selfie is required.' });
  }

  // Check if already punched in today
  let attendance = await Attendance.findOne({ userId, date });

  if (attendance && attendance.punchIn && attendance.punchIn.time) {
    return res.status(400).json({ success: false, message: 'Already punched in today.' });
  }

  if (!attendance) {
    attendance = new Attendance({ userId, date });
  }

  attendance.punchIn = {
    time: new Date(),
    location: { latitude, longitude },
    selfie,
  };
  attendance.shiftStatus = 'ongoing';

  await attendance.save();
  logger.info(`User ${userId} punched in at ${new Date().toISOString()}`);

  res.status(201).json({ success: true, message: 'Punched in successfully.', attendance });
};

// @desc    Punch Out
// @route   POST /api/attendance/punch-out
// @access  Employee
const punchOut = async (req, res) => {
  const { latitude, longitude } = req.body;
  const userId = req.user._id;
  const date = getTodayDate();

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Location is required.' });
  }

  const attendance = await Attendance.findOne({ userId, date });

  if (!attendance || !attendance.punchIn || !attendance.punchIn.time) {
    return res.status(400).json({ success: false, message: 'You have not punched in today.' });
  }

  if (attendance.punchOut && attendance.punchOut.time) {
    return res.status(400).json({ success: false, message: 'Already punched out today.' });
  }

  const punchOutTime = new Date();
  const totalHours = calcHours(attendance.punchIn.time, punchOutTime);

  attendance.punchOut = { time: punchOutTime, location: { latitude, longitude } };
  attendance.totalHours = totalHours;
  attendance.shiftStatus = totalHours >= 8 ? 'completed' : 'incomplete';

  await attendance.save();
  logger.info(`User ${userId} punched out. Total: ${totalHours}h`);

  res.json({ success: true, message: 'Punched out successfully.', attendance });
};

// @desc    Get my attendance (employee)
// @route   GET /api/attendance/my
// @access  Employee
const getMyAttendance = async (req, res) => {
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user._id };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), records });
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Employee
const getTodayAttendance = async (req, res) => {
  const attendance = await Attendance.findOne({
    userId: req.user._id,
    date: getTodayDate(),
  });
  res.json({ success: true, attendance: attendance || null });
};

// @desc    Get team attendance (manager)
// @route   GET /api/attendance/team
// @access  Manager, Admin
const getTeamAttendance = async (req, res) => {
  const { date, startDate, endDate, page = 1, limit = 30 } = req.query;

  let userFilter = {};
  if (req.user.role === 'manager') {
    // Manager sees their team
    const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
    const ids = teamMembers.map((u) => u._id);
    userFilter = { userId: { $in: ids } };
  }

  const dateFilter = {};
  if (date) dateFilter.date = date;
  else if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = startDate;
    if (endDate) dateFilter.date.$lte = endDate;
  } else {
    dateFilter.date = getTodayDate();
  }

  const filter = { ...userFilter, ...dateFilter };
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('userId', 'name email department role')
      .populate('validatedBy', 'name')
      .sort({ date: -1, 'punchIn.time': -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), records });
};

// @desc    Get all attendance (admin)
// @route   GET /api/attendance/all
// @access  Admin
const getAllAttendance = async (req, res) => {
  const { date, startDate, endDate, userId, page = 1, limit = 30 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;

  if (date) filter.date = date;
  else if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('userId', 'name email department role')
      .populate('validatedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), records });
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
  const record = await Attendance.findById(req.params.id)
    .populate('userId', 'name email department role')
    .populate('validatedBy', 'name email');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Attendance record not found.' });
  }

  // Employees can only see their own records
  if (
    req.user.role === 'employee' &&
    record.userId._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  res.json({ success: true, record });
};

// @desc    Validate attendance (Manager/Admin)
// @route   PATCH /api/attendance/:id/validate
// @access  Manager, Admin
const validateAttendance = async (req, res) => {
  const { validationStatus, validationRemarks } = req.body;

  if (!['valid', 'invalid'].includes(validationStatus)) {
    return res.status(400).json({ success: false, message: 'Status must be valid or invalid.' });
  }

  const record = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      validationStatus,
      validationRemarks: validationRemarks || '',
      validatedBy: req.user._id,
      validatedAt: new Date(),
    },
    { new: true }
  ).populate('userId', 'name email');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  logger.info(`Attendance ${req.params.id} marked ${validationStatus} by ${req.user.email}`);
  res.json({ success: true, message: `Attendance marked as ${validationStatus}.`, record });
};

// @desc    Daily Report
// @route   GET /api/attendance/report/daily
// @access  All roles (filtered)
const getDailyReport = async (req, res) => {
  const { date = getTodayDate(), userId } = req.query;

  let filter = { date };

  if (req.user.role === 'employee') {
    filter.userId = req.user._id;
  } else if (req.user.role === 'manager') {
    const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
    const ids = teamMembers.map((u) => u._id);
    if (userId && ids.some((id) => id.toString() === userId)) {
      filter.userId = userId;
    } else {
      filter.userId = { $in: ids };
    }
  } else if (req.user.role === 'admin' && userId) {
    filter.userId = userId;
  }

  const records = await Attendance.find(filter)
    .populate('userId', 'name email department')
    .populate('validatedBy', 'name')
    .sort({ 'punchIn.time': 1 });

  const report = records.map((r) => ({
    id: r._id,
    employee: r.userId,
    date: r.date,
    punchIn: r.punchIn?.time || null,
    punchOut: r.punchOut?.time || null,
    selfie: r.punchIn?.selfie || null,
    location: r.punchIn?.location || null,
    totalHours: r.totalHours,
    shiftStatus: r.shiftStatus,
    validationStatus: r.validationStatus,
    validationRemarks: r.validationRemarks,
    overtimeStatus: r.overtimeRequest?.status || null,
  }));

  res.json({ success: true, date, report });
};

module.exports = {
  punchIn,
  punchOut,
  getMyAttendance,
  getTodayAttendance,
  getTeamAttendance,
  getAllAttendance,
  getAttendanceById,
  validateAttendance,
  getDailyReport,
};
