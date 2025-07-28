require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const setupSwagger = require("./swagger/swaggerConfig");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cookieParser = require('cookie-parser'); 
const routesFactory = require("./routes");

module.exports = (sequelize, io) => {
  const app = express();

  // Inyectamos io en los handlers via req.io
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.removeHeader("X-Powered-By");
    next();
  });
  app.use(cookieParser());
  // Configuración de CORS
  const corsOptions = {
    origin: ['https://dashboardnew-tawny.vercel.app', 'http://localhost:5173',  'https://dashboardnew-git-userdata-zerontecs-projects.vercel.app'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    exposedHeaders: ['set-cookie'],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));

 
  // Documentación Swagger
  setupSwagger(app);

  // Capturar el body de respuesta para morgan
  const captureResponseBody = (req, res, next) => {
    const oldSend = res.send;
    res.send = function (body) {
      res.locals.responseBody = body;
      return oldSend.call(this, body);
    };
    next();
  };
  app.use(captureResponseBody);

  // Logging de peticiones
  app.use(morgan((tokens, req, res) => {
    return [
      `[${new Date().toISOString()}]`,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      `${tokens["response-time"](req, res)}ms`,
      `Res: ${JSON.stringify(res.locals.responseBody)}`,
    ].join(" ");
  }));

  // Rutas API
  const routes = routesFactory(sequelize, io);
  app.use("/api/v1", routes);

  // Middleware de errores (al final)
  app.use(errorMiddleware);

  // Sincroniza tablas
  sequelize.sync({ alter: true, force: false })
    .then(() => console.log("Todas las tablas sincronizadas – AgroBack API funcionando"))
    .catch(err => { console.error("Error al sincronizar tablas:", err); process.exit(1); });

  return app;
};
