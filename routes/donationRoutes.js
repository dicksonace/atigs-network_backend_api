const express = require('express');
const router = express.Router();
const donationsController = require('../controllers/donationsController');
const { authenticate } = require('../middlewares/auth');

// Public endpoints
router.post('/stripe/create-intent', donationsController.createStripePaymentIntent);
router.post('/paystack/initialize', donationsController.initializePaystackPayment);

// Webhooks (no auth)
router.post('/webhook/stripe', 
  express.raw({ type: 'application/json' }), 
  donationsController.stripeWebhook
);
router.post('/webhook/paystack', 
  express.json(),
  donationsController.paystackWebhook
);

// Authenticated endpoints
router.get('/history', authenticate, donationsController.getDonationHistory);

module.exports = router;