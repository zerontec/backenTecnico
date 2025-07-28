const { Especie } = require('../models/Especie');

exports.crearEspecie = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }
    
    const especie = await Especie.create({ nombre });
    res.status(201).json(especie);
    
  } catch (error) {
    next(error);
  }
};