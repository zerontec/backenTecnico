const Joi = require("joi");
const { Especie } = require("../models");

// Validación para crear/actualizar Especie
const especieSchema = Joi.object({
  nombre: Joi.string().required().messages({
    "any.required": "El nombre de la especie es obligatorio",
    "string.empty": "El nombre no puede estar vacío",
  }),
});

// Validación para crear/actualizar Subespecie
const subespecieSchema = Joi.object({
    nombre: Joi.string().required().messages({
      "any.required": "El nombre de la subespecie es obligatorio",
      "string.empty": "El nombre no puede estar vacío",
    }),
    especieId: Joi.string().guid({ version: "uuidv4" }).required().external(async (value) => {
      const especie = await Especie.findByPk(value);
      if (!especie) {
        throw new Error("La especie no existe");
      }
      return value;
    }).messages({
      "any.required": "La especie es obligatoria",
      "string.guid": "El ID de la especie debe ser un UUID válido",
    }),
  });

exports.validateEspecie = (req, res, next) => {
  const { error } = especieSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateSubespecie = (req, res, next) => {
  const { error } = subespecieSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};