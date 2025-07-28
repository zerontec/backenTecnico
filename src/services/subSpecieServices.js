const {Categoria, Subespecie, Especie, ClaseSexual,  DetalleBeneficio } = require("../models");
const { sequelize } = require('../models');
class SubespecieService {



  static async crear(data) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Validar existencia de la especie padre
      const especie = await Especie.findByPk(data.especie_id, { transaction, paranoid: false });
      if (!especie) throw new Error("Especie no encontrada");
  
      // 2. Buscar subespecie existente (incluso borrada)
      const existente = await Subespecie.findOne({
        where: { nombre: data.nombre, especie_id: data.especie_id },
        transaction,
        paranoid: false
      });
  
      if (existente) {
        if (existente.deletedAt) {
          // 3a. Si estaba soft-deleted, restaurar y actualizar
          await existente.restore({ transaction });
          await existente.update(data, { transaction });
          await transaction.commit();
          return existente;
        } else {
          // 3b. Ya existe activa
          throw new Error("La subespecie ya existe");
        }
      }
  
      // 4. No existe: crear nueva
      const nueva = await Subespecie.create(data, { transaction });
      await transaction.commit();
      return nueva;
  
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  



  
  static async listar() {
    return Subespecie.findAll({ include: [{ model: Especie, as: "especie" }] });
  }


  static async listarId(especieId) {

    console.log(especieId, "ESPECIEID SERVICES")
    const where = {};
    if (especieId) where.especie_id = especieId;
    return Subespecie.findAll({
      where,
      attributes: ['id','nombre'],
      include: [{ model: Especie, as: 'especie', attributes: ['id','nombre'] }],
      order: [['nombre','ASC']]
    });
  }



  static async actualizar(id, data) {
    const transaction = await sequelize.transaction();
    try {
    const subespecie = await Subespecie.findByPk(id);
    if (!subespecie) throw new Error("Subespecie no encontrada");
  
    // Validar nombre único (solo si cambia)
    if (data.nombre && data.nombre !== subespecie.nombre) {
      const existe = await Subespecie.findOne({ where: { nombre: data.nombre } });
      if (existe) throw new Error("El nombre SubEspecie ya está registrado");
    }
  
    // Validar especie_id (si se modifica)
    if (data.especie_id && data.especie_id !== subespecie.especie_id) {
      const especieExistente = await Especie.findByPk(data.especie_id);
      if (!especieExistente) throw new Error("La especie seleccionada no existe");
    }
  
    await subespecie.update(data, { transaction });
    await transaction.commit();
return subespecie;
  }catch (error) {
    await transaction.rollback();
    throw error;
  }

  }




  static async eliminarSubespecie(id) {
    // 1) Busco la subespecie “sin transacción”
    const sub = await Subespecie.findByPk(id);
    if (!sub) throw new Error("Subespecie no encontrada");
  
    // 2) Hago todos los counts SIN transacción
    const [clasesSexuales, categorias, detallesBeneficio] = await Promise.all([
      ClaseSexual.count({   where: { subespecie_id: id } }),
      Categoria.count({     where: { subespecie_id: id } }),
      DetalleBeneficio.count({ where: { subespecie_id: id } })
    ]);
  
    const errores = [];
    if (clasesSexuales    > 0) errores.push("clases sexuales");
    if (categorias        > 0) errores.push("categorías");
    if (detallesBeneficio > 0) errores.push("detalles de beneficio");
    if (errores.length > 0) {
      throw new Error(`No se puede eliminar: Tiene ${errores.join(" y ")} asociadas`);
    }
  
    // 3) Si pasamos las validaciones, abrimos transacción para el destroy
    const transaction = await sequelize.transaction();
    try {
      await sub.destroy({ transaction });
      await transaction.commit();
      return { success: true, deletedId: id };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
  
  
  
}

module.exports = SubespecieService;