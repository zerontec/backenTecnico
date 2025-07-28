// routes/categoriaRoutes.js
const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriController");
const { validateCategoria } = require("../validations/claseSexuallvalidation");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");

router.post(  
  "/create",
  authMiddleware,
  authorizeRoles("admin"),
//   validateCategoria,
  categoriaController.crearCategoria
);
router.get("/list",authMiddleware,authorizeRoles("admin", "veterinarian","supervisor"), categoriaController.listarCategorias);
router.get("/list/id",authMiddleware,authorizeRoles("admin", "veterinarian","supervisor"), categoriaController.listarCategoriasId);

router.put("/update/:id", authMiddleware, authorizeRoles("admin"), categoriaController.actualizarCategoria);
router.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), categoriaController.eliminarCategoria);




module.exports = router;