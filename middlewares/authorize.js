// 5. middlewares/authorize.js
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    if (!roles.includes(req.user.role)) {
      // แก้ไข: โยน Error 403
      const err = new Error(
        "You do not have permission to perform this action"
      );
      err.statusCode = 403;
      err.code = "ACCESS_DENIED";
      return next(err);
    }
    next();
  };
};

module.exports = authorize;
