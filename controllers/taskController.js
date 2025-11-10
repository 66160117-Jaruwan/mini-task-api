const { v4: uuidv4 } = require("uuid");
const Task = require("../models/taskModel");

// --- ฟังก์ชัน V1 (สำหรับ routes/tasks.v1.js) ---
exports.getAllTasksV1 = (req, res, next) => {
  const { status, priority, assignedTo, isPublic, sort } = req.query;
  const filters = { status, priority, assignedTo, isPublic, sort };
  const pagination = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
  };
  Object.keys(filters).forEach(
    (key) => filters[key] === undefined && delete filters[key]
  );

  Task.getAll(filters, pagination, (err, data) => {
    if (err) return next(err);
    res.json({
      count: data.count,
      filters: filters,
      tasks: data.tasks,
    });
  });
};

// --- ฟังก์ชัน V2 (สำหรับ routes/tasks.v2.js) ---
exports.getAllTasksV2 = (req, res, next) => {
  const { status, priority, assignedTo, isPublic, sort } = req.query;
  const filters = { status, priority, assignedTo, isPublic, sort };
  const pagination = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
  };
  Object.keys(filters).forEach(
    (key) => filters[key] === undefined && delete filters[key]
  );

  Task.getAll(filters, pagination, (err, data) => {
    if (err) return next(err);
    res.json({
      count: data.count,
      filters: filters,
      tasks: data.tasks,
      metadata: {
        version: "v2",
        timestamp: new Date().toISOString(),
      },
    });
  });
};

// ดึงงานตาม id ใช้ร่วมกัน (V1 และ V2)
exports.getTaskById = (req, res, next) => {
  const { id } = req.params;
  Task.getById(id, (err, results) => {
    if (err) return next(err);
    if (results.length === 0) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      return next(error);
    }
    res.json(results[0]);
  });
};

// สร้างงานใหม่
exports.createTask = (req, res, next) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    ownerId: req.user.id,
  };
  Task.create(data, (err, result) => {
    if (err) return next(err);
    res.status(201).json(data);
  });
};

// อัปเดตงาน
exports.updateTask = (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  Task.update(id, data, (err) => {
    if (err) return next(err);
    res.json({ message: "Task updated successfully" });
  });
};

// ลบงาน
exports.deleteTask = (req, res, next) => {
  const { id } = req.params;
  Task.delete(id, (err) => {
    if (err) return next(err);
    res.json({ message: "Task deleted successfully" });
  });
};

exports.updateTaskStatus = (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // 1. ตรวจสอบสถานะที่ส่งมา

  const validStatuses = ["pending", "in progress", "completed"];
  if (!validStatuses.includes(status)) {
    const error = new Error(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    );
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    return next(error); // โยน Error ไปที่ errorHandler
  } // 2. อัปเดตสถานะงาน
  Task.update(id, { status }, (err) => {
    if (err) return next(err);
    res.json({ message: "Task status updated successfully" });
  });
};
