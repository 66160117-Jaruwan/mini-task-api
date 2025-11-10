const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('No token provided');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Get user from database
    const [users] = await db.query(
      'SELECT id, email, name, role, isPremium, subscriptionExpiry FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    const user = users[0];

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPremium: user.isPremium,
      subscriptionExpiry: user.subscriptionExpiry
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('Invalid token');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token expired');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    console.error('Authentication error:', error);
    const err = new Error('An error occurred during authentication');
    err.statusCode = 500;
    err.code = 'INTERNAL_ERROR';
    next(err);
  }
};

module.exports = authenticate;