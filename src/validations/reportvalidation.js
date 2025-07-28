exports.validateReporte = (req, res, next) => {
  const schema = Joi.object({
    hubo_actividad: Joi.boolean().required(),
    observaciones: Joi.string().optional(),
    matadero_id: Joi.string().uuid().when('hubo_actividad', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden() // Prohibir si no hay actividad
    }),
    beneficio: Joi.object().when('hubo_actividad', {
      is: true,
      then: Joi.object({
        especie_id: Joi.string().uuid().required(),
        subespecie_id: Joi.string().uuid().required(),
        claseSexualId: Joi.string().uuid().required(),
        categoriaId: Joi.string().uuid().required(),
        cantidadCanales: Joi.number().min(1).required(),
        pesoPie: Joi.number().min(0).required(),
        precioPie: Joi.number().min(0).required(),
        pesoCanal: Joi.number().min(0).required(),
        precioCanal: Joi.number().min(0).required()
      }).required(),
      otherwise: Joi.forbidden() // Prohibir si no hay actividad
    }),
    origen: Joi.object().when('hubo_actividad', {
      is: true,
      then: Joi.object({
        entidadesOrigen: Joi.array().items(
          Joi.object({
            estado: Joi.string().required(),
            municipio: Joi.string().required(),
            cantidad_animales: Joi.number().min(0).required(),
            especie_id: Joi.string().uuid().required()
          })
        ).required()
      }).required(),
      otherwise: Joi.forbidden() // Prohibir si no hay actividad
    }),
    incidencias: Joi.array().items(
      Joi.object({
        tipo: Joi.string().valid(...).required(),
        descripcion: Joi.string().optional(),
        datos_adicionales: Joi.object().optional()
      })
    ).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};