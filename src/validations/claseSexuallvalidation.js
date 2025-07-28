// Agregar al archivo existente:
const Joi = require("joi");
const { Subespecie, ClaseSexual } = require("../models");

exports.validateClaseSexual = (req, res, next) => {
  const schema = Joi.object({
    nombre: Joi.string().required().messages({
      "any.required": "El nombre es obligatorio",
      "string.empty": "El nombre no puede estar vacío",
    }),
    subespecie_id: Joi.string().required().uuid().external(async (value) => {
      const subespecie = await Subespecie.findByPk(value);
      if (!subespecie) throw new Error("Subespecie no encontrada");
      return value;
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  next();
};

exports.validateCategoria = (req, res, next) => {
  const schema = Joi.object({
    nombre: Joi.string().required().messages({
      "any.required": "El nombre es obligatorio",
      "string.empty": "El nombre no puede estar vacío",
    }),
    clase_sexual_id: Joi.string().required().uuid().external(async (value) => {
      const claseSexual = await ClaseSexual.findByPk(value);
      if (!claseSexual) throw new Error("Clase sexual no encontrada");
      return value;
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  next();
};