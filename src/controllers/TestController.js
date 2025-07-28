const {Notifications} = require('../models') 



exports.crearTest = async (req, res) => {
    try {
      const io = req.app.locals.io;
      
 
      io.to("admins").emit("nuevo_reporte", { 
        mensaje: "🔔 Notificación de prueba",
      
      });
  
   
      io.to(`user:${userId}`).emit("nueva_notificacion", {
        type: "recordatorio",
        message: "¡Recuerda hacer tus reportes!"
      });
  
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  }

