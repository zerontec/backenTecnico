const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Matadero = sequelize.define('Matadero', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    ubicacion: {
      type: DataTypes.JSONB,
     
    },
    capacidadDiaria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
    
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    veterinarioId: {
      type: DataTypes.UUID, 
      allowNull: true,
    },

  },
  
  {
    tableName: 'mataderos',
    paranoid: true
  },
  




);

  Matadero.associate = (models) => {
    Matadero.belongsTo(models.User, {
      foreignKey: 'veterinarioId',
      as: 'veterinarian'
    });


    Matadero.hasMany(models.ReporteDiario, {
      foreignKey: 'matadero_id',
      as: 'reportes'
    });

    Matadero.belongsToMany(models.User, {
      through: 'MataderoVeterinario',
      foreignKey: 'mataderoId',
      as: 'veterinarios'
    });
    

  };

  return Matadero;
};