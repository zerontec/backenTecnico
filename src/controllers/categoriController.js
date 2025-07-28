// controllers/categoriaController.js
const CategoriaService = require("../services/categoriServices");

exports.crearCategoria = async (req, res) => {
  try {
    const categoria = await CategoriaService.crear(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

exports.listarCategorias  = async (req, res) => {
  try {
    const categoria = await CategoriaService.listar();
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al listar especies" });
  }
};


exports.listarCategoriasId = async (req, res) => {
  try {
    const { claseSexualId } = req.query;
    const items = await CategoriaService.listarId(claseSexualId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



//Actualizar categoria 
exports.actualizarCategoria= async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Datos de actualización no proporcionados",
      });
    }

    const categoriaActualizada = await CategoriaService.actualizar(id, data);

    res.status(200).json({
      success: true,
      data: categoriaActualizada,
      message: "Categoria actualizada exitosamente",
    });

  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("ya registrado")) statusCode = 409;
    // if (error.message.includes("subespecies asociadas")) statusCode = 409; // Conflicto por dependencias

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

// Eliminar especie
exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await CategoriaService.eliminarCategoria(id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      message: error.message, // Usar siempre 'message' para consistencia
      bloqueado: error.message.includes("registros relacionados")
    });
  }
};