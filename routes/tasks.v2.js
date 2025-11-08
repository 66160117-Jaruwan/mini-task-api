// routes/tasks.v2.js
const express = require("express");
const router = express.Router();
const tasksV1 = require("./tasks.v1"); // reuse handlers where possible

// Example: override GET / to include metadata
const Task = require("../models/taskModel");
const authenticate = require("../middlewares/authorize");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const rows = await Task.list({}, { page, limit });
    const metadata = {
      createdAt: new Date().toISOString(),
      version: "v2",
      page,
      limit,
      total: rows.length,
    };
    res.json({ data: rows, metadata });
  } catch (err) {
    next(err);
  }
});

// For other endpoints we can import or reimplement; here for brevity we mount v1 handlers underneath
// but in real project separate improvements per endpoint
router.use("/", require("./tasks.v1"));

module.exports = router;
