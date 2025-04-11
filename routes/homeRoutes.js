// routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Newsletter subscription
router.post('/subscribe', homeController.subscribeToNewsletter);

// Contact form submission
router.post('/contact', homeController.submitContactForm);

module.exports = router;