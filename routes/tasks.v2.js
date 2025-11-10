// routes/tasks.v2.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const checkTaskAccess = require("../middlewares/checkTaskAccess");
const checkPremiumFeature = require("../middlewares/checkPremiumFeature");
const idempotencyMiddleware = require("../middlewares/idempotency");

router.post(
  "/",
  authenticate,
  idempotencyMiddleware(),
  checkPremiumFeature,
  taskController.createTask
);

router.get("/", authenticate, taskController.getAllTasksV2);

router.get(
  "/:id",
  authenticate,
  checkTaskAccess("read"),
  taskController.getTaskById
);

router.put(
  "/:id",
  authenticate,
  checkTaskAccess("write"),
  taskController.updateTask
);

router.patch(
  "/:id/status",
  authenticate,
  idempotencyMiddleware(),
  checkTaskAccess("update_status"),
  taskController.updateTaskStatus
);

router.delete(
  "/:id",
  authenticate,
  checkTaskAccess("delete"),
  taskController.deleteTask
);

module.exports = router;
