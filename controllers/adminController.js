const User = require('../models/User');
const AdminContent = require('../models/AdminContent');
const MembershipSubscription = require('../models/MembershipSubscription');
const Donation = require('../models/Donation');
const AppSetting = require('../models/AppSetting');
const MembershipPlan = require('../models/MembershipPlan');
const mongoose = require('mongoose');

/**
 * Get all users (paginated)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password -refreshTokens -verificationToken -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a user/member by ID
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const allowedContentTypes = new Set(['news', 'press', 'events', 'careers', 'insights']);

const normalizeType = (value = '') => value.toString().trim().toLowerCase();

const parseLineList = (value) => {
  if (Array.isArray(value)) {
    return value.map((line) => line?.toString().trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split('\n').map((line) => line.trim()).filter(Boolean);
  }
  return [];
};

const extractContentPayload = (body = {}) => ({
  title: body.title?.toString().trim(),
  summary: body.summary?.toString().trim() || '',
  body: body.body?.toString().trim(),
  ctaText: body.ctaText?.toString().trim() || '',
  ctaLink: body.ctaLink?.toString().trim() || '',
  published: Boolean(body.published),
  featured: Boolean(body.featured),
  tags: Array.isArray(body.tags)
    ? body.tags.map((tag) => tag?.toString().trim()).filter(Boolean)
    : [],
  eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
  location: body.location?.toString().trim() || '',
  applicationEmail: body.applicationEmail?.toString().trim() || '',
  imageUrl: body.imageUrl?.toString().trim() || '',
  category: body.category?.toString().trim().toLowerCase() || '',
  department: body.department?.toString().trim() || '',
  employmentType: body.employmentType?.toString().trim() || '',
  experienceLevel: body.experienceLevel?.toString().trim() || '',
  salaryRange: body.salaryRange?.toString().trim() || '',
  responsibilities: parseLineList(body.responsibilities),
  requirements: parseLineList(body.requirements),
});

exports.getContentByType = async (req, res) => {
  try {
    const type = normalizeType(req.params.type);
    if (!allowedContentTypes.has(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AdminContent.find({ type }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminContent.countDocuments({ type }),
    ]);

    return res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get content by type error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createContent = async (req, res) => {
  try {
    const type = normalizeType(req.params.type);
    if (!allowedContentTypes.has(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const payload = extractContentPayload(req.body);
    if (!payload.title || !payload.body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    if (type === 'events' && payload.eventDate && Number.isNaN(payload.eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }

    if (type === 'careers' && payload.applicationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.applicationEmail)) {
      return res.status(400).json({ message: 'Invalid application email' });
    }

    const item = await AdminContent.create({ ...payload, type });
    return res.status(201).json({ item });
  } catch (err) {
    console.error('Create content error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const type = normalizeType(req.params.type);
    const { id } = req.params;

    if (!allowedContentTypes.has(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid content ID' });
    }

    const payload = extractContentPayload(req.body);
    if (!payload.title || !payload.body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    if (type === 'events' && payload.eventDate && Number.isNaN(payload.eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }

    if (type === 'careers' && payload.applicationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.applicationEmail)) {
      return res.status(400).json({ message: 'Invalid application email' });
    }

    const item = await AdminContent.findOneAndUpdate(
      { _id: id, type },
      { $set: payload },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    return res.json({ item });
  } catch (err) {
    console.error('Update content error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const type = normalizeType(req.params.type);
    const { id } = req.params;

    if (!allowedContentTypes.has(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid content ID' });
    }

    const item = await AdminContent.findOneAndDelete({ _id: id, type });
    if (!item) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    return res.json({ message: 'Content item deleted successfully' });
  } catch (err) {
    console.error('Delete content error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminPaymentsOverview = async (req, res) => {
  try {
    const [donations, memberships] = await Promise.all([
      Donation.find().sort({ createdAt: -1 }).limit(100),
      MembershipSubscription.find().sort({ createdAt: -1 }).limit(100),
    ]);

    return res.json({
      donations,
      memberships,
      totals: {
        donations: donations.length,
        memberships: memberships.length,
      },
    });
  } catch (error) {
    console.error('Get admin payments overview error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMembersList = async (req, res) => {
  try {
    const members = await User.find({ role: { $in: ['premium', 'admin'] } })
      .select('-password -refreshTokens -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    return res.json({ members, total: members.length });
  } catch (error) {
    console.error('Get members list error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getExchangeRateSetting = async (req, res) => {
  try {
    const fallbackRate = Number(process.env.USD_TO_GHS || 15);
    const setting = await AppSetting.findOne({ key: 'USD_TO_GHS' });
    const rate =
      Number.isFinite(Number(setting?.value)) && Number(setting?.value) > 0
        ? Number(setting?.value)
        : fallbackRate;
    return res.json({ key: 'USD_TO_GHS', rate });
  } catch (error) {
    console.error('Get exchange rate setting error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateExchangeRateSetting = async (req, res) => {
  try {
    const rate = Number(req.body?.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      return res.status(400).json({ message: 'A valid positive rate is required' });
    }

    const setting = await AppSetting.findOneAndUpdate(
      { key: 'USD_TO_GHS' },
      {
        $set: {
          value: rate,
          description: 'Admin managed USD to GHS conversion rate',
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ key: setting.key, rate: Number(setting.value) });
  } catch (error) {
    console.error('Update exchange rate setting error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMembershipPlansAdmin = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ amount: 1 });
    return res.json({ plans });
  } catch (error) {
    console.error('Get membership plans admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createMembershipPlanAdmin = async (req, res) => {
  try {
    const { key, name, amount, currency = 'USD', billingPeriod = 'yearly', description = '', features = [], isRecommended = false, active = true } = req.body || {};
    if (!key || !name || !amount) {
      return res.status(400).json({ message: 'Key, name and amount are required' });
    }

    const plan = await MembershipPlan.create({
      key: String(key).trim().toLowerCase(),
      name: String(name).trim(),
      amount: Number(amount),
      currency: String(currency).trim().toUpperCase(),
      billingPeriod: String(billingPeriod).trim().toLowerCase(),
      description: String(description || '').trim(),
      features: Array.isArray(features) ? features.map((f) => String(f).trim()).filter(Boolean) : [],
      isRecommended: Boolean(isRecommended),
      active: Boolean(active),
    });

    return res.status(201).json({ plan });
  } catch (error) {
    console.error('Create membership plan admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMembershipPlanAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    const updates = req.body || {};
    const payload = {
      ...(updates.key ? { key: String(updates.key).trim().toLowerCase() } : {}),
      ...(updates.name ? { name: String(updates.name).trim() } : {}),
      ...(updates.amount !== undefined ? { amount: Number(updates.amount) } : {}),
      ...(updates.currency ? { currency: String(updates.currency).trim().toUpperCase() } : {}),
      ...(updates.billingPeriod ? { billingPeriod: String(updates.billingPeriod).trim().toLowerCase() } : {}),
      ...(updates.description !== undefined ? { description: String(updates.description || '').trim() } : {}),
      ...(updates.features !== undefined ? { features: Array.isArray(updates.features) ? updates.features.map((f) => String(f).trim()).filter(Boolean) : [] } : {}),
      ...(updates.isRecommended !== undefined ? { isRecommended: Boolean(updates.isRecommended) } : {}),
      ...(updates.active !== undefined ? { active: Boolean(updates.active) } : {}),
    };

    const plan = await MembershipPlan.findByIdAndUpdate(id, { $set: payload }, { new: true });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    return res.json({ plan });
  } catch (error) {
    console.error('Update membership plan admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMembershipPlanAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }
    const plan = await MembershipPlan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    return res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete membership plan admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
