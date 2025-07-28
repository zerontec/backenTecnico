const { User } = require("../models");
const { Op } = require("sequelize");
const {sendEmail, sendStatusChangeNotification} = require("../services/emailServices");


const getAllUsersService = async ({ 
  page = 1, 
  limit = 10,
  name,
  email,
  role,
  status 
}) => {
  const offset = (page - 1) * limit;
  
  // Construir condiciones WHERE dinámicas
  const where = {};
  
  if (name) where.name = { [Op.iLike]: `%${name}%` };
  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (role) where.role = role;
  if (status) where.status = status;

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    attributes: { 
      exclude: ['password'] 
    }
  });

  return {
    total: count,
    users: rows,
    totalPages: Math.ceil(count / limit)
  };
};


const getUserByIdService = async (id) => {
  const user = await User.findOne({
    where: { id },
  });
  return user;
};

const updateUserService = async (id, user) => {
  const updatedUser = await User.update(user, {
    where: { id },
  });
  return updatedUser;
};

const deleteUserService = async (id) => {
  const deletedUser = await User.destroy({ 
    where: { id },
    force: true 
  }); 
  return deletedUser;
};

const desactivateUserService = async (id) => {
  const updatedUser = await User.update({ status: false }, {
    where: { id },
  });
  return updatedUser;
};

const changeRoleService = async (id, role) => {
  const updatedUser = await User.update({ role }, {
    where: { id },
  });
  console.log(updatedUser);
  return updatedUser;
};

const changeStatusService = async (id, status) => {
  // Usa paranoid: false para ignorar el borrado lógico
  const user = await User.findByPk(id, {
    paranoid: false // ¡IMPORTANTE!
  });
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  


  // Actualiza el estado
  user.status = status;
  
  // Guarda y recarga desde la base de datos
  await user.save();
  await user.reload();
  
  try {
    await sendStatusChangeNotification(user, status);
  } catch (emailError) {
    console.error('❌ Error enviando notificación al usuario:', emailError.message);
    // No rompes el flujo principal, solo registras el error
  }

  return user;
};



const filterByRoleService = async (role) => {
  const users = await User.findAll({
    where: { role },
  });
  return users;
};

const filterByStatusService = async (status) => {
  const users = await User.findAll({
    where: { status },
  });
  return users;
};

module.exports = {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  desactivateUserService,
  changeRoleService,
  filterByRoleService,
  filterByStatusService,
  changeStatusService
};