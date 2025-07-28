// services/notificationServiceInstance.js
const { sequelize } = require("../models");
const { io } = require("../socket"); // Asegúrate de exportar io
const NotificationService = require("./notificationService");

let instance = null;

module.exports = () => {
  if (!instance) {
    instance = new NotificationService(sequelize, io);
  }
  return instance;
};