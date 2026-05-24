const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const user = await User.create({ name, email, password, role: role || 'employee', department });
  const token = generateToken(user._id);

  logger.info(`New user registered: ${email} (${user.role})`);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user,
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = generateToken(user._id);
  logger.info(`User logged in: ${email}`);

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  res.json({ success: true, message: 'Login successful.', token, user: userObj });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('managerId', 'name email');
  res.json({ success: true, user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { name, department } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, department },
    { new: true, runValidators: true }
  );
  res.json({ success: true, message: 'Profile updated.', user });
};

module.exports = { register, login, getMe, updateProfile };
