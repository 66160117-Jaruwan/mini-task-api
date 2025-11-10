const jwt = require('jsonwebtoken');

// Middleware สำหรับตรวจสอบ access token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = decoded; // เก็บข้อมูล user ไว้ใน req
    next();
  });
};

// Middleware ตรวจสอบว่าเป็น admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Middleware ตรวจสอบว่าเป็น premium
exports.isPremium = (req, res, next) => {
  if (!req.user.isPremium && req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'PREMIUM_REQUIRED',
        message: 'Premium membership required'
      }
    });
  }
  next();
};