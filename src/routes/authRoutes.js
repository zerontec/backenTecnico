const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  requestPasswordRecovery,
  refreshToken,
  verifySession,
  check,
  requestPasswordReset,
  handlePasswordReset,
  adminResetPassword, forceChangePassword,
  requestPasswordChange,
  listPasswordChangeRequests,
  handlePasswordChangeRequest,
  verifyToken,
  getToken  
} = require("../controllers/authController");
const router = express.Router();
const authValidation = require("../validations/authValidation");
const { authMiddleware } = require("../middlewares/authMiddleware");
const authorizeRoles = require('../middlewares/authorizeRoleMiddleware');
const authLimiter = require("../utils/rateLimit");
const { refreshTokenMiddleware } = require("../middlewares/authMiddleware");
const verifyCredentials = require("../middlewares/authHandler");
const {authRateLimiter, consumeOnFailure, resetOnSuccess} = require("../middlewares/authRateLimit");
const rateLimit = require("../utils/rateLimit");


const successHandler = (req, res, next) => {
  resetOnSuccess(req,res,next);
  next();
};


router.post("/register", registerUser);


router.post("/login",authRateLimiter,loginUser, resetOnSuccess,);

router.post("/logout", authMiddleware, logout);


router.post('/refresh-token', refreshTokenMiddleware, refreshToken); // Middleware como función

router.get('/verify-session', authMiddleware, verifySession); // Middleware como función

router.post("/recover-password", requestPasswordRecovery);
// router.post("/recover-password-user", requestPasswordRecoveryUser);


// routes/authRoutes.js USUARO SOLICITA AQUI
router.post("/request-password-change", requestPasswordChange);

// routes/adminRoutes.js ADMIN REVISA SOLICTUD APRUEBA ENVI  PASSWAOR TEMPORA
router.get("/password-change-requests", authMiddleware, authorizeRoles("admin"), listPasswordChangeRequests);

router.post("/handle-password-request", authMiddleware, authorizeRoles("admin"), handlePasswordChangeRequest);
//fUERA CAMBAR EL PASSWORS TEMPORAL 

router.get('/get-token', authMiddleware, getToken)


router.post(
  '/force-change-password',
  authMiddleware,
  forceChangePassword
);



// Recuperación de contraseña por el usaurio 
router.post('/forgot-password', authLimiter, requestPasswordReset);

router.post('/reset-password', handlePasswordReset);

// Reset por administrador 
router.post(
  '/admin/reset-password',
  authMiddleware,
  authorizeRoles("admin"),
  adminResetPassword
);

router.post("/reset-password", handlePasswordReset);


router.get('/check', authMiddleware, check)

// Backend - routes/authRoutes.js
router.get("/verify-token", authMiddleware, verifyToken)



module.exports = router;
