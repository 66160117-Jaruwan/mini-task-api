// routes/tasks.v1.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const Task = require("../models/taskModel");
const authenticate = require("../middlewares/authenticate");
const checkTaskAccess = require("../middlewares/checkTaskAccess");
const checkPremiumFeature = require("../middlewares/checkPremiumFeature");
const idempotencyMiddleware = require("../middlewares/idempotency");

// create task (idempotent)
router.post(
  "/",
  authenticate,
  idempotencyMiddleware(),
  checkPremiumFeature,
  async (req, res, next) => {
    try {
      const body = req.body;
      const task = {
        id: uuidv4(),
        title: body.title,
        description: body.description,
        priority: body.priority,
        ownerId: req.user.id,
        assignedTo: body.assignedTo,
        isPublic: !!body.isPublic,
      };
      const created = await Task.create(task);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// list tasks (filters + pagination)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assignedTo: req.query.assignedTo,
      isPublic: req.query.isPublic ? req.query.isPublic === "true" : undefined,
    };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort ? req.query.sort.replace(":", " ") : undefined;

    // list only tasks allowed: if admin -> all, else return tasks that are public OR owner OR assignedTo
    const rows = await Task.list(filters, { page, limit, sort });
    // apply ABAC filter on result (for simplicity)
    const filtered = rows.filter((t) => {
      if (req.user.role === "admin") return true;
      if (t.isPublic) return true;
      if (t.ownerId === req.user.id) return true;
      if (t.assignedTo === req.user.id) return true;
      return false;
    });
    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  authenticate,
  checkTaskAccess("read"),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authenticate,
  checkTaskAccess("write"),
  async (req, res, next) => {
    try {
      const updated = await Task.update(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH status is idempotent by nature -> still we can wrap with idempotency middleware
router.patch(
  "/:id/status",
  authenticate,
  idempotencyMiddleware(),
  checkTaskAccess("write"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return res
          .status(400)
          .json({
            error: { code: "VALIDATION_ERROR", message: "Invalid status" },
          });
      }
      const update = await Task.update(req.params.id, { status });
      res.json(update);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  checkTaskAccess("write"),
  async (req, res, next) => {
    try {
      await Task.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
