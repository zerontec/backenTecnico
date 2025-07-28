const MataderoService = require("../services/mataderoService");
const { Op } = require('sequelize'); // Asegurate de importar Op desde Sequelize




exports.crearMatadero = async (req, res) => {
  try {
    const matadero = await MataderoService.crearMatadero(
      req.body,
      req.user 
    );
    res.status(201).json(matadero);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El nombre ya está registrado" });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.asignarVeterinario = async (req, res) => {
  try {
    const matadero = await MataderoService.asignarVeterinario(
      req.params.mataderoId, // <-- Asegurar que el nombre del parámetro coincide
      req.body.veterinarioId
    );
    res.json(matadero);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//Lista matadero Controller



exports.listarMataderos = async (req, res) => {
  try {
    const { page = 1, limit = 10, nombre } = req.query;
    const estado = req.query['ubicacion.estado'];
    const municipio = req.query['ubicacion.municipio'];

    const filters = {};
    if (nombre && nombre.trim() !== "") {
      filters.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    if (estado && estado.trim() !== "") {
      filters['ubicacion.estado'] = { [Op.iLike]: `%${estado}%` };
    }
    if (municipio && municipio.trim() !== "") {
      filters['ubicacion.municipio'] = { [Op.iLike]: `%${municipio}%` };
    }

    const paginationParams = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const result = await MataderoService.listarMataderos(req.user, paginationParams, filters);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error en listarMataderos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mataderos'
    });
  }
};

exports.getAllMataderos = async (req, res) => {
  try {   
    
    const result = await MataderoService.getAllMataderosService({
      page: req.query.page,
      limit: req.query.limit,
      nombre: req.query.nombre,
      ubicacion: req.query.ubicacion,
      municipio: req.query.municipio,
      
    });

    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllMataderosPaginado = async (req, res) => {
  try {
    
    const result = await MataderoService.getAllMataderosServicePaginado({
      page: req.query.page,
      limit: req.query.limit,
      nombre: req.query.nombre,
      estado: req.query.estado,
      municipio: req.query.municipio,
      
    });

    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//actualizar Matadro
exports.actualizarMatadero = async (req, res) => {
  try {
    const matadero = await MataderoService.actualizar(
      req.params.id,
      req.body,
      req.user 
    );
    res.status(200).json({ message: "Matadero actualizado", matadero });
  } catch (error) {
    res.status(403).json({ error: error.message }); 
  }
};




exports.eliminarMataderos = async (req, res) => {
  try {
    const { id } = req.params; 
    // HTMLFormControlsCollection.log("ID matadero", id )
    await MataderoService.eliminar(id);
    res.status(200).json({ message: "Matadero eliminado",id:id });
  } catch (error) {
    if (error.message === "Matadero no encontrado") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "ID no válido") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};




exports.removerVeterinario = async (req, res) => {
  try {
    const matadero = await MataderoService.removerVeterinario(
      req.params.mataderoId,
      req.body.veterinarioId
    );
    res.json(matadero);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.gestionarVeterinarios = async (req, res) => {
  try {
    const matadero = await MataderoService.gestionarVeterinarios(
      req.params.mataderoId,
      req.body.veterinarioIds
    );
    res.json(matadero);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getAllMataderosSimple = async (req, res) => {
  try {
    const mataderos = await MataderoService.getAllMataderosSimple();
    res.json({ success: true, data: mataderos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al cargar mataderos' });
  }
};
