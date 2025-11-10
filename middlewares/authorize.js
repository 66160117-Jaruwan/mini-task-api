// RBAC (Role-Based Access Control) Middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    if (!roles.includes(req.user.role)) {
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

// Rate limit configurations ตาม role
const getRateLimit = (role) => {
  switch (role) {
    case 'premium':
      return 500; // 500 req/15min
    case 'admin':
      return 1000; // 1000 req/15min
    default:
      return 100; // 100 req/15min for normal users
  }
};

module.exports = {
  authorize,
  getRateLimit
};
