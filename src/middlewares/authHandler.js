const User = require("../models/User");
const bcrypt = require("bcrypt");
const { resetOnSuccess } = require("./authRateLimit");
const jwt = require("jsonwebtoken");

const verifyCredentials = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Manejo de cambio de contraseña forzado
    if (user.force_password_change) {
      const tempToken = jwt.sign(
        { id: user.id, forceChange: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({
        code: "FORCE_PASSWORD_CHANGE",
        token: tempToken
      });
    }

    // Marcamos éxito
    req.user = user;
    req.loginSuccessful = true;
    
    // Resetear rate limiter
    await resetOnSuccess(req);
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verifyCredentials;