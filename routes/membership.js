const express = require('express');
// const { authenticate, authorize } = require('../middleware/auth');
// const User = require('../models/User');
const router = express.Router();

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

module.exports = router;