
module.exports = (sequelize, DataTypes) => {
const Comiso = sequelize.define('Comiso', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    causa: DataTypes.STRING,
    organo: DataTypes.STRING,
    cantidad_canales: DataTypes.INTEGER,
    descripcion: DataTypes.TEXT,
    informe_url: DataTypes.STRING,
    foto_url: DataTypes.STRING
  });
  
return Comiso
}