const express = require('express');
const { crearEspecie } = require('../controllers/adminController');
// const adminAuth = require('../middlewares/adminAuth');

const router = express.Router();

// router.use(adminAuth);

router.post('/especies', crearEspecie);


module.exports = router;