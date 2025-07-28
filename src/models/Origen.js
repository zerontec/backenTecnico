module.exports = (sequelize, DataTypes) => {
  const Origen = sequelize.define('Origen', {

    especieNombre: { 
      type: DataTypes.STRING,
      field: 'especie_nombre' 
    },
    claseSexualNombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    estado: DataTypes.STRING,
    municipio: DataTypes.STRING,
    cantidad_hembras: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'La cantidad de hembras debe ser un número entero' },
        min: { args: [0], msg: 'La cantidad de hembras no puede ser negativa' }
      }
    },
    cantidad_machos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'La cantidad de machos debe ser un número entero' },
        min: { args: [0], msg: 'La cantidad de machos no puede ser negativa' }
      }
    },
    cantidad_animales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'La cantidad de animales debe ser un número entero' },
        min: { args: [0], msg: 'La cantidad de animales no puede ser negativa' },
        esSumaCorrecta(value) {
          if (this.cantidad_hembras + this.cantidad_machos !== value) {
            throw new Error('La suma de hembras y machos debe ser igual a la cantidad total de animales');
          }
        }
      }
    },
    especieId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    subespecie_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reporteId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    categoria_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  

);

  Origen.associate = (models) => {
    // Origen.belongsTo(models.ReporteDiario, {
    //   foreignKey: 'reporteId',
    //   as: 'reporte'
    // });

    Origen.hasMany(models.ReporteDiario, {
      as: 'reportes', // Alias definido aquí (singular)
      foreignKey: 'origen_id'
    });
    Origen.belongsTo(models.ReporteDiario, {
      foreignKey: 'reporteId',
      as: 'reporte'
    });
    Origen.belongsTo(models.Especie, {
      foreignKey: 'especieId',  // Asegúrate que coincida con el campo en la tabla
      as: 'especie'
    });
    Origen.belongsTo(models.Subespecie, {
      foreignKey: 'subespecie_id',
      as: 'subespecie'
    });
    Origen.belongsTo(models.Categoria, {
      foreignKey: 'categoria_id',
      as: 'categoria'
    });
    // Origen.belongsTo(models.ClaseSexual, {
    //   foreignKey: 'clase_sexual_id',
    //   as: 'clase_sexual'
    // });

    Origen.belongsTo(models.ClaseSexual, {
      foreignKey: 'claseSexualId',  // Asegúrate que este campo exista en el modelo
      as: 'claseSexual'
    });
  };
    
  


  

  return Origen;
};