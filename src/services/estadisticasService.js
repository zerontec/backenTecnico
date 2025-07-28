const { Op } = require('sequelize');
const { Incidencia, ReporteDiario } = require('../models');

// Servicio para manejar lógica de estadísticas
const estadisticasService = {
  obtenerEstadisticasIncidencias: async (fechaInicio, fechaFin) => {
    try {
      const incidencias = await Incidencia.findAll({
        where: {
          afecta_beneficiados: true,
          ...(fechaInicio && fechaFin && {
            createdAt: { [Op.between]: [fechaInicio, fechaFin] }
          })
        },
        include: [ReporteDiario]
      });

      return procesarEstadisticasIncidencias(incidencias);
    } catch (error) {
      throw error;
    }
  }
};

// Función auxiliar para procesar las estadísticas
const procesarEstadisticasIncidencias = (incidencias) => {
  return incidencias.reduce((acc, inc) => {
    const estado = inc.ReporteDiario.estado;
    if (!acc[estado]) {
      acc[estado] = { vacasPremiadas: 0, comisos: 0 };
    }
    
    if (inc.tipo === 'Vacas preñadas') acc[estado].vacasPremiadas += inc.cantidad_afectados;
    if (inc.tipo === 'Comiso') acc[estado].comisos += inc.cantidad_afectados;
    
    return acc;
  }, {});
};

module.exports = estadisticasService;
