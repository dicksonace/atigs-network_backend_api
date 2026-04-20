const { default: Paystack } = require('@paystack/paystack-sdk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const MembershipSubscription = require('../models/MembershipSubscription');
const MembershipPlan = require('../models/MembershipPlan');
const User = require('../models/User');
const AppSetting = require('../models/AppSetting');
const { sendEmail } = require('../utils/emailSender');

const paystack = new Paystack((process.env.PAYSTACK_SECRET_KEY || '').trim());

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    key: 'individual',
    name: 'For Individuals',
    amount: 999,
    currency: 'USD',
    billingPeriod: 'yearly',
    features: [
      'Access ATIGS Flagship Summit',
      'Access ATIGS International Forums',
      'Access ATIGS Knowledge Reports and Publications',
      'Exclusive Access to Innovation-driven Investment Opportunities',
    ],
  },
  {
    key: 'corporation',
    name: 'For Corporations',
    amount: 5499,
    currency: 'USD',
    billingPeriod: 'yearly',
    isRecommended: true,
    features: [
      'Company-wide access to reports and publications',
      'Priority support',
      'Advanced trade resources',
      'Market entry support',
    ],
  },
  {
    key: 'startup',
    name: 'For Startups',
    amount: 2499,
    currency: 'USD',
    billingPeriod: 'yearly',
    features: [
      'Access to summit and international forums',
      'Company-wide knowledge access',
      'Innovation-driven investment opportunities',
      '24/7 support',
    ],
  },
];

const getUsdToGhsRate = async () => {
  const fallbackRate = Number(process.env.USD_TO_GHS || 15);
  const setting = await AppSetting.findOne({ key: 'USD_TO_GHS' });
  const dynamicRate = Number(setting?.value);
  return Number.isFinite(dynamicRate) && dynamicRate > 0 ? dynamicRate : fallbackRate;
};

const convertUsdToGhs = (usdAmount, rate) => Math.max(1, Math.round(usdAmount * rate * 100) / 100);
const MEMBERSHIP_GUEST_OTP_TTL_MS = 10 * 60 * 1000;
const MEMBERSHIP_GUEST_TOKEN_TTL = '30m';

const ensureDefaultPlans = async () => {
  const count = await MembershipPlan.countDocuments();
  if (count > 0) {
    return;
  }

  await MembershipPlan.insertMany(
    DEFAULT_MEMBERSHIP_PLANS.map((plan) => ({
      ...plan,
      active: true,
    }))
  );
};

const getActivePlans = async () => {
  await ensureDefaultPlans();
  return MembershipPlan.find({ active: true }).sort({ amount: 1 });
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const resolveUserFromAccessToken = async (req) => {
  let token = req.header('Authorization') || req.cookies?.accessToken;
  if (!token) return null;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return null;
    return user;
  } catch (error) {
    return null;
  }
};

const getOrCreateGuestUser = async (email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    return user;
  }

  const randomPassword = `A!${crypto.randomBytes(12).toString('hex')}9`;
  user = await User.create({
    firstName: 'Guest',
    lastName: 'Member',
    email: normalizedEmail,
    password: randomPassword,
    isVerified: true,
  });
  return user;
};

exports.getMembershipPlans = async (req, res) => {
  try {
    const rate = await getUsdToGhsRate();
    const plans = (await getActivePlans()).map((plan) => ({
      key: plan.key,
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      description: plan.description,
      isRecommended: plan.isRecommended,
      features: plan.features,
      amountGhs: convertUsdToGhs(plan.amount, rate),
      payCurrency: 'GHS',
    }));
    return res.json({ plans, exchangeRate: { from: 'USD', to: 'GHS', rate } });
  } catch (error) {
    console.error('Get membership plans error:', error);
    return res.status(500).json({ message: 'Failed to fetch membership plans' });
  }
};

exports.sendGuestMembershipOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await getOrCreateGuestUser(normalizedEmail);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + MEMBERSHIP_GUEST_OTP_TTL_MS);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail({
      to: normalizedEmail,
      subject: 'ATIGS Membership OTP',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">ATIGS Membership Verification</h2>
        <p>Your OTP code is:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 12px 0;">${otp}</div>
        <p>This code expires in 10 minutes.</p>
      </div>`,
    });

    return res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send guest membership OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyGuestMembershipOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const trimmedOtp = String(otp || '').trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return res.status(400).json({ message: 'OTP must be 6 digits' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.otp || user.otp !== trimmedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (!user.otpExpires || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const guestVerificationToken = jwt.sign(
      { userId: String(user._id), email: normalizedEmail, purpose: 'membership_checkout' },
      process.env.JWT_SECRET,
      { expiresIn: MEMBERSHIP_GUEST_TOKEN_TTL }
    );

    return res.json({
      message: 'Email verified successfully',
      guestVerificationToken,
      verifiedEmail: normalizedEmail,
    });
  } catch (error) {
    console.error('Verify guest membership OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

exports.initializeMembershipPayment = async (req, res) => {
  try {
    const { planKey, email, fullName, paymentMethod = 'card', guestVerificationToken } = req.body;

    await ensureDefaultPlans();
    const plan = await MembershipPlan.findOne({ key: planKey, active: true });
    if (!plan) {
      return res.status(400).json({ message: 'Invalid membership plan selected' });
    }

    const authedUser = await resolveUserFromAccessToken(req);
    let payerUser = authedUser;
    let payerEmail = authedUser?.email || '';

    if (!payerUser) {
      if (!guestVerificationToken) {
        return res.status(401).json({ message: 'Please verify your email with OTP before checkout' });
      }

      let decodedGuest;
      try {
        decodedGuest = jwt.verify(guestVerificationToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ message: 'Guest verification expired. Please request OTP again.' });
      }

      if (decodedGuest?.purpose !== 'membership_checkout' || !isValidEmail(decodedGuest?.email)) {
        return res.status(401).json({ message: 'Invalid guest verification token' });
      }

      payerUser = await User.findById(decodedGuest.userId);
      if (!payerUser) {
        payerUser = await getOrCreateGuestUser(decodedGuest.email);
      }
      payerEmail = String(decodedGuest.email).trim().toLowerCase();
    } else {
      payerEmail = String(authedUser.email || '').trim().toLowerCase();
    }

    if (!payerEmail || !isValidEmail(payerEmail)) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
      }
      payerEmail = String(email).trim().toLowerCase();
    }

    const rate = await getUsdToGhsRate();
    const amountGhs = convertUsdToGhs(plan.amount, rate);
    const reference = `MEM-${uuidv4()}`;
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const normalizedMethod = String(paymentMethod).toLowerCase();
    const channels =
      normalizedMethod === 'bank'
        ? ['bank_transfer']
        : ['card', 'mobile_money', 'bank', 'ussd', 'qr'];

    const paystackResponse = await paystack.transaction.initialize({
      email: payerEmail,
      amount: Math.round(amountGhs * 100),
      currency: 'GHS',
      reference,
      callback_url: `${frontendBase}/membership-payment?status=success&reference=${reference}`,
      channels,
      metadata: {
        membership_plan: plan.key,
        membership_name: plan.name,
        full_name: fullName || 'Member',
        payment_method: normalizedMethod,
        payer_user_id: payerUser ? String(payerUser._id) : undefined,
      },
    });

    const authorizationUrl = paystackResponse?.data?.authorization_url;
    if (!authorizationUrl) {
      return res.status(502).json({
        message: paystackResponse?.message || 'Paystack did not return an authorization URL',
      });
    }

    const subscription = await MembershipSubscription.create({
      userId: payerUser ? payerUser._id : undefined,
      email: payerEmail,
      fullName,
      planKey: plan.key,
      planName: plan.name,
      amount: amountGhs,
      currency: 'GHS',
      paymentReference: reference,
      paystackAccessCode: paystackResponse?.data?.access_code,
      status: 'pending',
      metadata: paystackResponse?.data || {},
    });

    return res.status(201).json({
      message: 'Membership payment initialized',
      authorizationUrl,
      reference,
      subscriptionId: subscription._id,
      amount: amountGhs,
      currency: 'GHS',
      exchangeRate: rate,
    });
  } catch (error) {
    console.error('Initialize membership payment error:', error);
    return res.status(500).json({ message: 'Failed to initialize membership payment' });
  }
};

exports.getExchangeRate = async (req, res) => {
  try {
    const rate = await getUsdToGhsRate();
    return res.json({ from: 'USD', to: 'GHS', rate });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return res.status(500).json({ message: 'Failed to fetch exchange rate' });
  }
};

exports.verifyMembershipPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    const subscription = await MembershipSubscription.findOne({ paymentReference: reference });
    if (!subscription) {
      return res.status(404).json({ message: 'Membership transaction not found' });
    }

    const verification = await paystack.transaction.verify({ reference });
    const status = verification?.data?.status;

    if (status === 'success') {
      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);

      subscription.status = 'successful';
      subscription.startsAt = start;
      subscription.expiresAt = end;
      subscription.metadata = {
        ...(subscription.metadata || {}),
        paystack: verification?.data || {},
      };
      await subscription.save();

      const user = await User.findOne({ email: subscription.email });
      if (user) {
        user.role = user.role === 'admin' ? 'admin' : 'premium';
        await user.save();
      }
    } else if (status === 'failed') {
      subscription.status = 'failed';
      await subscription.save();
    }

    return res.json({
      status: subscription.status,
      reference: subscription.paymentReference,
      planName: subscription.planName,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    console.error('Verify membership payment error:', error);
    return res.status(500).json({ message: 'Failed to verify membership payment' });
  }
};
