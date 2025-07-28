
const { ClaseSexual, Subespecie, ReporteDiario, Categoria} = require("../models");
const { sequelize } = require('../models');

class ClaseSexualService {
  static async crear(data) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Validar existencia de la subespecie (incluso si está soft-deleted)
      const subespecie = await Subespecie.findByPk(data.subespecie_id, {
        transaction,
        paranoid: false
      });
      if (!subespecie) {
        throw new Error("Subespecie no encontrada");
      }
  
      // 2. Buscar ClaseSexual existente con el mismo nombre y subespecie (incluyendo soft-deletes)
      const existente = await ClaseSexual.findOne({
        where: {
          nombre: data.nombre,
          subespecie_id: data.subespecie_id
        },
        transaction,
        paranoid: false
      });
  
      if (existente) {
        if (existente.deletedAt) {
          // 3a. Si existe pero estaba soft-deleted → restaurar y actualizar campos
          await existente.restore({ transaction });
          await existente.update(data, { transaction });
          await transaction.commit();
          return existente;
        } else {
          // 3b. Si ya existe y está activo → error de duplicado
          throw new Error("La clase sexual ya existe para esta subespecie");
        }
      }
  
      // 4. No existe: crear una nueva
      const nueva = await ClaseSexual.create(data, { transaction });
      await transaction.commit();
      return nueva;
  
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
  


    static async listar() {
      return ClaseSexual.findAll({
        include: [{ model: Subespecie, as: "subespecie" }]
      });
    }
  

    static async listarId(subespecieId) {
      const where = {};
      if (subespecieId) where.subespecieId = subespecieId;
      return ClaseSexual.findAll({
      
        where,
        attributes: ['id','nombre'],
        include: [{ model: Subespecie, as: "subespecie" }],
        order: [['nombre','ASC']]
      });
    }





    static async actualizar(id, data) {
      const transaction = await sequelize.transaction();
      try {
        const claseSexual = await ClaseSexual.findByPk(id, { transaction });
        if (!claseSexual) throw new Error("clase sexual  no encontrada");
  
        // Validar nombre único solo si cambia
        if (data.nombre && data.nombre !== claseSexual.nombre) {
          const existe = await ClaseSexual.findOne({ 
            where: { nombre: data.nombre },
            transaction 
          });
          if (existe) throw new Error("Nombre Clase Sexual  ya registrado");
        }
  
        await claseSexual.update(data, { transaction });
        await transaction.commit();
        return claseSexual;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }


    static async eliminarClaseSexual(id) {
      // 1️⃣ Verificaciones previas sin transacción
      // ------------------------------------------
      // A) Asegurarnos de que exista la clase
      const clase = await ClaseSexual.findByPk(id);
      if (!clase) {
        throw new Error("Clase sexual no encontrada");
      }
    
      // B) Contar cuántas categorías la están usando
      const categoriasAsociadas = await Categoria.count({
        where: { clase_sexual_id: id }
      });
    
      // Si tienes otras tablas relacionadas (p.ej. DetalleBeneficio),
      // podrías hacer aquí un Promise.all([...]) para contarlas todas.
    
      
      if (categoriasAsociadas > 0) {
        throw new Error(
          `No se puede eliminar: Está asociada a ${categoriasAsociadas} categoría(s)`
        );
      }
    
      // 3️⃣ Todo limpio → abrimos transacción solo para el destroy
      const transaction = await sequelize.transaction();
      try {
        await clase.destroy({ transaction });    // soft-delete si tienes paranoid:true
        await transaction.commit();
        return { success: true, deletedId: id };
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
    

  }
module.exports = ClaseSexualService;