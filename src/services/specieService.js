
const { Especie , Subespecie, Origen} = require("../models");
const { sequelize } = require('../models');



class EspecieService {

  static async crear(data) {
    console.log(data, "DATA especie")
    const existe = await Especie.findOne({ where: { nombre: data.nombre }, paranoid: false,  });
    if (existe) {
      if (existe.deletedAt) {
        // Restaurar el registro eliminado
        await existe.restore();
        return existe;
      } else {
        throw new Error('Ya existe una especie con ese nombre.');
      }
    }
    
    // Crear nuevo registro
    const nuevaEspecie = await Especie.create(data);
    return nuevaEspecie;
// En services/EspecieService.js
}





  static async listarEspecies() {
    try {
      return await Subespecie.findAll({
        attributes: ['id', 'nombre'],
        raw: true
      });
    } catch (error) {
      throw new Error(`Error listarEspecies: ${error.message}`);
    }
  }




  static async listar() {
    return Especie.findAll({
      include: [{ model: Subespecie, as: "subespecies" }] 
    });
  }

  static async actualizar(id, data) {
    const transaction = await sequelize.transaction();
    try {
      const especie = await Especie.findByPk(id, { transaction });
      if (!especie) throw new Error("Especie no encontrada");

      // Validar nombre único solo si cambia
      if (data.nombre && data.nombre !== especie.nombre) {
        const existe = await Especie.findOne({ 
          where: { nombre: data.nombre },
          transaction 
        });
        if (existe) throw new Error("Nombre Especie  ya registrado");
      }

      await especie.update(data, { transaction });
      await transaction.commit();
      return especie;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }



  static async eliminarEspecie(id) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Traer la especie con sus subespecies activas
      const especie = await Especie.findByPk(id, {
        include: [{
          model: Subespecie,
          as: 'subespecies',
          where: { deletedAt: null },
          required: false
        }],
        transaction
      });
      if (!especie) throw new Error("Especie no encontrada");
  
      // 2. Verificar subespecies activas
      if (especie.subespecies && especie.subespecies.length > 0) {
        throw new Error("No se puede eliminar: Tiene subespecies activas asociadas");
      }
  
      // 3. Verificar que no existan entradas en Origen para esta especie
      const usosEnOrigen = await Origen.count({
        where: { especieId: id },
        transaction
      });
      if (usosEnOrigen > 0) {
        throw new Error("No se puede eliminar: Esta especie ya está registrada en Origen");
      }
  
      // 4. Verificar DetalleBeneficio para las subespecies (incluye soft-deleted si lo deseas)
      const subIds = especie.subespecies.map(s => s.id);
      if (subIds.length > 0) {
        const usosEnDetalle = await DetalleBeneficio.count({
          where: { subespecieId: subIds },
          paranoid: false,
          transaction
        });
        if (usosEnDetalle > 0) {
          throw new Error("No se puede eliminar: Hay beneficios detallados para sus subespecies");
        }
      }
  
      // 5. Si todo pasó, eliminamos la especie (soft-delete)
      await especie.destroy({ transaction });
      await transaction.commit();
      return { success: true, deletedId: id };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  
  
//ELIMINACION EN CASDA SOLO CASO USO ESPECIAL

  static async eliminarEspecieConDependencias(id) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Encontrar dependencias
      const subespecies = await Subespecie.findAll({ 
        where: { especie_id: id },
        transaction 
      });
  
   
      for (const sub of subespecies) {
        // Eliminar clases sexuales y categorías de la subespecie
        await ClaseSexual.destroy({ 
          where: { subespecie_id: sub.id }, 
          transaction 
        });
        await Categoria.destroy({ 
          where: { subespecie_id: sub.id }, 
          transaction 
        });
      }
  
 
      await Subespecie.destroy({ 
        where: { especie_id: id }, 
        transaction 
      });
  
    
      await Especie.destroy({ 
        where: { id }, 
        transaction 
      });
  
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


// Controlador para todos los niveles
// En tu servicio (taxonomiaService.js)
static async eliminarGenerico(tabla, id) {
  const models = {
    especie: Especie,
    subespecie: Subespecie,
    clase: ClaseSexual,
    categoria: Categoria
  };

  const model = models[tabla];
  if (!model) throw new Error('Tipo de registro inválido');

  const transaction = await sequelize.transaction();

  try {
    // Buscar registro incluyendo eliminados
    const registro = await model.findByPk(id, { 
      paranoid: false,
      transaction 
    });

    if (!registro) throw new Error('Registro no encontrado');
    if (registro.deletedAt) throw new Error('Registro ya eliminado');

    // Validar dependencias activas
    switch(tabla) {
      case 'especie':
        const subespeciesActivas = await Subespecie.count({
          where: { 
            especie_id: id,
            deletedAt: null
          },
          transaction
        });
        if (subespeciesActivas > 0) {
          throw new Error('No se puede eliminar: Tiene subespecies activas asociadas');
        }
        break;

      case 'subespecie':
        const clasesActivas = await ClaseSexual.count({
          where: { 
            subespecie_id: id,
            deletedAt: null
          },
          transaction
        });
        if (clasesActivas > 0) {
          throw new Error('No se puede eliminar: Tiene clases sexuales activas asociadas');
        }
        break;

      case 'clase':
        const categoriasActivas = await Categoria.count({
          where: { 
            clase_sexual_id: id,
            deletedAt: null
          },
          transaction
        });
        if (categoriasActivas > 0) {
          throw new Error('No se puede eliminar: Tiene categorías activas asociadas');
        }
        break;
    }

    // Soft delete
    await registro.destroy({ transaction });
    await transaction.commit();

    return { 
      success: true,
      message: `${tabla} marcada como eliminada`
    };

  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message);
  }
}



}





module.exports = EspecieService;