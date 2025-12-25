module.exports = function requireSameTenant(req, res, next) {
  const { role, tenantId } = req.user;

  // super_admin bypasses tenant restriction
  if (role === "super_admin") return next();

  if (!tenantId) {
    return res.status(403).json({
      success: false,
      message: "Tenant access required"
    });
  }

  req.tenantId = tenantId;
  next();
};
