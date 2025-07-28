module.exports = (sequelize, DataTypes) => {
  const Incidencia = sequelize.define('Incidencia', {
    tipo: {
      type: DataTypes.ENUM(
        'Falla eléctrica', 
        'Comiso de canales', 
        'Animales sin aval sanitario',
        'Tuberculosis',
        'Vacas preñadas',
        'Comiso',
        'Otros'
      ),
      allowNull: false
    },

    afecta_beneficiados: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fotos: {
      type: DataTypes.ARRAY(DataTypes.STRING), 
      allowNull: true,
      defaultValue: []
    },
    cantidad_afectados: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
     
        esCantidadValida(value) {
          if (['Vacas preñadas', 'Comiso'].includes(this.tipo)) {
            if (!value || value <= 0) {
              throw new Error(
                `La cantidad afectada es requerida para incidencias de tipo ${this.tipo}`
              );
            }
          }
        }
      }
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false 
    },

    descripcion: DataTypes.TEXT,
    datos_adicionales: DataTypes.JSON 



  },

);

  Incidencia.associate = (models) => {
    Incidencia.belongsTo(models.ReporteDiario, {
      foreignKey: 'reporteId',
      as: 'reporte'
    });
  };

  return Incidencia;
};