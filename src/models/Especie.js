module.exports = (sequelize, DataTypes) => {
  const Especie = sequelize.define('Especie', {
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
  }, {
    paranoid: true,    
    tableName: 'especies', 
    freezeTableName: true, 
    underscored: true, 
    timestamps: true   
  });

  // Relación con Subespecie
  Especie.associate = (models) => {
    Especie.hasMany(models.Subespecie, {
      foreignKey: 'especie_id', 
      as: 'subespecies'
    });
  };

  return Especie;
};