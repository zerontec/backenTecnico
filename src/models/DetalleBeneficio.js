// module.exports = (sequelize, DataTypes) => {
//   const DetalleBeneficio = sequelize.define('DetalleBeneficio', {
//     cantidad: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       validate: { 
//         min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
//       }
//     },
//     subespecie_id: {
//       type: DataTypes.UUID, // Cambiado a UUID si corresponde
//       allowNull: false
//     },
//     claseSexualId: {
//       type: DataTypes.UUID, // Asegurar consistencia
//       allowNull: false
//     },
//     categoriaId: {
//       type: DataTypes.UUID,
//       allowNull: false
//     },
//     peso_pie: {
//       type: DataTypes.FLOAT,
//       validate: { min: 0 }
//     },
//     precio_pie: {
//       type: DataTypes.FLOAT,
//       validate: { min: 0 }
//     },
//     peso_canal: {
//       type: DataTypes.FLOAT,
//       validate: { min: 0 }
//     },
//     precio_canal: {
//       type: DataTypes.FLOAT,
//       validate: { min: 0 }
//     },
//     reporteId: {
//       type: DataTypes.UUID,
//       allowNull: false
//     }
//   });

//   DetalleBeneficio.associate = (models) => {
//     DetalleBeneficio.belongsTo(models.ReporteDiario, {
//       foreignKey: 'reporteId',
//       as: 'reporte'
//     });

//     DetalleBeneficio.belongsTo(models.Subespecie, {
//       foreignKey: 'subespecie_id',
//       as: 'subespecie'
//     });

//     DetalleBeneficio.belongsTo(models.ClaseSexual, {
//       foreignKey: 'claseSexualId',
//       as: 'claseSexual'
//     });

//     DetalleBeneficio.belongsTo(models.Categoria, {
//       foreignKey: 'categoriaId',
//       as: 'categoria'
//     });

//     // Eliminar relación con Origen si no es necesaria
//     // DetalleBeneficio.belongsTo(models.Origen, {
//     //   foreignKey: 'origenId',
//     //   as: 'origen'
//     // });
//   };

//   return DetalleBeneficio;
// };





module.exports = (sequelize, DataTypes) => {



  const DetalleBeneficio = sequelize.define('DetalleBeneficio', {
    cantidad: {
      type: DataTypes.INTEGER,
      validate: { min: 1 }
    },
    peso_pie: DataTypes.FLOAT,
    precio_pie: DataTypes.FLOAT,
    peso_canal: DataTypes.FLOAT,
    precio_canal: DataTypes.FLOAT
  });

  DetalleBeneficio.associate = (models) => {
    DetalleBeneficio.belongsTo(models.ReporteDiario, {
      foreignKey: 'reporteId',
      as: 'reporte'
    });

    DetalleBeneficio.belongsTo(models.Subespecie, {
      foreignKey: 'subespecie_id',
      as: 'subespecie'
    });


    DetalleBeneficio.belongsTo(models.ClaseSexual, {
      foreignKey: 'claseSexualId',
      as: 'claseSexual'
    });

    DetalleBeneficio.belongsTo(models.Categoria, {
      foreignKey: 'categoriaId',
      as: 'categoria'
    });


    // DetalleBeneficio.belongsTo(models.Origen, {
    //   foreignKey: 'origenId',
    //   as: 'origen'
    // });


  };

  return DetalleBeneficio;
};

