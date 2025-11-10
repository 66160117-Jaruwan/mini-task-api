// middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

const anonymousLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // ⭐️ แก้ไข: ลบ handler ออก
});

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // ⭐️ แก้ไข: ลบ handler ออก
});

const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  // ⭐️ แก้ไข: ลบ handler ออก
});

// middleware ที่ "เชื่อมโยง" กับ authenticate (req.user)
function tieredLimiter(req, res, next) {
  if (!req.user) {
    return anonymousLimiter(req, res, next);
  }

  // ⭐️ แก้ไข: เพิ่มการตรวจสอบ admin
  if (req.user.role === "admin" || req.user.role === "premium") {
    return premiumLimiter(req, res, next);
  }

  return userLimiter(req, res, next);
}

module.exports = {
  tieredLimiter,
};
