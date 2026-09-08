import express from 'express';
import jwt from 'jsonwebtoken';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, instructor } from '../middleware/auth.js';

const router = express.Router();

// Helper to optionally get user from token
const optionalAuth = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
};

// @route   GET /api/courses
// @desc    Get all courses (published for public, all for admin/instructor)
router.get('/', async (req, res) => {
  try {
    const { category, level, search, limit = 20, page = 1, includeUnpublished } = req.query;

    // Check if user is authenticated admin/instructor
    const user = await optionalAuth(req);
    const isAdminOrInstructor = user && (user.role === 'admin' || user.role === 'instructor');

    // Build query - show all courses for admin, only published for others
    const query = {};

    if (!isAdminOrInstructor || includeUnpublished !== 'true') {
      // For public users or when not explicitly requesting unpublished
      query.$or = [
        { isPublished: true },
        { status: 'published' }
      ];
    }

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$text = { $search: search };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName avatar title fullName')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Course.countDocuments(query);

    res.json({
      courses,
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

// @route   GET /api/courses/all
// @desc    Get all courses (admin/instructor)
router.get('/all', protect, instructor, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { instructor: req.user._id };

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName avatar title bio location');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/courses
// @desc    Create a course
router.post('/', protect, instructor, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id
    };

    const course = await Course.create(courseData);

    await course.populate('instructor', 'firstName lastName avatar');

    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
router.put('/:id', protect, instructor, async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName avatar');

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/courses/:id/publish
// @desc    Publish/unpublish a course
router.put('/:id/publish', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.isPublished = !course.isPublished;
    course.status = course.isPublished ? 'published' : 'draft';
    if (course.isPublished && !course.publishedAt) {
      course.publishedAt = new Date();
    }

    await course.save();

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
router.delete('/:id', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await course.deleteOne();

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
