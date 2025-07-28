const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticascontroller");
const {authMiddleware} = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoleMiddleware');





router.get('/', authMiddleware, authorizeRoles("admin"), estadisticasController.obtenerEstadisticas);
router.get('/excel', authMiddleware, authorizeRoles("admin"), estadisticasController.generarExcel);
router.get('/beneficios-por-estado', authMiddleware, authorizeRoles("admin"), estadisticasController.obtenerEstadisticasPorEstado);
router.get('/eficiencia-mataderos', authMiddleware, authorizeRoles("admin"), estadisticasController.eficienciaMatadero);
router.get('/excel-estados', authMiddleware, authorizeRoles("admin"), estadisticasController.exportarExcel);
router.get('/generales',authMiddleware,authorizeRoles('admin', 'supervisor'),estadisticasController.obtenerEstadisticasGenerales);
router.get('/reporte-semanal', authMiddleware, authorizeRoles("admin"), estadisticasController.reporteSemanal);
router.get('/incidencias', authMiddleware, authorizeRoles("admin"), estadisticasController.obtenerEstadisticasIncidencias);
router.get('/reporte-consolidado', authMiddleware, authorizeRoles("admin"), estadisticasController.reporteConsolidado);
router.get('/reportes/estadisticas/exportar', authMiddleware, estadisticasController.exportarReporteEstadistico);
router.get('/reportes/estadisticas/exportar-estados', authMiddleware, estadisticasController.exportarEstadisticasExcelEstados);
module.exports = router;