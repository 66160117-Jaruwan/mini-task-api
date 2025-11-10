// 6. middlewares/checkTaskAccess.js
const Task = require("../models/taskModel");

module.exports = function checkTaskAccess(action) {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await Task.findById(taskId);

      if (!task) {
        // แก้ไข: โยน Error 404
        const err = new Error("Task not found");
        err.statusCode = 404;
        err.code = "NOT_FOUND";
        return next(err);
      }

      const isPublic = !!task.isPublic;

      // 1. เช็ค Public Read ก่อน (สำหรับคนไม่ล็อกอิน)
      if (action === "read" && isPublic) {
        return next();
      }

      // 2. ถ้า Task ไม่ Public (หรือ Action ไม่ใช่ Read)
      // "ต้อง" มีการล็อกอิน
      const user = req.user;
      if (!user) {
        const err = new Error(
          "Authentication required to access this resource"
        );
        err.statusCode = 401;
        err.code = "UNAUTHORIZED";
        return next(err);
      }

      // 3. ถ้าล็อกอินแล้ว ค่อยเช็คสิทธิ์ส่วนตัว
      const isAdmin = user.role === "admin";
      const isOwner = user.id === task.ownerId;
      const isAssignee = user.id === task.assignedTo;

      if (action === "read") {
        if (isOwner || isAssignee || isAdmin) return next();
      } else if (action === "write") {
        if (isOwner || isAdmin) return next();
      }

      // แก้ไข: โยน Error 403 (ถ้าไม่เข้าเงื่อนไข)
      const err = new Error(
        "You do not have permission to perform this action"
      );
      err.statusCode = 403;
      err.code = "ACCESS_DENIED";
      return next(err);
    } catch (err) {
      next(err); // ส่ง Error จาก DB (เช่น findById พัง)
    }
  };
};
