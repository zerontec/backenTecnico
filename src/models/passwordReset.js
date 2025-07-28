module.exports = (sequelize, DataTypes) => {
    const PasswordReset = sequelize.define('PasswordReset', {
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: 'expires_at'
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'password_resets',
      timestamps: true,
      underscored: true
    });
  
    PasswordReset.associate = (models) => {
      PasswordReset.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    };
  
    return PasswordReset;
  };