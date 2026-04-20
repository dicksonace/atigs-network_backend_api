const mongoose = require('mongoose');

const membershipSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },
    planKey: { type: String, required: true, trim: true },
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.5 },
    currency: { type: String, default: 'GHS' },
    paymentGateway: { type: String, enum: ['paystack'], default: 'paystack' },
    paymentReference: { type: String, required: true, unique: true, trim: true },
    paystackAccessCode: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
    },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipSubscription', membershipSubscriptionSchema);
