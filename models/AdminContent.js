const mongoose = require('mongoose');

const adminContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['news', 'press', 'events', 'careers', 'insights'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    ctaText: { type: String, trim: true },
    ctaLink: { type: String, trim: true },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    eventDate: { type: Date },
    location: { type: String, trim: true },
    applicationEmail: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    category: { type: String, trim: true },
    department: { type: String, trim: true },
    employmentType: { type: String, trim: true },
    experienceLevel: { type: String, trim: true },
    salaryRange: { type: String, trim: true },
    responsibilities: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminContent', adminContentSchema);
