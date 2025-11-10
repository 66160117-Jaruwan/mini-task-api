const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const userController = require('../controllers/userController');

// User routes (ต้อง login)
router.get('/me', verifyToken, userController.getMe);
router.put('/me', verifyToken, userController.updateMe);
router.delete('/me', verifyToken, userController.deleteMe);

// Admin routes (ต้องเป็น admin)
router.get('/', verifyToken, isAdmin, userController.getAllUsers);

module.exports = router;