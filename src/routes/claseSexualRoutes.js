// routes/claseSexualRoutes.js
const express = require("express");
const router = express.Router();
const claseSexualController = require("../controllers/claseSexualController");
const { validateClaseSexual } = require("../validations/claseSexuallvalidation");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("admin"),
//   validateClaseSexual,
  claseSexualController.crearClaseSexual
);
router.get("/list",authMiddleware, authorizeRoles("admin", "veterinarian","supervisor"), claseSexualController.listarclaseSexuales);
router.get("/list/id",authMiddleware, authorizeRoles("admin", "veterinarian","supervisor"), claseSexualController.listarclaseSexualesId);


router.put("/update/:id", authMiddleware, authorizeRoles("admin"), claseSexualController.actualizarClaseS);
router.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), claseSexualController.eliminarClaseSexual);




module.exports = router;