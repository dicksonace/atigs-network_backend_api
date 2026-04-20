const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    url: { type: String, required: true, trim: true },
    thumbnail: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const mediaAlbumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    coverImageUrl: { type: String, required: true, trim: true },
    images: { type: [galleryImageSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaAlbum', mediaAlbumSchema);
