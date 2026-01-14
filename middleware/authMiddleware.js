const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { promisify } = require('util');

// 1. Protect Routes (Verify Token)
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'You are not logged in' });
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    // Grant Access
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
};

// 2. Restrict to specific Roles (Admin/Coordinator)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};