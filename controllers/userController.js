const bcrypt = require('bcrypt');
const db = require('../config/db');

// GET /api/v1/users/me - ดูข้อมูลตัวเอง
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.promise().query(
      'SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: error.message
      }
    });
  }
};

// PUT /api/v1/users/me - แก้ไขข้อมูลตัวเอง
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, password, currentPassword } = req.body;

    // ตรวจสอบว่ามีการส่งข้อมูลมาหรือไม่
    if (!name && !email && !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'At least one field is required (name, email, or password)'
        }
      });
    }

    // ดึงข้อมูล user ปัจจุบัน
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = users[0];

    // ถ้าต้องการเปลี่ยน password ต้องใส่ currentPassword
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          error: {
            code: 'CURRENT_PASSWORD_REQUIRED',
            message: 'Current password is required to change password'
          }
        });
      }

      // ตรวจสอบ current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect'
          }
        });
      }
    }

    // ตรวจสอบว่า email ซ้ำหรือไม่ (ถ้ามีการเปลี่ยน email)
    if (email && email !== user.email) {
      const [existingUsers] = await db.promise().query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use'
          }
        });
      }
    }

    // เตรียม update query
    let updateFields = [];
    let values = [];

    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }

    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      values.push(hashedPassword);
    }

    values.push(userId);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.promise().query(sql, values);

    // ดึงข้อมูลที่อัพเดทแล้ว
    const [updatedUsers] = await db.promise().query(
      'SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: error.message
      }
    });
  }
};

// DELETE /api/v1/users/me - ลบบัญชีตัวเอง
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Password is required to delete account'
        }
      });
    }

    // ดึงข้อมูล user
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = users[0];

    // ตรวจสอบ password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password is incorrect'
        }
      });
    }

    // ลบ user (tasks จะถูกลบตาม CASCADE)
    await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);

    res.status(200).json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete me error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: error.message
      }
    });
  }
};

// GET /api/v1/users - ดู list users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isPremium, search } = req.query;
    const offset = (page - 1) * limit;

    // สร้าง WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (isPremium !== undefined) {
      whereConditions.push('isPremium = ?');
      queryParams.push(isPremium === 'true' ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // นับจำนวน users ทั้งหมด
    const [countResult] = await db.promise().query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // ดึงข้อมูล users
    const [users] = await db.promise().query(
      `SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt 
       FROM users ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      message: 'Users retrieved successfully',
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: error.message
      }
    });
  }
};