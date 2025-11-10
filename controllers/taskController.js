const Task = require('../models/taskModel');

// ดึงงานทั้งหมด
exports.getAllTasks = (req, res) => {
  Task.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ดึงงานตาม id
exports.getTaskById = (req, res) => {
  const { id } = req.params;
  Task.getById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Task not found' });
    res.json(results[0]);
  });
};

// สร้างงานใหม่
exports.createTask = (req, res) => {
  const data = req.body;
  Task.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, ...data });
  });
};

// อัปเดตงาน
exports.updateTask = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  Task.update(id, data, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task updated successfully' });
  });
};

// ลบงาน
exports.deleteTask = (req, res) => {
  const { id } = req.params;
  Task.delete(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted successfully' });
  });
};

// ถ้าไม่มี ให้เพิ่มเข้าไป
exports.getPremiumTasks = async (req, res) => {
  try {
    // Logic สำหรับดึง premium tasks
    res.json({ message: 'Premium tasks', user: req.user });
  } catch (error) {
    console.error('Get premium tasks error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: error.message
      }
    });
  }
};