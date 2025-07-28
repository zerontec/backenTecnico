module.exports = (sequelize, DataTypes) => {
  const ReporteDiario = sequelize.define('ReporteDiario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matadero_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    veterinario_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    hubo_actividad: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'enviado'),
      allowNull: false,
      defaultValue: 'enviado'
    },
    fecha_reporte: { 
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW, 
      comment: "Fecha de creación del reporte" 
    },
    fecha_actividad: { 
      type: DataTypes.DATEONLY,
      allowNull: true, 
      comment: "Fecha en que se realizó la actividad"
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    paranoid: true,
    hooks: {
      beforeCreate: (reporte) => {
        if (!reporte.fecha_reporte) reporte.fecha_reporte = new Date(); 
      }
    }
  });
  ReporteDiario.associate = (models) => {
    // Asociación con Matadero
    ReporteDiario.belongsTo(models.Matadero, {
      foreignKey: "matadero_id",
      as: "matadero"
    });

    ReporteDiario.hasMany(models.DetalleBeneficio, {
      foreignKey: 'reporteId',
      as: 'detallesBeneficio'
    });

    ReporteDiario.hasMany(models.ClaseSexual, {
      foreignKey: 'claseSexualId',
      as: 'claseSexual'
    });

    // Asociación con Incidencias
    ReporteDiario.hasMany(models.Incidencia, {
      foreignKey: 'reporteId',
      as: 'incidencias'
    });

    ReporteDiario.belongsTo(models.User, {
      foreignKey: 'veterinario_id',
      as: 'veterinario'
    });

    ReporteDiario.hasMany(models.Origen, {
      foreignKey: 'reporteId',
      as: 'origen'
    });

    ReporteDiario.belongsTo(models.Origen, {
      foreignKey: 'origen_id',
      as: 'origenes'
    });

  };

  return ReporteDiario;
};