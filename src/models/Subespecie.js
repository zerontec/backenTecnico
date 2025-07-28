module.exports = (sequelize, DataTypes) => {
  const Subespecie = sequelize.define('Subespecie', {

    id: {
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'unique_subespecie'
    },
    especie_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    
  }, {
    tableName: 'subespecies',
    freezeTableName: true,
    underscored: true,
    paranoid: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['nombre', 'especie_id']
      },
      {
        fields: ['especie_id'] 
      }
    ]
  });

  Subespecie.associate = (models) => {
    Subespecie.belongsTo(models.Especie, { foreignKey: 'especie_id', as: 'especie' });
    Subespecie.hasMany(models.ClaseSexual, { foreignKey: 'subespecie_id', as: 'clases_sexuales' });
    
    // Subespecie.hasMany(models.ClaseSexual, {
    //   foreignKey: 'subespecie_id',
    //   as: 'clasesSexuales'
    // });
    
    Subespecie.hasMany(models.Categoria, {
      foreignKey: 'subespecie_id',
      as: 'categorias'
    });

    Subespecie.hasMany(models.DetalleBeneficio, {
      foreignKey: 'subespecie_id',
      as: 'detalles'
    });
  };

  return Subespecie;
};