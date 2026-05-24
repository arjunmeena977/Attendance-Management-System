/**
 * seed.js — Creates demo users for testing AttendPro
 * Run: node src/seed.js  (from /backend directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const DEMO_USERS = [
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'demo123',
    role: 'admin',
    department: 'Management',
  },
  {
    name: 'Manager User',
    email: 'manager@demo.com',
    password: 'demo123',
    role: 'manager',
    department: 'Engineering',
  },
  {
    name: 'Employee One',
    email: 'employee@demo.com',
    password: 'demo123',
    role: 'employee',
    department: 'Engineering',
  },
  {
    name: 'Alice Johnson',
    email: 'alice@demo.com',
    password: 'demo123',
    role: 'employee',
    department: 'Engineering',
  },
  {
    name: 'Bob Smith',
    email: 'bob@demo.com',
    password: 'demo123',
    role: 'employee',
    department: 'Design',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find manager to assign employees under them
    let managerId = null;

    for (const userData of DEMO_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        if (userData.role === 'manager') managerId = existing._id;
        continue;
      }

      const user = await User.create(userData);
      console.log(`✅ Created: ${userData.email} (${userData.role})`);

      if (userData.role === 'manager') managerId = user._id;
    }

    // Assign manager to employees
    if (managerId) {
      await User.updateMany(
        { role: 'employee' },
        { managerId }
      );
      console.log('✅ Assigned manager to all employees');
    }

    console.log('\n🎉 Seed complete! Demo accounts:');
    console.log('  Admin:    admin@demo.com    / demo123');
    console.log('  Manager:  manager@demo.com  / demo123');
    console.log('  Employee: employee@demo.com / demo123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
