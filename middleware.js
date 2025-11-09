// app.use((req, res) => {
//   res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
// });
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
// });

const jwt = require('jsonwebtoken');
const db = require('./config/db');

// ==================== AUTHENTICATION ====================
// Middleware: ตรวจสอบ JWT Token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
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
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
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
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token expired',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during authentication',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
};

// ==================== AUTHORIZATION (RBAC) ====================
// Middleware: ตรวจสอบ Role
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    next();
  };
};

// ==================== ERROR HANDLERS ====================
// 404 Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

// 500 Error Handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

// Export ทั้งหมด
module.exports = {
  authenticate,
  authorize,
  notFoundHandler,
  errorHandler
};
