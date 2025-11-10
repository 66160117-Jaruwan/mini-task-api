const db = require('../config/db');

// ดึงงานทั้งหมด
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, ownerId } = req.query;

    // ✅ เริ่มสร้างเงื่อนไขแบบ dynamic
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (ownerId) {
      sql += ' AND ownerId = ?';
      params.push(ownerId);
    }

    const [rows] = await db.query(sql, params);

    res.status(200).json({
      count: rows.length,
      filters: { status, priority, ownerId },
      tasks: rows
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
};

// ดึงงานตาม ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

// สร้างงานใหม่
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, ownerId } = req.body;
    const sql = `
      INSERT INTO tasks (title, description, priority, ownerId)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [title, description, priority, ownerId]);
    res.status(201).json({ id: result.insertId, title, description, priority, ownerId });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

// อัปเดตงานทั้งหมด
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status } = req.body;
    await db.query(
      'UPDATE tasks SET title=?, description=?, priority=?, status=? WHERE id=?',
      [title, description, priority, status, id]
    );
    res.status(200).json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

// อัปเดตเฉพาะสถานะ
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE tasks SET status=? WHERE id=?', [status, id]);
    res.status(200).json({ message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

// ลบงาน
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id=?', [id]);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

// ดึงงานเฉพาะ Premium
exports.getPremiumTasks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE priority="high"');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
