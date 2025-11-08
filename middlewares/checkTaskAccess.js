// middlewares/checkTaskAccess.js
const Task = require("../models/taskModel");

module.exports = function checkTaskAccess(action) {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await Task.findById(taskId);
      if (!task) {
        return res
          .status(404)
          .json({
            error: {
              code: "NOT_FOUND",
              message: "Task not found",
              path: req.path,
            },
          });
      }

      const user = req.user;
      // ownerId and assignedTo are stored as strings in DB
      const ownerId = task.ownerId;
      const assignedTo = task.assignedTo;

      const isAdmin = user.role === "admin";
      const isOwner = user.id === ownerId;
      const isAssignee = user.id === assignedTo;
      const isPublic = !!task.isPublic;

      if (action === "read") {
        if (isPublic || isOwner || isAssignee || isAdmin) return next();
      } else if (action === "write") {
        if (isOwner || isAdmin) return next();
      } else {
        // default: deny
      }

      return res
        .status(403)
        .json({
          error: {
            code: "ACCESS_DENIED",
            message: "You do not have permission to perform this action",
          },
        });
    } catch (err) {
      next(err);
    }
  };
};
