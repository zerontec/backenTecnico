// services/categoriaService.js
const { Categoria, ClaseSexual } = require("../models");
const { sequelize } = require('../models');



class CategoriaService {
  static async crear(data) {
    const transaction = await sequelize.transaction();
    try {
      // 1️⃣ Buscar categoría existente (incluso soft-deleted)
      const existente = await Categoria.findOne({
        where: {
          nombre: data.nombre,
          clase_sexual_id: data.clase_sexual_id
        },
        transaction,
        paranoid: false
      });

      if (existente) {
        if (existente.deletedAt) {
          // 1a) Si estaba soft-deleted, restaurar y actualizar sus datos
          await existente.restore({ transaction });
          await existente.update(data, { transaction });
          await transaction.commit();
          return existente;
        } else {
          // 1b) Si ya existe activo, error de duplicado
          throw new Error("La categoría ya existe para esta clase sexual");
        }
      }

      // 2️⃣ No existía → crear nueva
      const nueva = await Categoria.create(data, { transaction });
      await transaction.commit();
      return nueva;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }



  static async listarId(claseSexualId) {
    const where = {};
    if (claseSexualId) where.claseSexualId = claseSexualId;
    return Categoria.findAll({
     
      where,
      attributes: ['id','nombre'],
      include: [
        { model: ClaseSexual, as: "claseSexual" }
      ],
      order: [['nombre','ASC']]
    });
  }
  
    static async actualizar(id, data) {
      const transaction = await sequelize.transaction();
      try {
        const categoria = await Categoria.findByPk(id, { transaction });
        if (!categoria) throw new Error("Categoria no encontrada");
  
        // Validar nombre único solo si cambia
        if (data.nombre && data.nombre !== categoria.nombre) {
          const existe = await Categoria.findOne({ 
            where: { nombre: data.nombre },
            transaction 
          });
          if (existe) throw new Error("Nombre Categoria  ya registrado");
        }
  
        await categoria.update(data, { transaction });
        await transaction.commit();
        return categoria;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    static async eliminarCategoria(id) {
      const transaction = await sequelize.transaction();
      try {
        const categoria = await Categoria.findByPk(id, { transaction });
        if (!categoria) throw new Error("Categoría no encontrada");
    
        await categoria.destroy({ transaction });
        await transaction.commit();
        return { success: true, deletedId: id };
      } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeForeignKeyConstraintError') {
           throw new Error("No se puede eliminar porque tiene registros relacionados");
        }
        throw error;
      }
    }



    static async listar() {
      return Categoria.findAll({
  
      });
    }





}

module.exports = CategoriaService;