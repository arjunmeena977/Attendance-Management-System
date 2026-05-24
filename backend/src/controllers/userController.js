const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
  const { role, department, page = 1, limit = 20, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: Number(page), users });
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).populate('managerId', 'name email');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user });
};

// @desc    Create user (Admin)
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
  const { name, email, password, role, department, managerId } = req.body;

  const user = await User.create({ name, email, password, role, department, managerId });
  logger.info(`Admin created user: ${email} (${role})`);
  res.status(201).json({ success: true, message: 'User created.', user });
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  const { name, role, department, managerId, isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, role, department, managerId, isActive },
    { new: true, runValidators: true }
  );

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  logger.info(`Admin updated user: ${user.email}`);
  res.json({ success: true, message: 'User updated.', user });
};

// @desc    Delete / Deactivate user (Admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  logger.info(`Admin deactivated user: ${user.email}`);
  res.json({ success: true, message: 'User deactivated.' });
};

// @desc    Get managers list (for assigning team)
// @route   GET /api/users/managers
// @access  Admin
const getManagers = async (req, res) => {
  const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('name email role department');
  res.json({ success: true, managers });
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getManagers };
