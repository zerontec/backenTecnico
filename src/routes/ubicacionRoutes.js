const express = require("express");
const router = express.Router();

const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");
const { ubicacionEspecie } = require("../controllers/UbicacionController");



router.get("/species", authMiddleware, authorizeRoles("admin", "veterinarian"), ubicacionEspecie);

module.exports = router;