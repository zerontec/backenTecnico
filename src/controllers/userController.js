const {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  desactivateUserService,
  changeRoleService,
  filterByRoleService,
  filterByStatusService,
  changeStatusService
} = require("../services/userService");

const getAllUsers = async (req, res) => {
  try {
    const result = await getAllUsersService({
      page: req.query.page,
      limit: req.query.limit,
      name: req.query.name,
      email: req.query.email,
      role: req.query.role,
      status: req.query.status
    });

    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error getting user by id" });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await updateUserService(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; 
    // HTMLFormControlsCollection.log("ID usuario", id )
    await deleteUserService(id);
    res.status(200).json({ message: "usuario eliminado",id:id });
  } catch (error) {
    if (error.message === "usuario no encontrado") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "ID no válido") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};




const desactivateUser = async (req, res) => {
  try {
    const user = await desactivateUserService(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error desactivating user" });
  }
};

const changeRole = async (req, res) => {
  try {
    const user = await changeRoleService(req.params.id, req.body.role);
    res.status(200).json({
      message: "Rol actualizado correctamente",user});
  } catch (error) {
    res.status(500).json({ message: "Error changing user role" });
  }
};

const changeStatus = async (req, res) => {
  console.log(`[CONTROLLER] Cambiando estado usuario: ${req.params.id}`);
  console.log(`[CONTROLLER] Body recibido:`, req.body);  // Verifica TODO el body
  console.log(`[CONTROLLER] Nuevo estado: ${req.body.status}`);
  
  try {
    // Validación adicional
    if (!req.body.status) {
      return res.status(400).json({ message: 'Status es requerido' });
    }

    const user = await changeStatusService(req.params.id, req.body.status);
    
    res.status(200).json({
      message: "Estatus actualizado correctamente",
      user: {
        id: user.id,
        status: user.status
      }
    });
  } catch (error) {
    console.error(`[CONTROLLER] Error: ${error.message}`);
    res.status(500).json({ 
      message: "Error al cambiar el estatus", 
      error: error.message 
    });
  }
};








const filterByRole = async (req, res) => {
  try {
    const users = await filterByRoleService(req.params.role);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error filtering users by role" });
  }
};

const filterByStatus = async (req, res) => {
  try {
    const users = await filterByStatusService(req.params.status);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error filtering users by status" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  desactivateUser,
  changeRole,
  filterByRole,
  filterByStatus,
  changeStatus
};