// middlewares/auth.middleware.js
const required = async (req, res, next) => {
    // ... lógica de autenticación
  };
  
  const checkForcePasswordChange = (req, res, next) => {
    if (req.user.force_password_change) {
      return res.status(403).json({
        error: "Debes cambiar tu contraseña",
        code: "FORCE_PASSWORD_CHANGE"
      });
    }
    next();
  };
  
  // Exporta como objeto
  module.exports = {
    required,
    checkForcePasswordChange
  };