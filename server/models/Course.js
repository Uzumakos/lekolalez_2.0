const mongoose = require('mongoose');

// Answer Option Schema (embedded in Question)
const answerOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Question Schema (embedded in QuizData)
const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'true-false', 'text'],
    default: 'single-choice'
  },
  options: [answerOptionSchema],
  correctAnswer: {
    type: String
  },
  explanation: {
    type: String
  },
  points: {
    type: Number,
    default: 1
  }
}, { _id: false });

// Quiz Data Schema (embedded in Lesson)
const quizDataSchema = new mongoose.Schema({
  questions: [questionSchema],
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number,
    default: null
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Lesson Schema (embedded in Module)
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'quiz', 'reading'],
    default: 'video'
  },
  duration: {
    type: String
  },
  videoUrl: {
    type: String
  },
  content: {
    type: String
  },
  quizData: quizDataSchema,
  order: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Module Schema (embedded in Course)
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  lessons: [lessonSchema],
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Main Course Schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course must have an instructor']
  },
  thumbnail: {
    type: String,
    default: null
  },
  videoPreview: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Machine Learning',
      'Business',
      'Marketing',
      'Design',
      'Language',
      'Personal Development',
      'Other'
    ]
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  language: {
    type: String,
    enum: ['en', 'fr', 'ht'],
    default: 'en'
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  modules: [moduleSchema],
  prerequisites: [{
    type: String,
    trim: true
  }],
  objectives: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  totalDuration: {
    type: String
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate total lessons before saving
courseSchema.pre('save', function(next) {
  let totalLessons = 0;
  this.modules.forEach(module => {
    totalLessons += module.lessons.length;
  });
  this.totalLessons = totalLessons;
  this.isFree = this.price === 0;
  next();
});

// Indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
