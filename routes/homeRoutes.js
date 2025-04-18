// routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Newsletter subscription (email only)
router.post('/subscribe', homeController.subscribeToNewsletter);

// Newsletter subscription with full name and email
router.post('/join-newwork', homeController.joinNework);

// Contact form submission
router.post('/contact', homeController.submitContactForm);

module.exports = router;