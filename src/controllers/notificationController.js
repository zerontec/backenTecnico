const  NotificationService  = require("../services/notificationService");

module.exports = (sequelize, io) => {
  const notificationService = new NotificationService(sequelize, io);

  return {



      // Crear notificación (usado desde otros servicios)
      createNotification: async (req, res) => {
          try {
              const { userId, type, message, metadata } = req.body;
              const notification = await notificationService.createNotification(
                  userId, 
                  type, 
                  message,
                  metadata
              );
              res.status(201).json(notification);
          } catch (error) {
              console.error("❌ Error creando notificación:", error);
              res.status(500).json({ error: error.message });
          }
      },


      notifyAdmins: async (req, res) => {
        try {
          const { type, message, metadata } = req.body;
          await notificationService.notifyAdmins(type, message, metadata);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("❌ Error notificando a administradores:", error);
          res.status(500).json({ error: error.message });
        }
      },


      notifyNewUserRegistration: async (req, res) => {
        try {
          const { type, message, metadata } = req.body;
          await notificationService.notifyNewUserRegistration(type, message, metadata);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("❌ Error notificando a administradores:", error);
          res.status(500).json({ error: error.message });
        }
      },


      notifyUserStatusChange: async (req, res) => {
        try {
          const { type, message, metadata } = req.body;
          await notificationService.notifyUserStatusChange(type, message, metadata);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("❌ Error notificando a administradores:", error);
          res.status(500).json({ error: error.message });
        }
      },

      notifyNewReport: async (req, res) => {
        try {
          const { type, message, metadata } = req.body;
          await notificationService.notifyNewReport(type, message, metadata);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("❌ Error notificando a administradores:", error);
          res.status(500).json({ error: error.message });
        }
      },

      notifyAccountApproval: async (req, res) => {
        try {
          const { type, message, metadata } = req.body;
          await notificationService.notifyAccountApproval(type, message, metadata);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("❌ Error notificando a administradores:", error);
          res.status(500).json({ error: error.message });
        }
      },

      // Obtener notificaciones del usuario actual
      getNotifications: async (req, res) => {
          try {
              const userId = req.user.id; // Asume autenticación JWT
              const page = parseInt(req.query.page) || 1;
              const limit = parseInt(req.query.limit) || 20;
              
              const notifications = await notificationService.getUserNotifications(
                  userId, 
                  page, 
                  limit
              );
              
              res.json(notifications);
          } catch (error) {
              console.error("❌ Error obteniendo notificaciones:", error);
              res.status(500).json({ error: error.message });
          }
      },

      // Marcar notificación específica como leída
      markNotificationAsRead: async (req, res) => {
          try {
              const notificationId = req.params.id;
              const notification = await notificationService.markAsRead(notificationId);
              
              // Emitir evento de socket para actualizar frontend
              io.to(`user:${notification.userId}`).emit("notification_read", notificationId);
              
              res.json(notification);
          } catch (error) {
              console.error("❌ Error marcando notificación como leída:", error);
              res.status(500).json({ error: error.message });
          }
      },

      

      // Marcar todas como leídas
      markAllNotificationsAsRead: async (req, res) => {
        try {
          const userId = req.user.id;
          
          // Validar que el usuario esté autenticado
          if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
          }
      
          const result = await notificationService.markAllNotificationsAsRead(userId);
          
          // Emitir evento de socket con más información
          io.to(`user:${userId}`).emit("all_notifications_read", {
            count: result.count,
            timestamp: new Date().toISOString()
          });
          
          res.json({ 
            success: true, 
            message: `${result.count} notificaciones marcadas como leídas`,
            data: {
              updatedCount: result.count,
              // Puedes incluir IDs de notificaciones actualizadas si es necesario
            }
          });
        } catch (error) {
          console.error("❌ Error marcando todas como leídas:", error);
          res.status(500).json({ 
            error: error.message,
            code: 'NOTIFICATION_UPDATE_ERROR' 
          });
        }
      },





      deleteNotification: async (req, res) => {
        try {
            const notificationId = req.params.id;
            const notification = await notificationService.deleteNotification(notificationId);
            
            // Emitir evento de socket para actualizar frontend
            io.to(`user:${notification.userId}`).emit("notification_deleted", notificationId);
            
            res.json(notification);
        } catch (error) {
            console.error("❌ Error eliminando notificación:", error);
            res.status(500).json({ error: error.message });
        }
    },
    
    
   deleteAllNotifications: async (req, res) => {
    try {
        const userId = req.user.id;
        const deletedCount = await notificationService.deleteAllNotifications(userId);
        
        // Emitir evento de socket para actualizar frontend
        io.to(`user:${userId}`).emit("all_notifications_deleted");
        
        res.json({ 
            success: true, 
            message: `${deletedCount} notificaciones eliminadas` 
        });
    } catch (error) {
        console.error("❌ Error eliminando todas las notificaciones:", error);
        res.status(500).json({ error: error.message });
    }
}




      
  };





};

    

 

