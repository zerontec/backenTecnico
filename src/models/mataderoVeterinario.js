// models/mataderoVeterinario.js (Tabla de unión)
module.exports = (sequelize, DataTypes) => {
    const MataderoVeterinario = sequelize.define('MataderoVeterinario', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      mataderoId: DataTypes.UUID,
      veterinarioId: DataTypes.UUID,
      fechaAsignacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, { timestamps: false });
  
    return MataderoVeterinario;
  };
  

