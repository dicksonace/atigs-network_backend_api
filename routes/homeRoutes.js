// routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Newsletter subscription (email only)
router.post('/subscribe', homeController.subscribeToNewsletter);

// Newsletter subscription with full name and email
router.post('/join-network', homeController.joinNetwork);

// Contact form submission
router.post('/contact', homeController.submitContactForm);

// Published CMS content (events, careers, press releases, trade insights)
router.get('/content/:type', homeController.getPublishedContent);

// Media gallery (albums)
router.get('/media-gallery', homeController.getPublishedMediaAlbums);

module.exports = router;