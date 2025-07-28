const { Especie} = require('../models/Especie');
const {Subespecie}= require('../models/Subespecie')

exports.getEspecies = async (req, res, next) => {
  try {
    const especies = await Especie.findAll({
      include: {
        model: Subespecie,
        as: 'subespecies',
        attributes: ['id', 'nombre']
      }
    });
    res.json(especies);
  } catch (error) {
    next(error);
  }
};

exports.getSubespecies = async (req, res, next) => {
  try {
    const subespecies = await Subespecie.findAll({
      where: { especieId: req.params.especieId },
      include: ['clasesSexuales', 'categorias']
    });
    res.json(subespecies);
  } catch (error) {
    next(error);
  }
};