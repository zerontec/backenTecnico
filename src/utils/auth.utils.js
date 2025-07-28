const {User }= require("../models/User");
const { Op } = require("sequelize");


const invalidateOldTokens = async (userId) => {
    // Ejemplo: Agregar timestamp a una lista negra
    const invalidateTimestamp = Date.now();
    await User.update(
      { token_invalidate_at: invalidateTimestamp },
      { where: { id: userId } }
    );
  };

  // Middleware de verificación
const checkTokenValidity = (req, res, next) => {
  if (req.user.token_invalidate_at > req.user.iat * 1000) {
    return res.status(401).json({ code: "TOKEN_INVALIDATED" });
  }
  next();
};
  

  module.exports= 

  {  invalidateOldTokens,checkTokenValidity}
