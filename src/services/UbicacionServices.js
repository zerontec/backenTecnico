// En services/UbicacionService.js
const {Origen }= require('../models');
const { sequelize } = require('../models');



class UbicacionService {
  static async listarEstados() {
    try {
      return await Origen.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('estado')), 'nombre']
        ],
        raw: true
      });
    } catch (error) {
      throw new Error(`Error listarEstados: ${error.message}`);
    }
  }
}

module.exports = UbicacionService;