// middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

const anonymousLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set("Retry-After", Math.ceil(15 * 60));
    res
      .status(429)
      .json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Try again later",
          retryAfter: 15 * 60,
        },
      });
  },
});

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set("Retry-After", Math.ceil(15 * 60));
    res
      .status(429)
      .json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Try again later",
          retryAfter: 15 * 60,
        },
      });
  },
});

const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set("Retry-After", Math.ceil(15 * 60));
    res
      .status(429)
      .json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Try again later",
          retryAfter: 15 * 60,
        },
      });
  },
});

// middleware that selects limiter based on req.user
function tieredLimiter(req, res, next) {
  // if not authenticated -> anonymous
  if (!req.user) return anonymousLimiter(req, res, next);
  if (req.user.role === "premium") return premiumLimiter(req, res, next);
  return userLimiter(req, res, next);
}

module.exports = {
  tieredLimiter,
  anonymousLimiter,
  userLimiter,
  premiumLimiter,
};
