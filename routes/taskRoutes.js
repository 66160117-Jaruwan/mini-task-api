const express = require('express');
const router = express.Router();
const { verifyToken, isPremium } = require('../middlewares/auth');
const { 
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getPremiumTasks
} = require('../controllers/taskController');

// 🔹 Routes ต้อง login ก่อน
router.get('/', verifyToken, getAllTasks);
router.get('/:id', verifyToken, getTaskById);
router.post('/', verifyToken, createTask);
router.put('/:id', verifyToken, updateTask);
router.patch('/:id/status', verifyToken, updateTaskStatus);
router.delete('/:id', verifyToken, deleteTask);

// 🔹 Routes สำหรับ premium เท่านั้น
router.get('/premium', verifyToken, isPremium, getPremiumTasks);

module.exports = router;
