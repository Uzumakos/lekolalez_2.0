const mongoose = require('mongoose');

// Individual answer schema
const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionText: String,
  selectedAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  correctAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsPossible: {
    type: Number,
    default: 1
  }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
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
  moduleIndex: Number,
  lessonIndex: Number,
  answers: [answerSchema],
  score: {
    earned: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passingScore: {
    type: Number,
    default: 70
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
quizAttemptSchema.index({ user: 1, course: 1, lessonId: 1 });
quizAttemptSchema.index({ user: 1, enrollment: 1 });
quizAttemptSchema.index({ completedAt: -1 });

// Static to get best attempt for a quiz
quizAttemptSchema.statics.getBestAttempt = async function(userId, lessonId) {
  return await this.findOne({
    user: userId,
    lessonId: lessonId
  }).sort({ percentage: -1 });
};

// Static to get attempt count
quizAttemptSchema.statics.getAttemptCount = async function(userId, lessonId) {
  return await this.countDocuments({
    user: userId,
    lessonId: lessonId
  });
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
