const mongoose = require('mongoose');
const MediaAlbum = require('../models/MediaAlbum');

const parseImagesFromBody = (body) => {
  if (Array.isArray(body.images) && body.images.length > 0) {
    return body.images
      .filter((img) => img && String(img.url || '').trim())
      .map((img) => ({
        title: String(img.title || '').trim() || 'Photo',
        url: String(img.url).trim(),
        thumbnail: String(img.thumbnail || img.url || '').trim(),
      }));
  }
  const raw = String(body.imagesText || '');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const pipe = line.indexOf('|');
      if (pipe > -1) {
        return {
          title: line.slice(0, pipe).trim() || `Photo ${idx + 1}`,
          url: line.slice(pipe + 1).trim(),
          thumbnail: line.slice(pipe + 1).trim(),
        };
      }
      return { title: `Photo ${idx + 1}`, url: line, thumbnail: line };
    });
};

exports.getMediaAlbumsAdmin = async (req, res) => {
  try {
    const albums = await MediaAlbum.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return res.json({ albums });
  } catch (err) {
    console.error('getMediaAlbumsAdmin error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createMediaAlbum = async (req, res) => {
  try {
    const { title, coverImageUrl, published, featured, sortOrder } = req.body || {};
    if (!title || !coverImageUrl) {
      return res.status(400).json({ message: 'Title and cover image URL are required' });
    }
    const images = parseImagesFromBody(req.body);
    const album = await MediaAlbum.create({
      title: String(title).trim(),
      coverImageUrl: String(coverImageUrl).trim(),
      images,
      published: Boolean(published),
      featured: Boolean(featured),
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    });
    return res.status(201).json({ album });
  } catch (err) {
    console.error('createMediaAlbum error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMediaAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid album ID' });
    }
    const { title, coverImageUrl, published, featured, sortOrder } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (coverImageUrl !== undefined) updates.coverImageUrl = String(coverImageUrl).trim();
    if (published !== undefined) updates.published = Boolean(published);
    if (featured !== undefined) updates.featured = Boolean(featured);
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder) || 0;
    if (req.body.images !== undefined || req.body.imagesText !== undefined) {
      updates.images = parseImagesFromBody(req.body);
    }
    const album = await MediaAlbum.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!album) return res.status(404).json({ message: 'Album not found' });
    return res.json({ album });
  } catch (err) {
    console.error('updateMediaAlbum error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMediaAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid album ID' });
    }
    const album = await MediaAlbum.findByIdAndDelete(id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    return res.json({ message: 'Album deleted' });
  } catch (err) {
    console.error('deleteMediaAlbum error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
