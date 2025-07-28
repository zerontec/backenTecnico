// index.js (root)
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const verifyToken = require("./src/utils/verifyToken");
const CronService = require("./src/services/cronService");
const { sequelize } = require("./src/models");
const NotificationService = require('./src/services/notificationService');
const createApp = require("./src/app");
const jwt = require("jsonwebtoken");
const { User } = require("./src/models");
const cookieParser = require('cookie-parser');
// 1) Crea express app
const app = express();
app.use(cookieParser());
// 2) Crea servidor HTTP y pásale express
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: ['https://dashboardnew-tawny.vercel.app','http://localhost:5173', 'https://dashboardnew-git-userdata-zerontecs-projects.vercel.app'],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: '/socket.io',
});
const notificationService = new NotificationService(sequelize, io);
app.set('notificationService', notificationService);
// 4) Middleware de autenticación para sockets
io.use(async (socket, next) => {
  try {
    console.log("Headers recibidos:", socket.handshake.headers);
    console.log("Cookies recibidas:", socket.handshake.headers.cookie);
    
    let token = socket.handshake.auth?.token;
    
    // 1. Intentar desde auth token
    if (!token) {
      console.log("Buscando token en handshake.auth");
      token = socket.handshake.auth.token;
    }
    
    // 2. Intentar desde cookies
    if (!token && socket.request.cookies) {
      console.log("Buscando token en cookies");
      token = socket.request.cookies.accessToken;
    }
    
    // 3. Intentar desde headers (como último recurso)
    if (!token && socket.handshake.headers.authorization) {
      console.log("Buscando token en headers Authorization");
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    console.log("Token encontrado:", token);
    
    if (!token) {
      return next(new Error("Token no proporcionado"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decodificado:", decoded);
    
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error("Usuario no encontrado");
    
    socket.user = user;
    next();
  } catch (err) {

    if (err.message.includes("jwt must be provided")) {
      console.log("Socket sin token (posible modo offline)");
      return next(); // Permite conexión anónima
    }

    console.error("Error de autenticación:", err.message);
    next(new Error("Error de autenticación: " + err.message));
  }
});
// 5) Eventos de conexión
io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.user.id}`);
  socket.join(`user:${socket.user.id}`);
  if (socket.user.rol === 'admin') {
    socket.join('admins');
    console.log(`Admin ${socket.user.id} unido a sala admins`);
  }

  socket.on("registrar_usuario", ({ userId, rol }) => {
    socket.join(`user:${userId}`);
    if (rol === "admin") socket.join("admins");
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.user.id}`);
  });
});


const appWithRoutes = createApp(sequelize, io);

// 7) Monta el app en express
app.use(appWithRoutes);

// 8) Inicia cron y envía recordatorios
const cronService = new CronService(io);
cronService.sendReminder();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io, notificationService };
