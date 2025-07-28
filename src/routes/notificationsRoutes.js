const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

module.exports = (sequelize, io) => {
    console.log("⚡ Notificación rutas montadas");
    const controller = notificationController(sequelize, io);
    router.get("/", controller.getNotifications);
    router.post("/", controller.createNotification);
    router.put("/:id/read", controller.markNotificationAsRead);
    router.put("/mark-all-read", controller.markAllNotificationsAsRead);
    router.delete("/:id", controller.deleteNotification);
    router.delete("/", controller.deleteAllNotifications);
    return router;
};
