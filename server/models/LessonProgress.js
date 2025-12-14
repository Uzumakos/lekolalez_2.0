const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  moduleIndex: {
    type: Number,
    required: true
  },
  lessonIndex: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  watchTime: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  lastPosition: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [5000, 'Notes cannot exceed 5000 characters']
  }
}, {
  timestamps: true
});

// Compound index for unique progress per lesson per user
lessonProgressSchema.index({ user: 1, course: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ enrollment: 1 });
lessonProgressSchema.index({ user: 1, course: 1 });

// Static method to calculate course progress
lessonProgressSchema.statics.calculateCourseProgress = async function(userId, courseId) {
  const Course = mongoose.model('Course');
  const course = await Course.findById(courseId);

  if (!course) return 0;

  let totalLessons = 0;
  course.modules.forEach(module => {
    totalLessons += module.lessons.length;
  });

  if (totalLessons === 0) return 0;

  const completedCount = await this.countDocuments({
    user: userId,
    course: courseId,
    isCompleted: true
  });

  return Math.round((completedCount / totalLessons) * 100);
};

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
