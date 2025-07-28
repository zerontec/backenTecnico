const express = require('express');
const { 
  getEspecies, 
  getSubespecies 
} = require('../controllers/masterController');

const router = express.Router();

router.get('/especies', getEspecies);
router.get('/especies/:especieId/subespecies', getSubespecies);

module.exports = router;