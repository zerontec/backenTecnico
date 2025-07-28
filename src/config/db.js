require("dotenv").config();
const { Sequelize } = require("sequelize");
const pg = require("pg");


const isProduction = process.env.IS_PRODUCTION === "true";
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      protocol: "postgres",
      dialectModule: pg,
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || "postgres",
        logging: false,
        dialectModule: pg,
      }
    );

sequelize
  .authenticate()
  .then(() => console.log("Success connecting to db"))
  .catch((err) => console.error("Error connecting to db:", err));

module.exports = sequelize;
