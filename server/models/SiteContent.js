const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'pricing', 'instructors', 'contact', 'home', 'faq', 'terms', 'privacy']
  },
  content: {
    // For About page
    heroTitle: String,
    heroSubtitle: String,
    mission: String,
    vision: String,
    story: String,
    values: [{
      title: String,
      description: String,
      icon: String
    }],
    team: [{
      name: String,
      role: String,
      bio: String,
      image: String,
      socialLinks: {
        linkedin: String,
        twitter: String
      }
    }],

    // For Contact page
    email: String,
    phone: String,
    address: String,
    supportHours: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String
    },

    // For Home page
    featuredCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    testimonials: [{
      name: String,
      role: String,
      content: String,
      avatar: String,
      rating: Number
    }],
    statistics: {
      totalStudents: Number,
      totalCourses: Number,
      totalInstructors: Number,
      countriesReached: Number
    },

    // For FAQ page
    faqs: [{
      question: String,
      answer: String,
      category: String,
      order: Number
    }],

    // Generic content fields
    title: String,
    subtitle: String,
    body: String,
    metaTitle: String,
    metaDescription: String,
    bannerImage: String
  },
  language: {
    type: String,
    enum: ['en', 'fr', 'ht'],
    default: 'en'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for section and language
siteContentSchema.index({ section: 1, language: 1 }, { unique: true });

// Static to get content by section and language
siteContentSchema.statics.getSection = async function(section, language = 'en') {
  let content = await this.findOne({ section, language, isPublished: true });

  // Fallback to English if language version not found
  if (!content && language !== 'en') {
    content = await this.findOne({ section, language: 'en', isPublished: true });
  }

  return content;
};

module.exports = mongoose.model('SiteContent', siteContentSchema);
