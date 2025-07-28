const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const authSchema = require('./schemas/authSchema');
const userSchema = require('./schemas/userSchema');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ZERONTEC API",
      version: "1.0.0",
      description: "Api para la gesttion Inmobiliaria",
    },
    servers: [{ url: "http://localhost:4000/api/v1" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ...userSchema,
        ...authSchema,

        // Definición directa del esquema de error
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error en la solicitud",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Formato de correo electrónico no válido",
                  },
                },
              },
            },
            statusCode: {
              type: "integer",
              example: 400,
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;