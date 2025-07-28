


module.exports = (sequelize, DataTypes) => {
  const ClaseSexual = sequelize.define('ClaseSexual', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    nombre: { type: DataTypes.STRING, allowNull: false }, // Ej: "Vaca", "Toro"
    subespecie_id: { type: DataTypes.UUID, allowNull: false } // FK a Subespecie
  }, {
    tableName: 'clases_sexuales',
    underscored: true
  });

  ClaseSexual.associate = (models) => {
    ClaseSexual.belongsTo(models.Subespecie, { foreignKey: 'subespecie_id', as: 'subespecie' });
    ClaseSexual.hasMany(models.Categoria, { foreignKey: 'clase_sexual_id', as: 'categorias' });
    
  };

  return ClaseSexual;
};