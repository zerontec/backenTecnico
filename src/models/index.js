const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");

const modelDefiners = [
  require("./Especie"),
  require("./Subespecie"),
  require("./Origen"),
  require("./ClaseSexual"),
  require("./DetalleBeneficio"),
  require("./ReporteDiario"),
  require("./Categoria"),
  require("./Matadero"),
  require("./User"),
  require("./Incidencias"),
 require("./PasswordChangeRequest"),
  require("./Notification"),
  
 

];

modelDefiners.forEach((definer) => definer(sequelize, Sequelize.DataTypes));

Object.values(sequelize.models).forEach((model) => {
  if (model.associate) {
    model.associate(sequelize.models);
  }
});

module.exports = {
  ...sequelize.models,
  sequelize,
};
