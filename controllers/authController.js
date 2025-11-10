const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Helper: Generate Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenId: uuidv4(),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
  );

  return { accessToken, refreshToken };
};

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email, password, and name are required",
          details: {
            email: !email ? "Email is required" : undefined,
            password: !password ? "Password is required" : undefined,
            name: !name ? "Name is required" : undefined,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Check if email exists
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Email already exists",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await db.query(
      "INSERT INTO users (id, email, password, name, role, isPremium, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, email, hashedPassword, name, "user", false, new Date()]
    );

    // Generate tokens
    const user = { id: userId, email, role: "user", isPremium: false };
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name,
        role: "user",
        isPremium: false,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during registration",
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Find user
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during login",
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

// POST /api/v1/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Refresh token is required",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Check if token is blacklisted
    const [blacklisted] = await db.query(
      "SELECT token FROM blacklisted_tokens WHERE token = ?",
      [refreshToken]
    );

    if (blacklisted.length > 0) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Token has been revoked",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user data
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      decoded.userId,
    ]);

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

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" }
    );

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    console.error("Refresh error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during token refresh",
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

// POST /api/v1/auth/logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Refresh token is required",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Add token to blacklist
    await db.query(
      "INSERT INTO blacklisted_tokens (token, createdAt) VALUES (?, ?)",
      [refreshToken, new Date()]
    );

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during logout",
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};
