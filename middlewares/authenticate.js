const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Get user from database
    const [users] = await db.query(
      "SELECT id, email, name, role, isPremium, subscriptionExpiry FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
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
      subscriptionExpiry: user.subscriptionExpiry,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Token expired",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during authentication",
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

module.exports = authenticate;
