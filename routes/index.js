// 2. routes/index.js
const express = require("express");
const router = express.Router();

// นำเข้า Routes จากไฟล์ต่างๆ
const tasksV1Routes = require("./tasks.v1");
const tasksV2Routes = require("./tasks.v2");
const userRoutes = require("./userRoutes"); // (ไฟล์ที่ 3)

// กำหนดเส้นทางหลัก
router.use("/api/v1/tasks", tasksV1Routes);
router.use("/api/v2/tasks", tasksV2Routes);
router.use("/api/v1", userRoutes); // (User + Auth Routes)

module.exports = router;
