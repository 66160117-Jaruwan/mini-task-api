const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and name are required'
        }
      });
    }

    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (email, password, name, role, isPremium, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      email,
      hashedPassword,
      name,
      'user',
      false,
      new Date()
    ];

    const [result] = await db.query(sql, values);

    // สร้าง access token และ refresh token
    const accessToken = jwt.sign(
      { 
        userId: result.insertId,
        email: email,
        role: 'user'
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { 
        userId: result.insertId,
        email: email
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      accessToken: accessToken,
      refreshToken: refreshToken
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
        details: error.message
      }
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Username and password are required'
        }
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }

    // สร้าง access token และ refresh token
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium
      },
      accessToken: accessToken,
      refreshToken: refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login',
        details: error.message
      }
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired refresh token'
          }
        });
      }

      // สร้าง access token ใหม่
      const newAccessToken = jwt.sign(
        { 
          userId: decoded.userId,
          email: decoded.email
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE }
      );

      res.status(200).json({
        accessToken: newAccessToken
      });
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh',
        details: error.message
      }
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    console.log('Request body:', req.body); // เพิ่มบรรทัดนี้เพื่อ debug
    console.log('Request headers:', req.headers); // เพิ่มบรรทัดนี้
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    res.status(200).json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during logout',
        details: error.message
      }
    });
  }
};