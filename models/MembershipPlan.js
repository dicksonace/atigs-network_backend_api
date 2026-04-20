const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'USD', trim: true },
    billingPeriod: { type: String, default: 'yearly', trim: true },
    description: { type: String, trim: true },
    features: [{ type: String, trim: true }],
    isRecommended: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
