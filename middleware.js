// Import จากทั้งสองที่เพื่อความเข้ากันได้กับโค้ดเก่า
const authenticate = require('./middlewares/authenticate');
const { authorize } = require('./middlewares/authorize');

// สำหรับโค้ดเก่าที่อาจยัง import จาก middleware/
const authenticateOld = authenticate;
const authorizeOld = authorize;
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
