
const EspecieService = require("../services/specieService");

exports.crearEspecie = async (req, res) => {
  try {
    const especie = await EspecieService.crear(req.body);
    res.status(201).json(especie);
  } catch (error) {
    res.status(409).json({ error: error.message }); 
  }
};

exports.listarEspecies = async (req, res) => {
  try {
    const especies = await EspecieService.listar();
    res.json(especies);
  } catch (error) {
    res.status(500).json({ error: "Error al listar especies" });
  }
};


exports.OtralistarEspecies = async (req, res) => {
try {
  const especies = await EspecieService.listarEspecies();
  res.json(especies);
} catch (error) {
  res.status(500).json({ error: error.message });
}
}



//Actualizar especie 
exports.actualizarEspecie = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Datos de actualización no proporcionados",
      });
    }

    const especieActualizada = await EspecieService.actualizar(id, data);

    res.status(200).json({
      success: true,
      data: especieActualizada,
      message: "Especie actualizada exitosamente",
    });

  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("ya registrado")) statusCode = 409;
    if (error.message.includes("subespecies asociadas")) statusCode = 409; // Conflicto por dependencias

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

// Eliminar especie
exports.eliminarEspecie = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await EspecieService.eliminarEspecie(id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(409).json({
      error: error.message,
      bloqueado: error.message.includes('asociadas')
    });
  }
};


