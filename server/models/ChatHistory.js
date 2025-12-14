const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [chatMessageSchema],
  context: {
    enrolledCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    currentCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'fr', 'ht'],
      default: 'en'
    },
    userProgress: mongoose.Schema.Types.Mixed
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
chatHistorySchema.index({ user: 1, sessionId: 1 });
chatHistorySchema.index({ user: 1, lastMessageAt: -1 });
chatHistorySchema.index({ sessionId: 1 }, { unique: true });

// Add message helper
chatHistorySchema.methods.addMessage = async function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  this.lastMessageAt = new Date();
  this.messageCount = this.messages.length;
  return await this.save();
};

// Get recent messages
chatHistorySchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Static to get or create session
chatHistorySchema.statics.getOrCreateSession = async function(userId, sessionId, context = {}) {
  let session = await this.findOne({ user: userId, sessionId });

  if (!session) {
    session = await this.create({
      user: userId,
      sessionId,
      context,
      messages: []
    });
  }

  return session;
};

// Static to get user's chat history
chatHistorySchema.statics.getUserHistory = async function(userId, limit = 10) {
  return await this.find({ user: userId })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .select('sessionId lastMessageAt messageCount');
};

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
