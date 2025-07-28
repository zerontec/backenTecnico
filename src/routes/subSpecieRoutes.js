const express = require("express");
const router = express.Router();
const subespecieController = require("../controllers/subSpecieController");
const { validateSubespecie } = require("../validations/specievalidations");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("admin"),
//   validateSubespecie,
  subespecieController.crearSubespecie
);

router.get("/list",authMiddleware,
  authorizeRoles("admin","veterinarian","supervisor"), subespecieController.listarSubespecies);

  router.get("/list/id",authMiddleware,
    authorizeRoles("admin","veterinarian","supervisor"), subespecieController.listarSubespeciesId);


router.put("/update/:id", authMiddleware, authorizeRoles("admin"), subespecieController.actualizarSubespecie);
router.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), subespecieController.eliminarSubespecie);

module.exports = router;