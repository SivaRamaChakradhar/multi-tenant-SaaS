// middleware/tenant.middleware.js
module.exports = (req, res, next) => {
  if (req.user.role === "super_admin") return next();
  req.tenantId = req.user.tenantId;
  next();
};
