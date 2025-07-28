module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
      id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
      },
      type: {
        type: DataTypes.STRING,
        validate: {
          isIn: [['system', 'message', 'alert','new_user',
    'status_change',
    'new_report',
    'account_approved']]
        },
        defaultValue: 'system'
      },
      message: {
          type: DataTypes.TEXT,
          allowNull: false,
      },
      isRead: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_read' 
      },
      userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id',
          references: {
              model: 'users', 
              key: 'id'
          }
      }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [ 
      { fields: ['user_id'] },
      { fields: ['created_at'] }
    ]
});

  Notification.associate = function (models) {
      Notification.belongsTo(models.User, {
          foreignKey: 'user_id', 
          as: 'user',
      });
  };

  return Notification;
};