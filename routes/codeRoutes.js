const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const codeController = require('../controllers/codeController');

// Code verification route
router.post(
  '/verify',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ min: 1 })
      .withMessage('Code cannot be empty'),
  ],
  codeController.verifyCode
);

module.exports = router;