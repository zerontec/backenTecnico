// models/categoria.js
module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define('Categoria', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    nombre: { type: DataTypes.STRING, allowNull: false }, // Ej: "AA", "A"
    clase_sexual_id: { type: DataTypes.UUID, allowNull: false } // FK a ClaseSexual
  }, {
    tableName: 'categorias',
    underscored: true
  });

  Categoria.associate = (models) => {
    Categoria.belongsTo(models.ClaseSexual, { foreignKey: 'clase_sexual_id', as: 'clase_sexual' });
  };

  return Categoria;
};