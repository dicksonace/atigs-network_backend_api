const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.5 },
  currency: { type: String, default: 'USD' },
  donorName: { type: String, default: 'Anonymous' },
  donorEmail: { type: String, required: true },
  paymentGateway: { type: String, enum: ['stripe', 'paystack'], required: true },
  paymentReference: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['pending', 'successful', 'failed', 'refunded'], 
    default: 'pending' 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);