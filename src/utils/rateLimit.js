const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Demasiados intentos fallidos, intente más tarde"
  }, standardHeaders: true, 
  legacyHeaders: false, 
});


module.exports= authLimiter;