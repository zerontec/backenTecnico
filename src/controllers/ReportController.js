const { ReporteDiario, DetalleBeneficio } = require('../models');
const { NotificationService } = require('../services/notificationService');
const ReporteService = require('../services/reporteService');
const { sendEmail } = require("../services/emailServices");


/* The `exports.crearReporte` function is responsible for creating a new report. Here is a breakdown of
what it does: */
exports.crearReporte = async (req, res) => {
  try {
    const reporte = await ReporteService.crearReporteCompleto(req.body, req.user.id);
    // const notificationService = new NotificationService(sequelize, req.io);

    // Notificar a todos los admins
    // await notificationService.notifyAdminsAboutReport(reporte, req.user);
//     const userName = req.user ? req.user.name : "Usuario no definido";

// await sendEmail({
//   to: "admin@example.com", // o lista de admins
//   subject: "📝 Nuevo reporte creado",
//   html: `
//     <h2>Nuevo reporte creado</h2>
//     <p><strong>Usuario:</strong> ${userName}</p>
//     <p><strong>Título:</strong> ${reporte.matadero}</p>
//     <p><strong>Descripción:</strong> ${reporte.descripcion}</p>
//   `
// });


    res.status(201).json({ success: true, data: reporte });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* The `exports.listarReportesAdmin` function is responsible for listing all reports for an admin user.
Here is a breakdown of what it does: */

// Controlador para búsqueda
exports.buscarReportes = async (req, res) => {
  try {
    const { pagina = 1, porPagina = 10, ...filtros } = req.query;

    const result = await ReporteService.buscarReportes(
      filtros,
      { pagina: parseInt(pagina), porPagina: parseInt(porPagina) }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
};

// Controlador original para listado completo
exports.listarReportes = async (req, res) => {
  try {
    const { pagina = 1, porPagina = 10 } = req.query;
    
    const result = await ReporteService.listarTodosReportes(
      parseInt(pagina),
      parseInt(porPagina)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//esta es la que se usa para listar todos los reportes
exports.listarTodosReportes = async (req, res) => {
  try {
    const { page = 1, limit = 10, veterinario, fecha_inicio, fecha_fin, matadero } = req.query;
    
    const result = await ReporteService.listarTodosReportes(
      parseInt(page),
      parseInt(limit),
      {
        veterinario,
        fecha_inicio,
        fecha_fin,
        matadero
      }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error en getReportesAdmin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//ETS ES LA QUE SE USA  LISTA REPORTE POR USURIO VETERINARIO 

exports.listarReportesUsuario = async (req, res) => {
  try {
    const { page = 1, limit = 10, veterinario, fecha_inicio, fecha_fin, matadero } = req.query;
    const veterinarioId = req.user.id; // ID del veterinario autenticado

    const result = await ReporteService.listarReportesUsuario(
      veterinarioId,
      parseInt(page),
      parseInt(limit),
      {
        veterinario,
        fecha_inicio,
        fecha_fin,
        matadero
      }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error en getReportesVet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener reportes'
    });
  }
};

//ESTA E S LA QUE SU USA PARA ADMIN DETALLE REPORTE 
exports.obtenerReporteAdmin = async (req, res) => {
  try {
    const reporte = await ReporteService.obtenerReporteParaAdmin(req.params.id);
    res.json({ success: true, data: reporte });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};


//DETALE REPORTE POR USURIO VETERINARIO 
exports.obtenerReporte = async (req, res) => {
  try {
    const reporte = await ReporteService.obtenerReporteConDetalles(req.params.id, req.user.id);
    res.json({ success: true, data: reporte });
  } catch (error) {
    let statusCode = 404;
    if (error.message.includes("no autorizado")) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};








// Editar reporte
exports.editarReporte = async (req, res) => {
  try {
    
      console.log("Datos recibidos en el backend:", {
        reporteId: req.params.id,
        reporteData: req.body.reporteData,
        usuario: req.body.usuario
      });
  
      if (!req.params.id || !req.body.reporteData) {
        return res.status(400).json({
          success: false,
          error: "Datos incompletos"
        });
      }
  
      // Sanitizar datos
      const sanitizedData = {
        ...req.body.reporteData,
        estado: req.body.usuario.role === 'admin' 
          ? req.body.reporteData.estado 
          : 'borrador' // Solo admin cambia estado
      };
  
      const reporteActualizado = await ReporteService.editarReporteCompleto(
        req.params.id,
        sanitizedData,   
        req.body.usuario
      );
  
      res.status(200).json({
        success: true,
        data: reporteActualizado
      });
    } catch (error) {
      // Manejo de errores mejorado
      const statusCode = error.message.includes("no autorizado") ? 403 
        : error.message.includes("no encontrado") ? 404 
        : 400;
      
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  };




exports.eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    await ReporteService.eliminarReporte(id, req.user.id);
    
    res.status(200).json({
      success: true,
      message: "Reporte eliminado exitosamente"
    });

  } catch (error) {
    let statusCode = 400;
    if (error.message.includes("no encontrado")) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }







  exports.enviarReporte = async (req, res) => {
    try {
      const reporte = await ReporteService.marcarReporteComoEnviado(req.params.id, req.user);
      res.json({ success: true, data: reporte });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
  






};



