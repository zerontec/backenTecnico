const SubespecieService = require("../services/subSpecieServices");

exports.crearSubespecie = async (req, res) => {
  try {
    const subespecie = await SubespecieService.crear(req.body);
    res.status(201).json(subespecie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listarSubespecies = async (req, res) => {
  try {
    const subespecies = await SubespecieService.listar();
    res.json(subespecies);
  } catch (error) {
    res.status(500).json({ error: "Error al listar subespecies" });
  }
};

exports.listarSubespeciesId = async (req, res) => {
  try {
    const { especieId } = req.query;
    const subespecies = await SubespecieService.listarId(especieId);
    res.json({ success: true, data: subespecies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};






exports.actualizarSubespecie = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Validación básica de entrada
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Datos de actualización no proporcionados",
      });
    }

    const subespecieActualizada = await SubespecieService.actualizar(id, data);

    res.status(200).json({
      success: true,
      data: subespecieActualizada,
      message: "Subespecie actualizada exitosamente",
    });

  } catch (error) {
    // Manejo específico de errores conocidos
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("ya está registrado")) statusCode = 409;
    if (error.message.includes("clase Sexual asociadas asociadas")) statusCode = 409; // Conflicto por dependencias

    res.status(statusCode).json({
      success: false,
      error: error.message,
      details: statusCode === 400 ? "Solicitud inválida" : undefined,
    });
  }
};

exports.eliminarSubespecie = async (req, res) => {
  try {
    await SubespecieService.eliminar(req.params.id);
    res.json({ message: "Subespecie eliminada" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



exports.eliminarSubespecie  = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await SubespecieService.eliminarSubespecie (id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrada")) statusCode = 404;
    if (error.message.includes("clase sexual  asociadas")) statusCode = 409;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      bloqueado: error.message.includes("clase sexual  asociadas"),
    });
  }
};
