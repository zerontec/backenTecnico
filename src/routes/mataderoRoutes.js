const express = require("express");
const mataderoController = require("../controllers/mataderoController");
const {
  validateCrearMatadero,
  validateActualizarMatadero,
} = require("../validations/mataderovalidations");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");

const router = express.Router();

router.post("/create",authMiddleware, authorizeRoles("admin","veterinarian", 'supervisor'),  mataderoController.crearMatadero);


router.get("/get-all",authMiddleware, authorizeRoles("admin","veterinarian", 'supervisor'), mataderoController.getAllMataderos )


router.get('/mataderos-simle', authMiddleware, authorizeRoles("admin","veterinarian", 'supervisor'), mataderoController.getAllMataderosSimple);

router.get('/mataderos-paginado', authMiddleware, authorizeRoles("admin","veterinarian", 'supervisor'), mataderoController.getAllMataderosPaginado);

router.put("/update/:id", authMiddleware,
  authorizeRoles("admin", "veterinarian" ,"supervisor"), 
  // validateActualizarMatadero, 
  mataderoController.actualizarMatadero
);
router.get("/list",authMiddleware, authorizeRoles("admin","veterinarian", "supervisor"), mataderoController.listarMataderos);

router.delete("/eliminar/:id",authMiddleware, authorizeRoles("admin"), mataderoController.eliminarMataderos);


router.put(
  '/mataderos/:mataderoId/asignar-veterinario',
  authMiddleware,
  authorizeRoles("admin", "supervisor"),
  mataderoController.asignarVeterinario
);

router.put(
  '/mataderos/:mataderoId/veterinarios',
  authMiddleware,
  authorizeRoles("admin", "supervisor"),
  mataderoController.gestionarVeterinarios
);

router.delete(
  '/mataderos/:mataderoId/veterinarios',
  authMiddleware,
  authorizeRoles("admin"),
  mataderoController.removerVeterinario)




module.exports = router;
