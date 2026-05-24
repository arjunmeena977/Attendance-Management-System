const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  { _id: false }
);

const punchSchema = new mongoose.Schema(
  {
    time: { type: Date, default: null },
    location: { type: locationSchema, default: null },
    selfie: { type: String, default: null }, // base64 string
  },
  { _id: false }
);

const overtimeRequestSchema = new mongoose.Schema(
  {
    requested: { type: Boolean, default: false },
    requestedHours: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    punchIn: { type: punchSchema, default: {} },
    punchOut: { type: punchSchema, default: {} },
    totalHours: { type: Number, default: 0 },
    shiftStatus: {
      type: String,
      enum: ['completed', 'incomplete', 'ongoing', 'absent'],
      default: 'absent',
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
    },
    validationRemarks: { type: String, default: '' },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt: { type: Date, default: null },
    overtimeRequest: { type: overtimeRequestSchema, default: {} },
  },
  { timestamps: true }
);

// Compound unique index: one attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
