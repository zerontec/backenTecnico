// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Exporta como objeto con propiedades nombradas
module.exports = {
          
  authMiddleware: (req, res, next) => {
    const token = req.cookies.accessToken;
    console.log('Cookies recibidas:', req.cookies);
    if (!token) return res.status(401).json({ code: "MISSING_TOKEN" });
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ code: "TOKEN_EXPIRED" });
      }
      res.status(401).json({ code: "INVALID_TOKEN" });
    }
  },

  refreshTokenMiddleware: (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ code: "MISSING_REFRESH_TOKEN" });
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ code: "INVALID_REFRESH_TOKEN" });
    }
  }
};