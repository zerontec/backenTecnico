

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

 
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cedula: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
phone:{

type:DataTypes.STRING,

},


    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    forcePasswordChange: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'force_password_change'
    },
    colegioVeterinario: {
      type: DataTypes.STRING,
     
      field: 'colegio_veterinario'
    },
    mpps: {
      type: DataTypes.STRING,
    
      field: 'mpps'
    },
    runsai: {
      type: DataTypes.STRING,
      field: 'runsai'
    },


    licenseNumber:{ type:DataTypes.STRING,
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "operator", "logistics", "supervisor", "veterinarian"),
      defaultValue: "veterinarian",
    },
    status: {
      type: DataTypes.ENUM(
        "pending", 
        "approved", 
        "rejected",
        "activo",
        "inactivo"

      ),
      defaultValue: "pending"
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    tableName: "users",
    paranoid: true 
  });

  User.associate = function (models) {
    // Asociación con Notificaciones (ya existe)
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications', 
    });
  
    // 1. Asociación con Reportes Diarios (como veterinario)
    User.hasMany(models.ReporteDiario, {
      foreignKey: 'veterinario_id',
      as: 'veterinario'
    });
  
    // 2. Asociación con Mataderos (si los usuarios están asignados a uno)
    User.belongsTo(models.Matadero, {
      foreignKey: 'matadero_id',
      as: 'matadero'
    });
  
    // 3. Asociación con Orígenes (si aplica para operadores/logística)
    User.hasMany(models.Origen, {
      foreignKey: 'responsable_id',
      as: 'origenes_gestionados'
    });
  
    // 4. Asociación con Incidencias (si necesitan responsable)
    User.hasMany(models.Incidencia, {
      foreignKey: 'responsable_id',
      as: 'incidencias_asignadas'
    });

    User.belongsToMany(models.Matadero, {
      through: 'MataderoVeterinario',
      foreignKey: 'veterinarioId',
      as: 'mataderos'
    });



  };

  return User;
};