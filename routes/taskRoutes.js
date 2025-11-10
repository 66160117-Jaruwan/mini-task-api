const express = require('express');
const router = express.Router();
const { verifyToken, isPremium } = require('../middlewares/auth');
const taskController = require('../controllers/taskController');

// Routes ที่ต้อง login
router.get('/', verifyToken, taskController.getAllTasks);           // GET /api/v1/tasks
router.get('/:id', verifyToken, taskController.getTaskById);        // GET /api/v1/tasks/:id
router.post('/', verifyToken, taskController.createTask);           // POST /api/v1/tasks
router.put('/:id', verifyToken, taskController.updateTask);         // PUT /api/v1/tasks/:id
router.delete('/:id', verifyToken, taskController.deleteTask);      // DELETE /api/v1/tasks/:id

// Routes ที่ต้องเป็น premium
router.get('/premium', verifyToken, isPremium, taskController.getPremiumTasks); // GET /api/v1/tasks/premium

module.exports = router;