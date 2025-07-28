const {
  registerUserService,
  loginUserService,
  generateRecoveryTokenService,
  resetPasswordService,
  adminResetPasswordService
} = require("../services/authService");
const argon2 = require("argon2");
const { sendWelcomeEmail } = require("../services/emailServices");
const {User,PasswordChangeRequest} = require('../models')
const {sendEmail }= require("../services/emailServices");
const {bcrypt }= require("bcrypt");
const crypto = require('crypto');
const {getCookieOptions, getAccessTokenOptions} = require("../../config/cookies");

const registerUser = async (req, res, next) => {
try {
    const user = await registerUserService(req.body); 
console.log("Usuario registrado:", user); // Agregar log para verificar el usuario registrado
//await sendWelcomeEmail(user.user); // Enviar correo de bienvenida


    res.status(201).json(user);
 
 
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message.includes("invalid") 
        ? "Datos de registro inválidos" 
        : error.message
    });
  }
}

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password, res);
    
    // Marcar como éxito para resetear rate limiter
    req.loginSuccessful = true;
    
    res.json(result);
  } catch (error) {
    // Pasar el error al siguiente middleware
    next(error);
  }
};
const requestPasswordRecovery = async (req, res, next) => {
  try {
    const { email } = req.body;
    const token = await generateRecoveryTokenService(email);
    // Enviar el token por correo electrónico
    res.status(200).json({ message: "Recovery email sent", token });
  } catch (error) {
    next(error);
  }
};


// controllers/authController.js
const requestPasswordChange = async (req, res) => {
  try {
    const { email, reason } = req.body;
    console.log("USER MODEL",User)
    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: "Si el usuario existe, se notificará al administrador" }); // No revelar existencia

    console.log("PasswordChs MODEL",PasswordChangeRequest)
    // Crear solicitud pendiente
    await PasswordChangeRequest.create({
      userId: user.id,
      reason: reason || "Sin motivo especificado",
    });

    // Notificar al admin por email
    const adminEmails = await User.findAll({ 
      where: { role: "admin" },
      attributes: ["email"],
    });

    const adminEmailsList = adminEmails.map(admin => admin.email).join(", ");
    await sendEmail({
      to: adminEmailsList,
      subject: "Solicitud de cambio de contraseña pendiente",
      html: `El usuario ${user.email} ha solicitado un cambio de contraseña.<br>
             Razón: ${reason || "N/A"}<br>
             Accede al panel de admin para gestionarla.`,
    });

    res.json({ message: "Solicitud enviada al administrador" });
  } catch (error) {
    console.error("Error en requestPasswordChange:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

// controllers/adminController.js
const listPasswordChangeRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const requests = await PasswordChangeRequest.findAndCountAll({
      where: { status: "pending" },
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
      offset: (page - 1) * limit,
      limit,
    });

    res.json({
      data: requests.rows,
      total: requests.count,
      totalPages: Math.ceil(requests.count / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
};


const handlePasswordChangeRequest = async (req, res) => {
  try {
    
    const { requestId, action } = req.body; 
    console.log("REQUEST ID", requestId)
  
    const request = await PasswordChangeRequest.findByPk(requestId, {
      include: [{ model: User, as: "user" }],
    });

    if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });

    if (action === "approve") {
      // Lógica para generar contraseña temporal (como ya tienes)
      const tempPassword = crypto.randomBytes(8).toString("hex");
      console.log("REQUEST", request.user )
      await request.user.update({
        password: await argon2.hash(tempPassword),
        forcePasswordChange: true,
      });

      // Notificar al usuario
      await sendEmail({
        to: request.user.email,
        subject: "Contraseña temporal generada",
        html: `Tu solicitud de cambio de contraseña fue aprobada.<br>
               Contraseña temporal: <strong>${tempPassword}</strong><br>
               Debes cambiarla al iniciar sesión.`,
      });
    } else {
      // Notificar rechazo
      await sendEmail({
        to: request.user.email,
        subject: "Solicitud de cambio de contraseña rechazada",
        html: "Tu solicitud de cambio de contraseña ha sido rechazada.",
      });
    }

    // Actualizar estado de la solicitud
    await request.update({ status: action === "approve" ? "approved" : "rejected" });

    res.json({ message: `Solicitud ${action === "approve" ? "aprobada" : "rechazada"}` });
  } catch (error) {
    res.status(500).json({error:error.message});
  }
};



const getToken = async (req, res) => {
try {
  // Solo se puede acceder a este endpoint si las cookies son válidas
  res.status(200).json({ 
    success: true,
    token: req.cookies.accessToken 
  });
} catch (error) {
  res.status(401).json({ 
    success: false,
    message: 'No se pudo obtener el token' 
  });
}
}



const requestPasswordReset = async (req, res) => {
  try {
    await generateRecoveryTokenService(req.body.email);
    res.json({ message: 'Si el usuario existe, se enviarán instrucciones' });
  } catch (error) {
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
};

const handlePasswordReset = async (req, res) => {
  try {
    await resetPasswordService(req.body.token, req.body.newPassword);
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const adminResetPassword = async (req, res) => {
  try {
    // Verificar rol primero
    if (req.user.role !== 'admin') {
      throw new Error('No autorizado');
    }

    const adminEmail = req.user.email; // Email del admin autenticado
    const { userId } = req.body;

    // Llamar al servicio con ambos parámetros
    await adminResetPasswordService(userId, adminEmail);

    res.json({ message: 'Contraseña temporal generada y notificaciones enviadas' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const forceChangePassword = async (req, res) => {
  try {
    console.log("Body recibido:", req.body); // Verifica todo el body
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        code: "MISSING_PASSWORD",
        message: "El campo newPassword es requerido"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        code: "INVALID_PASSWORD",
        message: "La contraseña debe tener al menos 8 caracteres" 
      });
    }
    // Hashear y actualizar contraseña
    const hashedPassword = await argon2.hash(newPassword);
    await User.update(
      { 
        password: hashedPassword,
        forcePasswordChange: false 
      },
      { where: { id: userId } }
    );

    // Invalidar tokens antiguos (opcional, mejora seguridad)
    // invalidateOldTokens(userId);

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error en forceChangePassword:", error);
    res.status(500).json({ 
      code: "SERVER_ERROR",
      message: "Error al actualizar la contraseña" 
    });
  }
};





// En controllers/adminController.js
const approveUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) throw new Error("Usuario no encontrado");
    
    await user.update({
      role: 'veterinarian',
      status: 'active'
    });

    res.json({ success: true, message: "Usuario aprobado exitosamente" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const check= async (req, res) => {

//  try{
//   const user = await User.findByPk(req.user.id, {
//     attributes: { exclude: ['password'] }
//   });
try {
  // El middleware de autenticación ya adjuntó el usuario en req.user
  const user = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status
  };
  
  res.status(200).json(user);
} catch (error) {
  res.status(500).json({ message: "Error de autenticación" });
}
};


// Backend - routes/authRoutes.js
const verifyToken = async (req, res) => {
  try {
    // Obtener datos del usuario desde el token
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "email", "role", "forcePasswordChange"]
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange
      }
    });
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

const logout = async (req, res) => {
  try {
    // Usar las MISMAS opciones que en el login
    const accessTokenOptions = getAccessTokenOptions();
    const refreshTokenOptions = getCookieOptions();
    
    // Eliminar cookies con configuración idéntica a cuando se crearon
    res.clearCookie('accessToken', {
      ...accessTokenOptions,
      maxAge: undefined // Importante para clearCookie
    });
    
    res.clearCookie('refreshToken', {
      ...refreshTokenOptions,
      maxAge: undefined // Importante para clearCookie
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en logout backend:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};



const verifySession = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) throw new Error('Usuario no encontrado');
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ 
      code: "SESSION_INVALID",
      message: error.message 
    });
  }
};


const refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) throw new Error('Usuario no encontrado');

    // Generar nuevo access token
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Configurar nueva cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true });
  } catch (error) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(401).json({ 
      success: false,
      message: error.message 
    });
  }
};



module.exports = {
  registerUser,
  loginUser,
  logout,
  requestPasswordRecovery,
  handlePasswordReset,
  approveUser,
  check,
  adminResetPassword,
  requestPasswordReset,
  forceChangePassword,
  requestPasswordChange,
  listPasswordChangeRequests,
  handlePasswordChangeRequest ,
  verifyToken,
  verifySession,
  refreshToken,
  getToken
  

};