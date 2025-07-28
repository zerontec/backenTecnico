

const EstadisticaService = require('../services/estaditicasService');
const {Incidencia, ReporteDiario, Matadero} = require('../models');


exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { tipo, ...filtros } = req.query;
    let data;
    switch (tipo) {
      case 'periodo':
        data = await EstadisticaService.beneficiosPorPeriodo(filtros);
        break;
      case 'beneficios-por-estado':
        data = await EstadisticaService.beneficiosPorEstado();
        break;
      case 'top-mataderos':
        data = await EstadisticaService.topMataderos(filtros.limite);
        break;
      case 'tiempo':
        data = await EstadisticaService.tiempoPromedioActividad();
        break;
        case 'beneficios-por-especie':
  data = await EstadisticaService.beneficiosPorEspecie(filtros);
  break;
      default:
        return res.status(400).json({ success: false, error: 'Tipo no válido' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generarExcel = async (req, res) => {
  try {
    const workbook = await EstadisticaService.generarReporteExcel(req.query);
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


exports.obtenerEstadisticasPorEstado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const data = await EstadisticaService.beneficiosPorEstado({
      fechaInicio,
      fechaFin
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

  exports.eficienciaMatadero = async (req, res) => {
    try {
      const data = await EstadisticaService.eficienciaMataderos(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }


exports.estadisticasCompletas = async (req, res) => {
    try {
      const data = await EstadisticaService.estadisticasCompletas(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };



  exports.exportarExcel = async (req, res) => {
      try {
          const data = await EstadisticaService.generarExcel(res, req);
      } catch (error) {
          console.error('Error en exportación:', error);
          res.status(500).json({ success: false, error: 'Error al generar el reporte', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
      }





     


  };


  exports.obtenerEstadisticasGenerales = async (req, res) => {
    try {
      const estadisticas = await EstadisticaService.obtenerEstadisticasGenerales();
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener estadísticas",
        detalles: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  };
  
  exports.reporteSemanal = async (req, res) => {
    try {
      const { fechaInicio, fechaFin, mataderoId, exportar } = req.query;
      
      const reporte = await EstadisticaService.reporteSemanal({
        fechaInicio,
        fechaFin,
        mataderoId: mataderoId ? parseInt(mataderoId) : undefined
      });
  
      if (exportar === 'excel') {
        return await EstadisticaService.exportarReporteSemanal(reporte, res);
      }
  
      res.json(reporte);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  exports.obtenerEstadisticasIncidencias = async (req, res) => {
    try {
      const { fechaInicio, fechaFin, tipo } = req.query;
      
      // Construir condiciones de búsqueda
      const whereClause = {};
      
      if (tipo) {
        whereClause.tipo = tipo;
      }
      
      // Filtro por fechas
      const reporteWhere = {};
      if (fechaInicio && fechaFin) {
        reporteWhere.fecha_reporte = {
          [Op.between]: [fechaInicio, fechaFin]
        };
      }
      
      const incidencias = await Incidencia.findAll({
        where: whereClause,
        include: [{
          model: ReporteDiario,
          as: 'reporte', 
          where: reporteWhere,
          attributes: ['fecha_reporte', 'estado', 'matadero_id'],
          include: [{
            model: Matadero,
            as: 'matadero', 
            attributes: ['nombre']
          }]
        }]
      });
  
      // Procesamiento de datos
      const datosFormateados = incidencias.map(inc => ({
        id: inc.id,
        tipo: inc.tipo,
        cantidad_afectados: inc.cantidad_afectados,
        descripcion: inc.descripcion,
        fecha_reporte: inc.reporte.fecha_reporte, 
        estado: inc.reporte.estado,
        planta: inc.reporte.matadero ? inc.reporte.matadero.nombre : 'Desconocido'
      }));
      
      // CALCULAR RESUMEN CON SUMAS DE CANTIDADES
      const resumen = {
        totalIncidencias: incidencias.length,
        totalVacasPremiadas: incidencias
          .filter(i => i.tipo === 'Vacas preñadas')
          .reduce((sum, i) => sum + i.cantidad_afectados, 0),
        totalComisos: incidencias
          .filter(i => i.tipo === 'Comiso')
          .reduce((sum, i) => sum + i.cantidad_afectados, 0),
        totalOtras: incidencias
          .filter(i => i.tipo !== 'Vacas preñadas' && i.tipo !== 'Comiso')
          .length
      };
  
      res.json({ 
        incidencias: datosFormateados,
        resumen
      });
    } catch (error) {
      console.error('Error en estadísticas de incidencias:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        detalle: error.message 
      });
    }
  };




  exports.reporteConsolidado = async (req, res) => {
    try {
      await EstadisticaService.exportarReporteConsolidado(req.query, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };




    exports.exportarReporteEstadistico = async (req, res) => {
      try {
        const { fechaInicio, fechaFin, especieId } = req.query;
        await EstadisticaService.exportarReporteEstadistico(
          { fechaInicio, fechaFin, especieId },
          res
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };

    exports.exportarEstadisticasExcelEstados = async (req, res) => {
      try {
        const { fechaInicio, fechaFin } = req.query;
        
        await EstadisticaService.exportarEstadisticasExcelEstados(
          { fechaInicio, fechaFin }, 
          res
        );
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };