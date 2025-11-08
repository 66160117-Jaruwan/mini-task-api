const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware');

// ==================== AUTH ROUTES (Public) ====================
// ไม่ต้องใช้ authenticate middleware
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Auth routes ที่ต้อง authenticate
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authenticate, authController.logout);

// ==================== USER ROUTES (Authenticated) ====================
// Personal user endpoints - ต้อง authenticate
router.get('/users/me', authenticate, userController.getMe);
router.put('/users/me', authenticate, userController.updateMe);
router.delete('/users/me', authenticate, userController.deleteMe);

// Admin only endpoint - ต้อง authenticate + authorize
router.get('/users', authenticate, authorize(['admin']), userController.getAllUsers);

module.exports = router;