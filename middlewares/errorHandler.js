// middlewares/errorHandler.js
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  // If response already sent
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR");
  const message = err.message || "Internal server error";

  const payload = {
    error: {
      code,
      message,
      details: err.details || null,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  res.status(status).json(payload);
};
