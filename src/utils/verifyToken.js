const jwt = require("jsonwebtoken");

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject("Token inválido o expirado");
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = verifyToken;
