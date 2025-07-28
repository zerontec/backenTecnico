// models/PasswordChangeRequest.js
module.exports = (sequelize, DataTypes) => {
    const PasswordChangeRequest = sequelize.define("PasswordChangeRequest", {
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      reason: DataTypes.TEXT, 
    });
  
  
    PasswordChangeRequest.associate = function (models) {
      PasswordChangeRequest.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    };
  
    return PasswordChangeRequest;
  };