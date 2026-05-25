/**
 * Role-based Access Control Middleware
 * Restricts routes to specific user roles
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!hasRole) {
      console.log('DEBUG: Role access denied!', { user: req.user, allowedRoles });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Access denied.',
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
