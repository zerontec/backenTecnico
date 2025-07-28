const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Acceso denegado: no tienes los permisos necesarios' });
    }
    next();
  };
};
module.exports = authorizeRoles;