// routes/index.js
const express = require("express");
const router = express.Router();

router.use("/api/v1/tasks", require("./tasks.v1"));
router.use("/api/v2/tasks", require("./tasks.v2"));

// auth / users routes อยู่ที่อื่นตามโปรเจกต์ของคุณ
module.exports = router;
