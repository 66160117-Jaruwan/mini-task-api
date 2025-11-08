// middlewares/checkPremiumFeature.js
module.exports = function checkPremiumFeature(req, res, next) {
  const user = req.user;
  // If admin, allow
  if (user.role === "admin") return next();

  // If creating a task and priority=high in body
  const { priority } = req.body || {};
  if (priority === "high") {
    // must be premium and subscription not expired
    if (
      user.isPremium &&
      (!user.subscriptionExpiry ||
        new Date(user.subscriptionExpiry) > new Date())
    ) {
      return next();
    }
    return res
      .status(403)
      .json({
        error: {
          code: "PREMIUM_REQUIRED",
          message: "High priority tasks require active premium subscription",
        },
      });
  }
  next();
};
