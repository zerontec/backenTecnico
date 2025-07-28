const { body, validationResult } = require("express-validator");

const userValidation = [
  body("name").isLength({ min: 1 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Email is invalid"),
  body("password").isLength({ min: 6 }).withMessage("Password is too short"),
  body("role").isIn(["user", "admin", "operator", "logistics", "supervisor", "veterinarian"]).withMessage("Role is invalid"),
  body("active").isBoolean().withMessage("Active must be a boolean"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
module.exports = userValidation;