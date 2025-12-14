const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    monthly: {
      type: Number,
      default: 0
    },
    yearly: {
      type: Number,
      default: 0
    }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  features: [{
    text: {
      type: String,
      required: true
    },
    included: {
      type: Boolean,
      default: true
    },
    highlight: {
      type: Boolean,
      default: false
    }
  }],
  limits: {
    coursesPerMonth: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    certificatesPerMonth: {
      type: Number,
      default: -1
    },
    downloadableResources: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    offlineAccess: {
      type: Boolean,
      default: false
    },
    aiAssistant: {
      type: Boolean,
      default: false
    }
  },
  badge: {
    type: String,
    enum: ['none', 'popular', 'best-value', 'new'],
    default: 'none'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  trialDays: {
    type: Number,
    default: 0
  },
  stripeProductId: String,
  stripePriceIdMonthly: String,
  stripePriceIdYearly: String
}, {
  timestamps: true
});

// Generate slug from name
pricingPlanSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  this.isFree = this.price.monthly === 0 && this.price.yearly === 0;
  next();
});

// Index
pricingPlanSchema.index({ order: 1 });
pricingPlanSchema.index({ isActive: 1 });

// Static to get all active plans
pricingPlanSchema.statics.getActivePlans = async function() {
  return await this.find({ isActive: true }).sort({ order: 1 });
};

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
