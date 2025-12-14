const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'past_due', 'trialing', 'paused'],
    default: 'active'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelledAt: Date,
  cancelReason: String,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  trialStart: Date,
  trialEnd: Date,
  // Payment provider info
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'other']
    },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  // Billing history
  invoices: [{
    invoiceId: String,
    amount: Number,
    currency: String,
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded']
    },
    paidAt: Date,
    invoiceUrl: String
  }],
  metadata: {
    referralCode: String,
    campaignId: String,
    discountApplied: Number
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1 }, { unique: true });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return ['active', 'trialing'].includes(this.status) &&
         this.currentPeriodEnd > new Date();
};

// Cancel subscription
subscriptionSchema.methods.cancel = async function(reason, immediate = false) {
  this.cancelledAt = new Date();
  this.cancelReason = reason;

  if (immediate) {
    this.status = 'cancelled';
    this.currentPeriodEnd = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
  }

  return await this.save();
};

// Static to get user's active subscription
subscriptionSchema.statics.getActiveSubscription = async function(userId) {
  return await this.findOne({
    user: userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() }
  }).populate('plan');
};

// Static to check if user has premium access
subscriptionSchema.statics.hasPremiumAccess = async function(userId) {
  const subscription = await this.getActiveSubscription(userId);
  return subscription !== null;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
