const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

// // Upgrade to premium (example)
// router.post('/upgrade', 
//   authenticate,
//   authorize(['user']), // Only regular users can upgrade
//   async (req, res) => {
//     try {
//       const user = await User.findByIdAndUpdate(
//         req.user._id,
//         { role: 'premium' },
//         { new: true }
//       );
//       res.json({ message: 'Membership upgraded', user });
//     } catch (err) {
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );

// // Admin-only route example
// router.get('/admin-stats',
//   authenticate,
//   authorize(['admin']),
//   async (req, res) => {
//     // Return some admin stats
//     const userCount = await User.countDocuments();
//     res.json({ userCount });
//   }
// );

router.get('/plans', membershipController.getMembershipPlans);
router.get('/exchange-rate', membershipController.getExchangeRate);
router.post('/guest/send-otp', membershipController.sendGuestMembershipOtp);
router.post('/guest/verify-otp', membershipController.verifyGuestMembershipOtp);
router.post('/subscribe', membershipController.initializeMembershipPayment);
router.get('/verify/:reference', membershipController.verifyMembershipPayment);

module.exports = router;