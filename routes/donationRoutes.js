const express = require('express');
const router = express.Router();
const donationsController = require('../controllers/DonationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public endpoints
// router.post('/stripe/create-intent', donationsController.createStripePaymentIntent);
// router.post('/paystack/initialize', donationsController.initializePaystackPayment);

router.post('/create-checkout-session', donationsController.createCheckoutSession);
router.post('/paystack/initialize', donationsController.initializePaystackDonation);
router.get('/verify/:reference', donationsController.verifyDonationPayment);



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
router.get('/admin/all', authenticate, authorize('admin'), donationsController.getAllDonationsAdmin);

module.exports = router;