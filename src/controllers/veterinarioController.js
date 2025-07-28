const { User } = require('../models');
// const EmailService = require('../services/emailService');




// exports.registroVeterinario = async (req, res) => {
//   try {
//     const { name, email, password, licenseNumber, phone } = req.body;
    
//     const vet = await User.create({
//       name,
//       email,
//       password,
//       licenseNumber,
//       phone,
//       role: 'veterinarian',
//       status: 'pending'
//     });

//     // Notificar al admin
//     // await EmailService.notificarNuevoVeterinario(vet);
    
//     res.status(201).json({
//       success: true,
//       message: 'Registro exitoso. Espera aprobación del administrador'
//     });
    
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.aprobarVeterinario = async (req, res) => {
  const vet = await User.findByPk(req.params.id);
  
  if (!vet || vet.role !== 'veterinarian') {
    return res.status(404).json({ error: 'Veterinario no encontrado' });
  }

  await vet.update({ status: 'approved' });
  
  // Notificar al veterinario
  await EmailService.enviarAprobacionVeterinario(vet);
  
  res.json({ success: true });
};

exports.listarPendientes = async (req, res) => {
  const vets = await User.findAll({
    where: { 
      role: 'veterinarian',
      status: 'pending' 
    }
  });
  
  res.json(vets);
};