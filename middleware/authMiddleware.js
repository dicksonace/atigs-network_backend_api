const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization') || req.cookies.accessToken;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Remove 'Bearer ' if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }
 
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error('Authentication Error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `User role ${req.userRole || 'undefined'} is not authorized to access this route`
      });
    }
    next();
  };
};