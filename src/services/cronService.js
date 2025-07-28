
const { Notification, User } = require('../models');
const cron = require('node-cron');
const brakes = require('brakes');
const logger = require('../config/logger');

class CronService {
  constructor(io) {
    this.io = io;
    this.setupCircuitBreaker();
  }

  setupCircuitBreaker() {
    this.reminderCircuit = new brakes(this.sendVeterinarianReminders.bind(this), {
      timeout: 60000,
      threshold: 0.3,
      circuitDuration: 300000 
    });

    this.reminderCircuit.on('failure', (err) => {
      logger.error(`Fallo en recordatorios: ${err.message}`);
    });

    this.reminderCircuit.on('circuitOpen', () => {
      logger.error('‼ Circuito abierto: Recordatorios desactivados por 5 minutos');
    });
  }

  setupJobs() {
    cron.schedule('* * * * *', () => {
      this.reminderCircuit.exec().catch(() => {});
    }, {
      scheduled: true,
      timezone: 'America/Caracas'
    });
  }

  async sendVeterinarianReminders() {
    try {
      console.log("ENTRANDO A ENVIO ")
      const vets = await User.findAll({ where: { role: 'veterinarian' }});
      
      for (const vet of vets) {
        await this.sendReminder(vet.id);
      }

      logger.info(` Recordatorios enviados a ${vets.length} veterinarios`);
    } catch (error) {
      logger.error('Error crítico:', error);
      throw error; 
    }
  }

  async sendReminder(userId) {
    try {
      const notification = await Notification.create({
        userId,
        type: 'reminder',
        message: ' ¡Reportes diarios pendientes!'
      });

      this.io.to(`user:${userId}`).emit('nueva_notificacion', notification);
    } catch (error) {
      logger.error(`Usuario ${userId}: ${error.message}`);
    }
  }
}

module.exports = CronService;