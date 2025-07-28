const express = require("express");
const router = express.Router();
const{invalidateOldTokens,checkTokenValidity} = require('../utils/auth.utils')
const {authMiddleware} = require('../middlewares/authMiddleware')
const {checkForcePasswordChange }= require('../middlewares/auth')
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const masterRoutes = require("./masterRoutes");
const adminRoutes = require("./adminRoutes")
const reporteRoutes = require("./reporteRoutes");
const mataderoRoutes=require("./mataderoRoutes")
//const veterinarioRoutes = require("./veterinarioRoutes");
const testRoutes = require("./rutaTest");
const notificationRoutesFn = require("./notificationsRoutes"); 
const specieRoutes = require("./specieRoutes")
const subSpecieRoutes = require("./subSpecieRoutes")
const claseSexualRoutes = require("./claseSexualRoutes");
const categoriRoutes = require("./categoriRoutes")
const estadisticaRoutes = require ("./estadisticasRoutes")

const ubicacionRoutes = require("./ubicacionRoutes")  
module.exports = (sequelize, io) => {
  const router = express.Router();
  const notificationRoutes = notificationRoutesFn(sequelize, io); 

  const globalMiddlewares = [
    authMiddleware,
    checkForcePasswordChange,
    
  ];
  router.use("/auth", authRoutes);



  router.use("/users", [...globalMiddlewares], userRoutes);
  router.use("/master", masterRoutes);
  router.use("/admin",[...globalMiddlewares], adminRoutes,);
  router.use("/reportes",[...globalMiddlewares], reporteRoutes);
  router.use("/matadero",[...globalMiddlewares], mataderoRoutes);
  //router.use("/veterinarios", veterinarioRoutes);
  router.use("/notifications",[...globalMiddlewares], notificationRoutes);
  router.use("/specie",[...globalMiddlewares], specieRoutes);
  router.use("/sub-specie",[...globalMiddlewares], subSpecieRoutes);
  router.use("/clase-sexual",[...globalMiddlewares],claseSexualRoutes );
  router.use("/categorie",[...globalMiddlewares],categoriRoutes )
  router.use("/test", [...globalMiddlewares],testRoutes);
  router.use("/estadisticas",[...globalMiddlewares],estadisticaRoutes )
  router.use("/ubicacion",[...globalMiddlewares],ubicacionRoutes )
  return router;
};
