const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedLesson: {
    moduleIndex: Number,
    lessonIndex: Number
  },
  paymentInfo: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    transactionId: String,
    paymentMethod: String,
    paidAt: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure unique enrollment per user per course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Virtual to populate lesson progress
enrollmentSchema.virtual('lessonProgress', {
  ref: 'LessonProgress',
  localField: '_id',
  foreignField: 'enrollment'
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
