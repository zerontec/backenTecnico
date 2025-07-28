const { Matadero, User } = require('../models');
const { Op } = require('sequelize');

class MataderoService {
  static async crearMatadero(datos, usuario) {
   
    if (usuario.role === 'admin') {
      return Matadero.create({
        ...datos,
        veterinarioId: datos.veterinarioId || null, 
      });
    }


    if (usuario.role === 'veterinarian') {
      return Matadero.create({
        ...datos,
        veterinarioId: usuario.id, 
      });
    }

    throw new Error('Acceso no autorizado');
  }


// services/MataderoService.js
static async asignarVeterinario(mataderoId, veterinarioId) {
  // Validar existencia del matadero
  const matadero = await Matadero.findByPk(mataderoId);
  if (!matadero) throw new Error('Matadero no encontrado');

  // Si se envía veterinarioId, validar que exista y sea veterinario
  if (veterinarioId) {
    const veterinario = await User.findByPk(veterinarioId);
    if (!veterinario || veterinario.role !== 'veterinarian') {
      throw new Error('Usuario no es un veterinario válido');
    }
  }

  return matadero.update({ veterinarioId });
}

  //actualizar mataderos 
static async actualizar(id, data, usuario) { 
  const matadero = await Matadero.findByPk(id);
  
  if (!matadero) {
    throw new Error("Matadero no encontrado");
  }


  if (usuario.role === 'veterinario') {
    if (matadero.veterinarioId !== usuario.id) {
      throw new Error('No tienes permiso para actualizar este matadero');
    }
  }

  // Admin puede actualizar cualquier matadero
  return matadero.update(data);
}



//Listar mataderos


static async listarMataderos(usuario, { page, limit }, filters = {}) {
  const offset = (page - 1) * limit;

  // Condiciones iniciales: si el usuario no es admin, limitar por veterinarioId
  const where = { ...filters };
  if (usuario.role !== 'admin') {
    where.veterinarioId = usuario.id;
  }

  const { rows, count } = await Matadero.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return {
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
}



static getAllMataderosService = async ({ 
  page = 1, 
  limit = 100,
  nombre,
  ubicacion,
  municipio
}) => {
  const offset = (page - 1) * limit;
  
  // Construir condiciones WHERE dinámicas
  const where = {};
  
  if (nombre) where.nombre = { [Op.iLike]: `%${nombre}%` };
  if (ubicacion) where['$ubicacion.estado$'] = { [Op.iLike]: `%${ubicacion}%` };
  if (municipio) where['$ubicacion.municipio$'] = municipio;

  const { count, rows } = await Matadero.findAndCountAll({
    where,
    limit,
    offset,
    include: [{
      model: User,
      as: 'veterinarios',
      through: { attributes: [] }, // Excluir atributos de la tabla intermedia
      attributes: ['id', 'name', 'email'], // Selecciona los campos que necesitas
      required: false // Para incluir mataderos sin veterinarios
    }]
  });

  return {
    data: rows,
    total: count,
    mataderos: rows,
    totalPages: Math.ceil(count / limit)
  };
};




static getAllMataderosServicePaginado = async ({ 
  page = 1, 
  limit = 10,
  nombre,
  estado,
  municipio
}) => {
  const offset = (page - 1) * limit;
  
  const where = {};
  const include = [{
    model: User,
    as: 'veterinarios',
    through: { attributes: [] },
    attributes: ['id', 'name', 'email'],
    required: false
  }];

  // Optimización para contar sin traer registros
  const countOptions = {
    where,
    include,
    distinct: true,
    col: 'Matadero.id' // Columna principal para el count
  };

  // Primero obtener el total
  const count = await Matadero.count(countOptions);

  // Luego obtener los registros paginados
  const rows = await Matadero.findAll({
    where,
    include,
    limit,
    offset,
    order: [['nombre', 'ASC']], // Ordenar por nombre
    subQuery: false // Para mejor performance en paginación
  });

  return {
    data: rows,
    total: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
    hasMore: page < Math.ceil(count / limit)
  };
};














  static async obtenerPorVeterinario(veterinarioId) {
    return Matadero.findAll({
      where: { veterinarioId }
    });
  }



  static async eliminar(id) {
console.log("ID EN SERVICES ", id)
    if (!id.match(/^[0-9a-fA-F-]{36}$/)) {
      throw new Error("ID no válido");
    }

    const matadero = await Matadero.findByPk(id);
    if (!matadero) {
      throw new Error("Matadero no encontrado");
    }

    await matadero.destroy();
    return true;
  }




  static async gestionarVeterinarios(mataderoId, veterinarioIds) {
    const matadero = await Matadero.findByPk(mataderoId);
    if (!matadero) throw new Error('Matadero no encontrado');
    
    // Validar que todos los IDs son veterinarios válidos
    const veterinarios = await User.findAll({
      where: {
        id: veterinarioIds,
        role: 'veterinarian'
      }
    });
    
    if (veterinarios.length !== veterinarioIds.length) {
      throw new Error('Algunos veterinarios no son válidos');
    }
  
    await matadero.setVeterinarios(veterinarios); // Método de Sequelize para relaciones muchos a muchos
    return matadero.reload({ include: ['veterinarian'] });
  }







  static async removerVeterinario(mataderoId, veterinarioId) {
    const matadero = await Matadero.findByPk(mataderoId);
    if (!matadero) throw new Error('Matadero no encontrado');
    
    const veterinario = await User.findByPk(veterinarioId);
    if (!veterinario || veterinario.role !== 'veterinarian') {
      throw new Error('Veterinario no válido');
    }
  
    await matadero.removeVeterinario(veterinario); // Método de Sequelize para relaciones muchos a muchos
    return matadero.reload({ include: ['veterinarian'] });
  }

 static async getAllMataderosSimple() {
    try {
      return await Matadero.findAll({
        include: [{
          model: Ubicacion,
          attributes: ['estado', 'municipio']
        }],
        order: [['nombre', 'ASC']]
      });
    } catch (error) {
      throw error;
    }
  }


}

 

module.exports = MataderoService;