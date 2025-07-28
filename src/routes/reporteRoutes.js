const express = require('express');
const reporteController = require('../controllers/ReportController');
const {authMiddleware} = require('../middlewares/authMiddleware');
const authorizeRoleMiddleware = require('../middlewares/authorizeRoleMiddleware')
const router = express.Router();




/* This code snippet is defining a POST route in an Express router. When a POST request is made to the
'/create' endpoint, the request will first go through the `authMiddleware` function to ensure
authentication. Then, it will go through the `authorizeRoleMiddleware` function with the roles
"admin" and "veterinarian" specified to check if the user has the necessary roles. Finally, if the
user is authenticated and has the required roles, the request will be handled by the `crearReporte`
function from the `reporteController`, which is responsible for creating a report. */
router.post('/create', 
   authMiddleware,authorizeRoleMiddleware("admin", "veterinarian", "supervisor"), 
  reporteController.crearReporte
);



/* This code snippet is defining a route in an Express router. When a GET request is made to the
'/admin' endpoint, the request will go through the following middleware functions in order: */
//Lista resportes para admin
router.get('/admin', 
  authMiddleware, 
  authorizeRoleMiddleware('admin', 'supervisor'), 
  reporteController.listarTodosReportes
);




router.get('/vet', 
  authMiddleware, 
  authorizeRoleMiddleware('veterinarian'), 
  reporteController.listarReportesUsuario
);


router.get('/reportes/buscar', reporteController.buscarReportes);

router.get('/admin/:id', 
  authMiddleware, 
  authorizeRoleMiddleware('admin', 'supervisor'), 
  reporteController.obtenerReporteAdmin
);



//listar Repostes por veterinario 

/* This code snippet is defining a GET route in an Express router. When a GET request is made to the
'/veterinarian' endpoint, the request will first go through the `authMiddleware` function to ensure
authentication. Then, it will go through the `authorizeRoleMiddleware` function with the role
"veterinarian" specified to check if the user has the necessary role. Finally, if the user is
authenticated and has the required role of "veterinarian", the request will be handled by the
`listarReportesUsuario` function from the `reporteController`, which is responsible for listing
reports for a veterinarian. */
router.get('/veterinarian', 
  authMiddleware, 
  authorizeRoleMiddleware('veterinarian',"admin", "supervisor"), 
  reporteController.listarReportesUsuario
);



//detalle de el reporte por veterinario 
router.get('/veterinarian/:id', 
  authMiddleware, 
  authorizeRoleMiddleware('veterinarian', "admin", "supervisor"), 
  reporteController.obtenerReporte
);

//  router.put('/estado/:id/enviar', authMiddleware, 
//   authorizeRoleMiddleware('veterinarian'), 
//   reporteController.enviarReporte);




router.put('/admin/update/:id', 
  authMiddleware,  authorizeRoleMiddleware('admin', 'supervisor'), 
  reporteController.editarReporte // Middleware de roles dentro del controlador
);

router.delete('/veterinarian/report/delete/:id', 
  authMiddleware, 
  reporteController.eliminarReporte // Middleware de roles dentro del controlador
);



module.exports = router;