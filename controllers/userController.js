const User = require('../models/userModel');

// ดึงผู้ใช้ทั้งหมด
exports.getAllUsers = (req, res) => {
  User.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ดึงผู้ใช้ตาม id
exports.getUserById = (req, res) => {
  const { id } = req.params;
  User.getById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

// เพิ่มผู้ใช้ใหม่
exports.createUser = (req, res) => {
  const data = req.body;
  User.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, ...data });
  });
};

// อัปเดตข้อมูลผู้ใช้
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  User.update(id, data, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated successfully' });
  });
};

// ลบผู้ใช้
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  User.delete(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted successfully' });
  });
};

// ดึงข้อมูลผู้ใช้ที่ login อยู่
exports.getMe = (req, res) => {
  // req.user จะถูกเพิ่มโดย authenticate middleware
  const userId = req.user.id;
  User.getById(userId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

// อัปเดตข้อมูลผู้ใช้ที่ login อยู่
exports.updateMe = (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  
  // ป้องกันการอัปเดตข้อมูลที่ไม่ควรให้แก้ไข
  delete data.password; // ไม่อนุญาตให้อัปเดต password ผ่าน endpoint นี้
  delete data.role; // ไม่อนุญาตให้อัปเดตสิทธิ์ผู้ใช้
  
  User.update(userId, data, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated successfully' });
  });
};

// ลบบัญชีผู้ใช้ที่ login อยู่
exports.deleteMe = (req, res) => {
  const userId = req.user.id;
  User.delete(userId, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Your account has been deleted successfully' });
  });
};
