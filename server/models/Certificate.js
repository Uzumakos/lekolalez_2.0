const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
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
  certificateNumber: {
    type: String,
    unique: true,
    default: () => `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
  },
  studentName: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: String,
    enum: ['Pass', 'Merit', 'Distinction'],
    default: 'Pass'
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  totalHours: {
    type: Number,
    default: 0
  },
  pdfUrl: {
    type: String,
    default: null
  },
  verificationUrl: {
    type: String
  },
  isValid: {
    type: Boolean,
    default: true
  },
  revokedAt: Date,
  revokedReason: String
}, {
  timestamps: true
});

// Generate verification URL before saving
certificateSchema.pre('save', function(next) {
  if (!this.verificationUrl) {
    this.verificationUrl = `/verify/${this.certificateNumber}`;
  }
  next();
});

// Indexes
certificateSchema.index({ user: 1, course: 1 }, { unique: true });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ issuedAt: -1 });

// Static method to verify certificate
certificateSchema.statics.verify = async function(certificateNumber) {
  const certificate = await this.findOne({ certificateNumber })
    .populate('user', 'firstName lastName')
    .populate('course', 'title');

  if (!certificate) {
    return { valid: false, message: 'Certificate not found' };
  }

  if (!certificate.isValid) {
    return {
      valid: false,
      message: 'Certificate has been revoked',
      revokedAt: certificate.revokedAt,
      reason: certificate.revokedReason
    };
  }

  return {
    valid: true,
    certificate: {
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      completionDate: certificate.completionDate,
      certificateNumber: certificate.certificateNumber,
      grade: certificate.grade
    }
  };
};

module.exports = mongoose.model('Certificate', certificateSchema);
