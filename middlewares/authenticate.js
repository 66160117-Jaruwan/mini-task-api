// middlewares/authenticate.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload should contain userId, role, isPremium, subscriptionExpiry etc.
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      isPremium: payload.isPremium,
      subscriptionExpiry: payload.subscriptionExpiry
        ? new Date(payload.subscriptionExpiry)
        : null,
    };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      });
  }
};
