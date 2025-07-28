
const express = require("express");
const router = express.Router();
const especieController = require("../controllers/specieController");
const { validateEspecie } = require("../validations/specievalidations");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("admin"),
//   validateEspecie,
  especieController.crearEspecie
);

router.get("/list",authMiddleware,authorizeRoles("admin", "veterinarian","supervisor"), especieController.listarEspecies);
router.put("/update/:id", authMiddleware, authorizeRoles("admin"), especieController.actualizarEspecie);
router.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), especieController.eliminarEspecie);
router.get("/list-specie",authMiddleware,authorizeRoles("admin", "veterinarian","supervisor"), especieController.OtralistarEspecies);
module.exports = router;