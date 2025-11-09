// middlewares/checkPremiumFeature.js
module.exports = function checkPremiumFeature(req, res, next) {
  const user = req.user;
  if (user.role === "admin") return next();

  const { priority } = req.body || {};
  if (priority === "high") {
    if (
      user.isPremium &&
      (!user.subscriptionExpiry ||
        new Date(user.subscriptionExpiry) > new Date())
    ) {
      return next();
    }

    // แก้ไข: โยน Error 403
    const err = new Error(
      "High priority tasks require active premium subscription"
    );
    err.statusCode = 403;
    err.code = "PREMIUM_REQUIRED";
    return next(err);
  }
  next();
};
