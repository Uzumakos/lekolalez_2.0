import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/admin/invite
// @desc    Invite a new admin by email
router.post('/invite', protect, admin, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update their role to admin if not already
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'User is already an admin' });
      }

      user.role = 'admin';
      await user.save();

      // Notify the user
      await Notification.notify(user._id, {
        title: 'Admin Access Granted',
        message: 'You have been granted administrator privileges.',
        type: 'system',
        link: '/settings'
      });

      return res.json({
        message: 'Existing user has been promoted to admin',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    }

    // User doesn't exist - create invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create a pending admin user
    user = await User.create({
      email,
      password: crypto.randomBytes(16).toString('hex'), // Temporary password
      firstName: 'Pending',
      lastName: 'Admin',
      role: 'admin',
      isActive: false,
      inviteToken,
      inviteExpires
    });

    // In a real app, you would send an email here with the invite link
    // For now, we'll return the token (in production, send via email only)
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite/${inviteToken}`;

    res.status(201).json({
      message: 'Admin invitation sent successfully',
      // Remove inviteLink in production - should only be sent via email
      inviteLink,
      email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/accept-invite/:token
// @desc    Accept admin invitation and set password
router.post('/accept-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      inviteToken: token,
      inviteExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    // Update user with new password and activate
    user.password = password;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.isActive = true;
    user.inviteToken = undefined;
    user.inviteExpires = undefined;

    await user.save();

    res.json({
      message: 'Account activated successfully. You can now login.',
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
router.put('/users/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent self-demotion
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify user of role change
    await Notification.notify(user._id, {
      title: 'Role Updated',
      message: `Your role has been changed to ${role}.`,
      type: 'system'
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
