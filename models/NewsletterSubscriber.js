// models/NewsletterSubscriber.js
const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please use a valid email address']
  },
  fullName: {
    type: String,
    trim: true,
    default: '' // Makes it optional with empty string as default
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Add index for better query performance
newsletterSubscriberSchema.index({ email: 1 }, { unique: true });
newsletterSubscriberSchema.index({ isActive: 1 });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);