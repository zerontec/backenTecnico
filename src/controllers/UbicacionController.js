
const UbicacionService = require('../services/UbicacionServices');
exports.ubicacionEspecie = async (req, res) => {
try {
    const estados = await UbicacionService.listarEstados();
    res.json(estados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}