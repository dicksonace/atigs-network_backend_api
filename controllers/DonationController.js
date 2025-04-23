const Donation = require("../models/Donation");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Paystack } = require('paystack-node');
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { verifyStripeWebhook, verifyPaystackWebhook } = require("../middlewares/webhookVerification");
const { sendThankYouEmail } = require("../utils/emailSender");

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Handle donations via Stripe and Paystack
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Donation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         amount:
 *           type: number
 *           example: 50.00
 *         currency:
 *           type: string
 *           example: USD
 *         donorName:
 *           type: string
 *           example: John Doe
 *         donorEmail:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         paymentGateway:
 *           type: string
 *           enum: [stripe, paystack]
 *           example: stripe
 *         paymentReference:
 *           type: string
 *           example: pi_1JmZ7tKZvQl4gXxX
 *         status:
 *           type: string
 *           enum: [pending, successful, failed, refunded]
 *           example: successful
 *         userId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         message:
 *           type: string
 *           example: Thank you for your work!
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-08-01T12:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2023-08-01T12:05:00Z
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Invalid amount
 *         details:
 *           type: string
 *           example: Amount must be at least 1
 */

/**
 * @swagger
 * /api/donations/stripe/create-intent:
 *   post:
 *     summary: Create a Stripe payment intent
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - donorEmail
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.5
 *                 example: 25.50
 *               currency:
 *                 type: string
 *                 default: usd
 *                 example: usd
 *               donorName:
 *                 type: string
 *                 example: John Doe
 *               donorEmail:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               message:
 *                 type: string
 *                 example: Keep up the good work!
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                   example: pi_1JmZ7tKZvQl4gXxX_secret_xyz
 *                 donation:
 *                   $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Validation error
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         $ref: '#/components/schemas/ErrorResponse'
 */
exports.createStripePaymentIntent = async (req, res) => {
        try {
          const { amount, currency = "usd", donorName, donorEmail, message } = req.body;
      
          // Validate input
          if (!amount || amount < 0.5) throw new Error("Amount must be at least 0.50");
          if (!donorEmail || !/^\S+@\S+\.\S+$/.test(donorEmail)) throw new Error("Invalid email");
      
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata: {
              donorName: donorName || "Anonymous",
              donorEmail,
              userId: req.user?.id || "guest",
              message: message || ""
            }
          });
      
          const donation = await Donation.create({
            amount,
            currency,
            donorName: donorName || "Anonymous",
            donorEmail,
            paymentGateway: "stripe",
            paymentReference: paymentIntent.id,
            status: "pending",
            userId: req.user?.id,
            message
          });
      
          res.json({ success: true, clientSecret: paymentIntent.client_secret, donation });
      
        } catch (err) {
          res.status(400).json({ 
            error: err.message,
            details: process.env.NODE_ENV === "development" ? err.stack : null
          });
        }
            
};

/**
 * @swagger
 * /api/donations/paystack/initialize:
 *   post:
 *     summary: Initialize Paystack payment
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - donorEmail
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 5000
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 example: NGN
 *               donorName:
 *                 type: string
 *                 example: Jane Smith
 *               donorEmail:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               message:
 *                 type: string
 *                 example: Supporting your cause
 *     responses:
 *       200:
 *         description: Payment initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paymentUrl:
 *                   type: string
 *                   example: https://paystack.com/pay/xyz123
 *                 donation:
 *                   $ref: '#/components/schemas/Donation'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
exports.initializePaystackPayment = async (req, res) => {
  
        try {
          const { amount, donorName, donorEmail, message, currency = "NGN" } = req.body;
      
          if (!amount || amount < 1) throw new Error("Amount must be at least 1");
          if (!donorEmail || !/^\S+@\S+\.\S+$/.test(donorEmail)) throw new Error("Invalid email");
      
          const reference = `DON-${uuidv4()}`;
      
          const donation = await Donation.create({
            amount,
            currency,
            donorName: donorName || "Anonymous",
            donorEmail,
            paymentGateway: "paystack",
            paymentReference: reference,
            status: "pending",
            userId: req.user?.id,
            message
          });
      
          const response = await paystack.initializeTransaction({
            amount: amount * 100,
            email: donorEmail,
            reference,
            metadata: {
              custom_fields: [
                {
                  display_name: "Donor Name",
                  variable_name: "donor_name",
                  value: donorName || "Anonymous"
                }
              ]
            }
          });
      
          if (!response.status || !response.data.authorization_url) {
            throw new Error("Failed to initialize payment");
          }
      
          res.json({ 
            success: true, 
            paymentUrl: response.data.authorization_url, 
            donation 
          });
      
        } catch (err) {
          res.status(400).json({ 
            error: err.message,
            details: process.env.NODE_ENV === "development" ? err.stack : null
          });
        }
            
};

/**
 * @swagger
 * /api/donations/webhook/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               id: evt_1JmZ7tKZvQl4gXxX
 *               type: payment_intent.succeeded
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
exports.stripeWebhook = async (req, res) => {
        try {
          const event = verifyStripeWebhook(req);
          
          switch (event.type) {
            case 'payment_intent.succeeded':
              const paymentIntent = event.data.object;
              await Donation.findOneAndUpdate(
                { paymentReference: paymentIntent.id },
                { status: 'successful' }
              );
              break;
      
            case 'payment_intent.payment_failed':
              await Donation.findOneAndUpdate(
                { paymentReference: event.data.object.id },
                { 
                  status: 'failed',
                  metadata: { failure_reason: event.data.object.last_payment_error?.message }
                }
              );
              break;
          }
      
          res.sendStatus(200);
        } catch (err) {
          console.error("Webhook Error:", err);
          res.status(400).send(`Webhook Error: ${err.message}`);
        }
      
};

/**
 * @swagger
 * /api/donations/webhook/paystack:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               event: charge.success
 *               data:
 *                 reference: DON-123456
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
exports.paystackWebhook = async (req, res) => {
 
        try {
          const event = verifyPaystackWebhook(req);
          
          if (event.event === 'charge.success') {
            await Donation.findOneAndUpdate(
              { paymentReference: event.data.reference },
              { status: 'successful' }
            );

            // After marking donation as successful
                await sendThankYouEmail({
                    email: donation.donorEmail,
                    firstName: donation.donorName
                }, donation.amount, donation.currency);
          }
      
          res.sendStatus(200);
        } catch (err) {
          console.error("Webhook Error:", err);
          res.status(400).send(`Webhook Error: ${err.message}`);
        }
      
};

/**
 * @swagger
 * /api/donations/history:
 *   get:
 *     summary: Get user donation history
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Donation history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 donations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Donation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
exports.getDonationHistory = async (req, res) => {
        try {
          const { page = 1, limit = 10 } = req.query;
          const skip = (page - 1) * limit;
      
          const [donations, total] = await Promise.all([
            Donation.find({ userId: req.user.id })
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit),
            Donation.countDocuments({ userId: req.user.id })
          ]);

          // After marking donation as successful
            await sendThankYouEmail({
                email: donation.donorEmail,
                firstName: donation.donorName
            }, donation.amount, donation.currency);
      
          res.json({
            success: true,
            total,
            page: Number(page),
            limit: Number(limit),
            donations
          });
        } catch (err) {
          res.status(500).json({ 
            error: "Failed to fetch donations",
            details: process.env.NODE_ENV === "development" ? err.message : null
          });
        }
      
};

// Add to your main Swagger setup:
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */