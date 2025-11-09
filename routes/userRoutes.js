// 3. routes/userRoutes.js
const express = require("express");
const router = express.Router();

// 1. นำเข้า Controllers
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// 2. นำเข้า Middlewares
const authenticate = require("../middlewares/authenticate"); // (ไฟล์ที่ 4)
const authorize = require("../middlewares/authorize"); // (ไฟล์ที่ 5 - งานของคุณ)

// (A) Auth Routes (งานคนที่ 2)
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authenticate, authController.logout);

// (B) User Routes (งานคนที่ 2)
router.get("/users/me", authenticate, userController.getMe);
router.put("/users/me", authenticate, userController.updateMe);
router.delete("/users/me", authenticate, userController.deleteMe);

// (C) Admin Routes (จุดเชื่อมโยงงานของคุณ)
router.get(
  "/users",
  authenticate, // 1. เช็คว่าล็อกอินยัง?
  authorize(["admin"]), // 2. เช็คว่าเป็น admin? (งานของคุณ)
  userController.getAllUsers
);

module.exports = router;
