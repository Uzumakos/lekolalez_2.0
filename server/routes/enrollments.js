import express from 'express';
import Enrollment from '../models/Enrollment.js';
import LessonProgress from '../models/LessonProgress.js';
import Course from '../models/Course.js';
import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/enrollments
// @desc    Get current user's enrollments
router.get('/', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'firstName lastName avatar' }
      })
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/enrollments/:courseId
// @desc    Enroll in a course
router.post('/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: req.params.courseId,
      status: 'active'
    });

    // Increment enrollment count
    course.enrollmentCount += 1;
    await course.save();

    // Create notification
    await Notification.notify(req.user._id, {
      title: 'Enrollment Successful!',
      message: `You are now enrolled in "${course.title}"`,
      type: 'enrollment',
      link: `/courses/${course._id}`,
      metadata: { courseId: course._id }
    });

    await enrollment.populate({
      path: 'course',
      populate: { path: 'instructor', select: 'firstName lastName avatar' }
    });

    res.status(201).json({ enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/enrollments/:courseId/progress
// @desc    Get lesson progress for a course
router.get('/:courseId/progress', protect, async (req, res) => {
  try {
    const progress = await LessonProgress.find({
      user: req.user._id,
      course: req.params.courseId
    });

    const completedLessonIds = progress
      .filter(p => p.isCompleted)
      .map(p => p.lessonId.toString());

    res.json({ completedLessonIds, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/enrollments/:courseId/lessons/:lessonId/complete
// @desc    Mark a lesson as complete
router.post('/:courseId/lessons/:lessonId/complete', protect, async (req, res) => {
  try {
    const { moduleIndex, lessonIndex, moduleId } = req.body;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    let lessonProgress = await LessonProgress.findOne({
      user: req.user._id,
      course: req.params.courseId,
      lessonId: req.params.lessonId
    });

    if (lessonProgress) {
      lessonProgress.isCompleted = !lessonProgress.isCompleted;
      lessonProgress.completedAt = lessonProgress.isCompleted ? new Date() : null;
    } else {
      lessonProgress = new LessonProgress({
        user: req.user._id,
        enrollment: enrollment._id,
        course: req.params.courseId,
        moduleId: moduleId || req.params.lessonId,
        lessonId: req.params.lessonId,
        moduleIndex: moduleIndex || 0,
        lessonIndex: lessonIndex || 0,
        isCompleted: true,
        completedAt: new Date()
      });
    }

    await lessonProgress.save();

    // Calculate overall progress
    const courseProgress = await LessonProgress.calculateCourseProgress(
      req.user._id,
      req.params.courseId
    );

    enrollment.progress = courseProgress;
    enrollment.lastAccessedAt = new Date();
    enrollment.lastAccessedLesson = { moduleIndex, lessonIndex };

    // Check if course is completed
    if (courseProgress === 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();

      // Create certificate
      const course = await Course.findById(req.params.courseId)
        .populate('instructor', 'firstName lastName');

      await Certificate.create({
        user: req.user._id,
        course: req.params.courseId,
        enrollment: enrollment._id,
        studentName: req.user.fullName,
        courseTitle: course.title,
        instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`
      });

      await Notification.notify(req.user._id, {
        title: 'Course Completed!',
        message: `Congratulations! You completed "${course.title}"`,
        type: 'completion',
        link: `/courses/${course._id}`
      });
    }

    await enrollment.save();

    res.json({
      lessonProgress,
      courseProgress,
      isCompleted: lessonProgress.isCompleted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/enrollments/:courseId/certificate
// @desc    Get certificate for completed course
router.get('/:courseId/certificate', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
