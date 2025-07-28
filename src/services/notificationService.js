


class NotificationService {
    constructor(sequelize, io) {
      if (!sequelize) {
        throw new Error("Sequelize instance is required");
      }
      
      this.models = sequelize.models;
      this.io = io || null;  // Acepta io como opcional
      
      if (!this.models) {
        throw new Error("Sequelize models are not initialized");
      }
    }

  // Crear notificación y emitir por socket
  async createNotification(userId, type, message, metadata = {}) {
      const notification = await this.models.Notification.create({
          userId:admin.id,
          type,
          message,
          metadata: JSON.stringify(metadata),
          isRead: false
      });
      
      // Emitir al usuario específico
      this.io.to(`user:${userId}`).emit("new_notification", notification.get({ plain: true }));
      
      return notification;
  }

  // Notificar a todos los administradores
  async notifyAdmins(type, message, metadata) {
    try {
      // 1. Buscar administradores
      const admins = await this.models.User.findAll({
        where: { role: 'admin' }
      });

      if (admins.length === 0) {
        console.warn("⚠️ No hay administradores para notificar");
        return;
      }

      // 2. Crear notificaciones
      const notificationPromises = admins.map(admin => {
        return this.models.Notification.create({
          userId: admin.id,
          type,
          message,
          metadata: JSON.stringify(metadata),
          isRead: false
        });
      });

      const createdNotifications = await Promise.all(notificationPromises);
      console.log(`📬 Notificaciones creadas: ${createdNotifications.length}`);

      // 3. Enviar por socket
      if (this.io) {
        createdNotifications.forEach(notification => {
          this.io.to(`user:${notification.userId}`).emit('new_notification', {
            id: notification.id,
            type,
            message,
            metadata,
            createdAt: notification.createdAt
          });
        });
        console.log("📢 Notificaciones enviadas por socket");
      }
    } catch (error) {
      console.error("❌ Error en notifyAdmins:", error);
    }
  }

  // Obtener notificaciones paginadas
  async getUserNotifications(userId, page = 1, limit = 20) {
      const offset = (page - 1) * limit;
      
      return this.models.Notification.findAll({
          where: { userId },
          order: [['createdAt', 'DESC']],
          limit,
          offset,
          include: [{
              model: this.models.User,
              as: 'user',
              attributes: ['name', 'lastName', ]
          }]
      });
  }

  // Marcar como leída
  async markAsRead(notificationId) {
      const notification = await this.models.Notification.findByPk(notificationId);
      
      if (!notification) {
          throw new Error('Notificación no encontrada');
      }
      
      await notification.update({ isRead: true });
      return notification;
  }

  // Marcar todas como leídas
  async markAllNotificationsAsRead(userId) {
    try {
      // Verificar primero si el usuario existe
      const user = await this.models.User.findByPk(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
  
      // Actualizar notificaciones y devolver las actualizadas
      const [updatedCount, updatedNotifications] = await this.models.Notification.update(
        { isRead: true },
        { 
          where: { 
            userId, 
            isRead: false 
          },
          returning: true, // Para obtener las notificaciones actualizadas
          individualHooks: true // Para ejecutar hooks si los hay
        }
      );
      
      return {
        count: updatedCount,
        notifications: updatedNotifications
      };
    } catch (error) {
      console.error('Error en markAllNotificationsAsRead:', error);
      throw error;
    }
  }

  // ===== MÉTODOS PARA EVENTOS ESPECÍFICOS =====
  
  // Notificar sobre nuevo usuario registrado
  async notifyNewUserRegistration(newUser) {
    try{      
      const metadata = {
          userId: newUser.id,
          name: `${newUser.name} ${newUser.lastName}`,
          action: '/admin/users',
        //   avatar: newUser.avatar || null
      };
      
      const result = await this.notifyAdmins(
        'new_user',
        `Nuevo usuario registrado: ${newUser.name} ${newUser.lastName}`,
        metadata
      );
      
      // Emitir notificación a través de Socket.IO
      if (this.io) {
        result.forEach(notification => {
          // Emite a la sala específica del usuario admin
          this.io.to(`user:${notification.userId}`).emit('new_notification', {
            id: notification.id,
            type: 'new_user',
            message: notification.message,
            metadata,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error notificando nuevo usuario:", error);
      return [];
    }
  }
  // Notificar cambio de estado de usuario
  async notifyUserStatusChange(user, newStatus) {
      return this.createNotification(
          user.id,
          'status_change',
          `Tu cuenta ha sido ${newStatus === 'active' ? 'activada' : 'desactivada'}`,
          {
              status: newStatus,
              action: '/profile'
          }
      );
  }

  // Notificar sobre nuevo reporte
  async notifyNewReport(report, reporter) {
      const metadata = {
          reportId: report.id,
          reporterId: reporter.id,
          reporterName: `${reporter.name} ${reporter.lastName}`,
          action: `/reports/${report.id}`
      };
      
      return this.notifyAdmins(
          'new_report',
          `Nuevo reporte creado por ${reporter.name}`,
          metadata
      );
  }

  // Notificar aprobación de cuenta
  async notifyAccountApproval(user) {
      return this.createNotification(
          user.id,
          'account_approved',
          '¡Tu cuenta ha sido aprobada! Ahora puedes acceder a todas las funciones',
          {
              action: '/dashboard'
          }
      );
  }

async deleteNotification(notificationId) {
    const notification = await this.models.Notification.findByPk(notificationId);
    
    if (!notification) {
        throw new Error('Notificación no encontrada');
    }
    
    await notification.destroy();
    return notification;
}




  async notifyAdmins(type, message, metadata) {
    // Encuentra todos los usuarios administradores
    const admins = await this.models.User.findAll({
      where: { role: 'admin' }
    });
  
    // Crea una notificación para cada administrador
    const notifications = admins.map(admin => {
      return this.models.Notification.create({
        userId: admin.id,   // ¡Aquí debe estar el userId!
        type,
        message,
        metadata: JSON.stringify(metadata),
        isRead: false
      });
    });
  
    await Promise.all(notifications);
  
    return notifications;

    // ... resto del código ...
  }


 async deleteAllNotifications(userId) {
    const notifications = await this.models.Notification.findAll({
      where: { userId }
    });
    
    await Promise.all(notifications.map(notification => notification.destroy()));
    
    return notifications.length;
  }


}

module.exports = NotificationService;

