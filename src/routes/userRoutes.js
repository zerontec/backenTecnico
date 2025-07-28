const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  desactivateUser,
  changeRole,
  filterByRole,
  filterByStatus,
  changeStatus
} = require("../controllers/userController");
const {authMiddleware} = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoleMiddleware");
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const { userValidation } = require("../validations/userValidation");
// const { authorizeRoles } = require("../middlewares/authorizeRoleMiddleware");

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene todas los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/",authMiddleware,authorizeRoles("admin", "supervisor"), getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtiene un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a obtener
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/:id",authMiddleware,authorizeRoles("admin"), getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualiza un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id",authMiddleware,authorizeRoles("admin"), updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado   
 */
router.delete("/:id",authMiddleware,authorizeRoles("admin"), deleteUser);

/**
 * @swagger
 * /users/{id}/desactiveUser:
 *   put:
 *     summary: Desactiva un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a desactivar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id/toggle-status",authMiddleware,authorizeRoles("admin"), changeStatus);

/**
 * @swagger
 * /users/{id}/changeRole:
 *   put:
 *     summary: Cambia el rol de un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a cambiar el rol
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             enum: ["user", "admin", "operator", "logistics", "supervisor", "veterinarian"]
 *     responses:
 *       200:
 *         description: Usuario cambiado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       404:
 *         description: Usuario no encontrado 
 */
router.put("/:id/changeRole",authMiddleware,authorizeRoles("admin"), changeRole);

/**
 * @swagger
 * /users/role/{role}:
 *   get:
 *     summary: Filtra usuarios por rol
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         description: Rol de los usuarios a filtrar
 *         schema:
 *           type: enum
 *     responses:
 *       200:
 *         description: Lista de usuarios filtrados por rol
 */
router.get("/role/:role",authMiddleware,authorizeRoles("admin"), filterByRole);

/**
 * @swagger
 * /users/status/{status}:
 *   get:
 *     summary: Filtra usuarios por estado
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         description: Estado de los usuarios a filtrar
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de usuarios filtrados por estado
 */
router.get("/status/:status",authMiddleware,authorizeRoles("admin"), filterByStatus);

// con autenticacion para despues
// router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
// router.get("/:id", authMiddleware, authorizeRoles("admin"), getUserById);
// router.put("/:id", authMiddleware, authorizeRoles("admin"), userValidation, updateUser);
// router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);
// router.put("/:id/desactiveUser", authMiddleware, authorizeRoles("admin"), desactivateUser);
// router.put("/:id/changeRole", authMiddleware, authorizeRoles("admin"), changeRole);
// router.get("/role/:role", authMiddleware, authorizeRoles("admin"), filterByRole);
// router.get("/status/:status", authMiddleware, authorizeRoles("admin"), filterByStatus);

module.exports = router;