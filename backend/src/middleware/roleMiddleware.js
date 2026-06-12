const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Authentication is required to access this resource.",
        details: null,
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You do not have the required permissions to access this resource.",
        details: {
          userRole: req.user.role,
          requiredRoles: roles,
        },
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
