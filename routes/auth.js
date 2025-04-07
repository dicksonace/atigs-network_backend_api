const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const { authenticate, authorize } = require('../middleware/authMiddleware');
const authController = require("../controllers/authController");

router.post(
  "/register",
  [
    body("firstName")
      .notEmpty()
      .trim()
      .escape()
      .withMessage("First name is required"),
    body("lastName")
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
      body('phoneNumber')
      .optional()
      .matches(/^\+?\d{10,15}$/) // Accepts optional + prefix and 10-15 digits
      .withMessage('Phone must be 10-15 digits with optional + prefix'),
    body("companyName")
      .optional()
      .trim()
      .escape(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
  ],
  authController.register
);

router.get(
  "/verify-email",
  [
    query("token")
      .notEmpty()
      .withMessage("Verification token is required")
      .isHexadecimal()
      .withMessage("Token must be a valid hexadecimal string")
      .isLength({ min: 40, max: 40 })
      .withMessage("Invalid token format"),
  ],
  authController.verifyEmail
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password required"),
  ],
  authController.login
);

router.post(
  "/refresh-token",
  [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token is required")
      .isString()
      .withMessage("Refresh token must be a string"),
  ],
  authController.refreshToken
);

router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail(),
  ],
  authController.forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token")
      .notEmpty()
      .withMessage("Reset token is required")
      .isString()
      .withMessage("Token must be a string"),

    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
  ],
  authController.resetPassword
);


router.post(
  '/generate-otp',
  [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email required')
      .normalizeEmail(),
  ],
  authController.generateOTP
);


router.post(
  '/verify-otp',
  [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email required')
      .normalizeEmail(),
    body('otp')
      .notEmpty().withMessage('OTP is required')
      .matches(/^\d{6}$/).withMessage('OTP must be 6 digits')
  ],
  authController.verifyOTP
);


router.post(
  '/logout',
  authenticate, // Requires valid access token
  [
    body('refreshToken')
      .notEmpty().withMessage('Refresh token is required')
      .isJWT().withMessage('Invalid token format')
  ],
  authController.logout
);

module.exports = router;
