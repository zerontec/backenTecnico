const express = require('express');
const router = express.Router();
const veterinarioController = require('../controllers/veterinarioController');
// const authMiddleware = require('../middlewares/auth');
// const adminMiddleware = require('../middlewares/adminMiddleware');

// // Registro público
// router.post('/register', 
//   veterinarioController.registroVeterinario
// );

// Aprobación por admin
router.patch('/:id/aprobar',
//   authMiddleware,
//   adminMiddleware,
  veterinarioController.aprobarVeterinario
);

// Obtener veterinarios pendientes
router.get('/pendientes',
//   authMiddleware,
//   adminMiddleware,
  veterinarioController.listarPendientes
);

module.exports = router;