
const testController = require('../controllers/TestController')
const express = require('express');


const router = express.Router();
router.post('/emitir-test', testController.crearTest)
   

module.exports = router;
  