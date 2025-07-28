const Joi = require('joi');


const crearMataderoSchema = Joi.object({
  nombre: Joi.string().required().messages({
    'any.required': 'El nombre es obligatorio',
    'string.empty': 'El nombre no puede estar vacío',
  }),
  ubicacion: Joi.object().optional(),
//   telefono: Joi.string()
//     .pattern(/^[0-9]{7,15}$/) 
//     .required()
//     .messages({
//       'any.required': 'El teléfono es obligatorio',
//       'string.pattern.base': 'Teléfono no válido (ej: 1234567890)',
//     }),
//   email: Joi.string().email().required().messages({
//     'any.required': 'El email es obligatorio',
//     'string.email': 'Email no válido',
//   }),
  capacidadDiaria: Joi.number().integer().min(1).required().messages({
    'any.required': 'La capacidad diaria es obligatoria',
    'number.min': 'La capacidad debe ser al menos 1',
  }),
});


const actualizarMataderoSchema = Joi.object({
  nombre: Joi.string(),
  capacidadDiaria: Joi.number().integer().min(1),

  veterinarioId: Joi.forbidden().when(Joi.ref('$userRole'), {
    is: 'admin',
    then: Joi.number().integer().optional() 
  })
}).min(1);

const validateCrearMatadero = (req, res, next) => {
  const userRole = req.user.role;

  // Esquema base común
  const baseSchema = {
    nombre: Joi.string().required().messages({
      'any.required': 'El nombre es obligatorio',
      'string.empty': 'El nombre no puede estar vacío',
    }),
    ubicacion: Joi.object().optional(),
    capacidadDiaria: Joi.number().integer().min(1).required().messages({
      'any.required': 'La capacidad diaria es obligatoria',
      'number.min': 'La capacidad debe ser al menos 1',
    }),
  };

  // Solo admins pueden enviar veterinarioId
  if (userRole === 'admin') {
    baseSchema.veterinarioId = Joi.string().uuid().optional().allow(null, '')
  }

  const schema = Joi.object(baseSchema);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};



const validateActualizarMatadero = (req, res, next) => {
  const userRole = req.user.role; // Obtener el rol del usuario autenticado

  // Definir schema dinámico
  const schema = Joi.object({
    nombre: Joi.string(),
    capacidadDiaria: Joi.number().integer().min(1),
    veterinarioId: Joi.forbidden().when(Joi.ref('$userRole'), {
      is: 'admin',
      then: Joi.number().integer().optional() // Solo admin puede enviar este campo
    })
  }).min(1);

  // Validar con contexto
  const { error } = schema.validate(req.body, { 
    context: { userRole } // <- Pasar el rol como contexto
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateCrearMatadero,
  validateActualizarMatadero,
};