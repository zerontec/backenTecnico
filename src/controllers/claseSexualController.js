// controllers/claseSexualController.js
const ClaseSexualService = require("../services/claseSexualService");

exports.crearClaseSexual = async (req, res) => {
  try {
    const claseSexual = await ClaseSexualService.crear(req.body);
    res.status(201).json(claseSexual);
  } catch (error) {
    res.status(409).json({ error: error.message }); 
  }
};



exports.listarclaseSexuales = async (req, res) => {
  try {
    const claseSexual = await ClaseSexualService.listar();
    res.json(claseSexual);
  } catch (error) {
    res.status(500).json({ error: "Error al listar las clases Sexuales" });
  }
};


exports.listarclaseSexualesId = async (req, res) => {
  try {
    const { subespecieId } = req.query;
    const items = await ClaseSexualService.listarId(subespecieId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};




exports.actualizarClaseS= async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Datos de actualización no proporcionados",
      });
    }

    const claseSActualizada = await ClaseSexualService.actualizar(id, data);

    res.status(200).json({
      success: true,
      data: claseSActualizada,
      message: "Clase Sexual  actualizada exitosamente",
    });

  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("ya registrado")) statusCode = 409;
    if (error.message.includes("Categorias  asociadas")) statusCode = 409; 

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

exports.eliminarClaseSexual= async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await ClaseSexualService.eliminarClaseSexual(id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("categorias  asociadas")) statusCode = 409;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      bloqueado: error.message.includes("categorias  asociadas"),
    });
  }
}


