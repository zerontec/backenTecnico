const { bcrypt } = require("bcrypt");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { User, PasswordReset } = require("../models");
const crypto = require('crypto');
const env = require("dotenv");
const { getCookieOptions, getAccessTokenOptions } = require("../../config/cookies");
const {sendWelcomeEmail, sendAdminNotification} = require("../services/emailServices");
const NotificationService = require('../services/notificationService');
env.config();

const { sendEmail } = require("../services/emailServices");
const getNotificationService = require('./NotificactionServicesIntances');

const registerUserService = async (userData) => {
  const {
    name,
    lastName,
    cedula,
    email,
    phone,
    password,
    colegioVeterinario,
    mpps,
    runsai,
    status,
  } = userData;
  console.log("Datos recibidos en registerUserService:", JSON.stringify(userData, null, 2));
  // Validación básica
  if (!email || !password || !lastName || !cedula) throw new Error("Email y contraseña son requeridos");

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error("El usuario ya existe");
  const existingCedula = await User.findOne({ where: { cedula } })
  if (existingCedula) throw new Error("El numero de cedula ya fue registrado");


  const existinGRunsai = await User.findOne({ where: { runsai } })
  if (existinGRunsai) throw new Error("El numero de runsai ya fue registrado");
  const existingMpps = await User.findOne({ where: { mpps } })
  if (existingMpps) throw new Error("El numero de mpps ya fue registrado");
  const existingColegioVeterinario = await User.findOne({ where: { colegioVeterinario } })
  if (existingColegioVeterinario) throw new Error("El numero de colegio veterinario ya fue registrado");



  // Crear usuario con valores por defecto
  const newUser = await User.create({
    name: name?.trim(),
    email: email.toLowerCase().trim(),
    lastName: lastName,
    cedula: cedula,
    phone,
    password: await argon2.hash(password),
    role: 'veterinarian',
    licenseNumber: null,
    status: status,
    colegioVeterinario: colegioVeterinario,
    mpps: mpps,
    runsai: runsai,
  });

  try {
    await sendWelcomeEmail(newUser);
    console.log('✅ Email de bienvenida enviado a', newUser.email);
  } catch (emailError) {
    console.error('❌ Error enviando email de bienvenida:', emailError.message);
    // No lanzamos error para no interrumpir el registro
    // Puedes agregar monitoreo adicional aquí (Sentry, etc)
  }


  
  
  try {
    await sendAdminNotification(newUser);
    console.log('✅ Notificación enviada al administrador');
  } catch (adminEmailError) {
  
  
  
    console.error('❌ Error enviando notificación a admin:', adminEmailError.message);
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.error("Errores de validación:", validationErrors);
      throw new Error(`Errores de validación: ${JSON.stringify(validationErrors)}`);
    }
    
    throw error;
  }

  const notificationService = getNotificationService();
  await notificationService.notifyNewUserRegistration(newUser);
  
  
  
  
  console.log('✅ Notificación enviada al usuario');
  
  
  
  
  // Generar token JWT
  const token = jwt.sign(
    {
      id: newUser.id,
      role: newUser.role,
      cedula: newUser.cedula,
      status: newUser.status,
      email: newUser.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

    return { user: newUser, token };
};



const loginUserService = async (email, password, res) => {
  // 1. Primero verificar si el usuario existe
  const user = await User.findOne({
    where: { email },
    raw: true,
  });

  if (!user) {
    throw { 
      status: 401, 
      message: "Credenciales inválidas",
      code: "INVALID_CREDENTIALS"
    };
  }

  if (user.status !== 'activo') {
    throw new Error("Cuenta no activada. Contacta al administrador");
  }

  if (user.force_password_change) {
    // Generar token especial solo para cambio de contraseña
    const tempToken = jwt.sign(
      { id: user.id, forceChange: true },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    return res.status(200).json({
      error: "Debes cambiar tu contraseña",
      code: "FORCE_PASSWORD_CHANGE",
      token: tempToken
    });
  }


  if (!(await argon2.verify(user.password, password))) {
    throw { 
      status: 401, 
      message: "Credenciales inválidas",
      code: "INVALID_CREDENTIALS"
    };
  }
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );


  res.cookie('accessToken', accessToken, getAccessTokenOptions());
  res.cookie('refreshToken', refreshToken, getCookieOptions());

  const { password: _, ...userData } = user;
  return { user: userData };
};

const generateRecoveryTokenService = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // No revelar que el usuario no existe

    // Generar token seguro
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar token en la base de datos
    await PasswordReset.create({
      token,
      expires_at: expiresAt,
      user_id: user.id, // Asegúrate de que user.id sea el ID correcto
    });

    // Enviar email con enlace seguro
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Recuperación de contraseña",
      html: `Hola ${user.name},<br><br>
             Haz clic <a href="${resetUrl}">aquí</a> para restablecer tu contraseña.<br>
             El enlace expira en 15 minutos.`,
    });

    return token;
  } catch (error) {
    console.error("Error en generateRecoveryTokenService:", error);
    throw new Error("Error al generar el token de recuperación");
  }
};
const resetPasswordService = async (token, newPassword) => {
  // Validar token en base de datos
  const resetRequest = await PasswordReset.findOne({
    where: { token },
    include: [{ model: User, as: 'user' }]
  });

  if (!resetRequest || resetRequest.used || resetRequest.expires_at < new Date()) {
    throw new Error('Token inválido o expirado');
  }

  // Actualizar contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await Promise.all([
    resetRequest.user.update({ password: hashedPassword }),
    resetRequest.update({ used: true })
  ]);

  try {
    await sendEmail({
      to: resetRequest.user.email,
      subject: "Contraseña restablecida",
      html: `Hola ${resetRequest.user.name},<br><br>
             Tu contraseña ha sido restablecida con éxito.<br>
             <small>Si no realizaste esta acción, por favor contacta a soporte.</small>`
    });
  } catch (emailError) {
    console.error('❌ Error enviando confirmación de reseteo:', {
      user: resetRequest.user.email,
      error: emailError.message
    });
    // No lanzamos error para no afectar el flujo principal
  }
}



const adminResetPasswordService = async (userId, adminEmail) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Usuario no encontrado');

  // Generar contraseña temporal
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await argon2.hash(tempPassword);

  // Actualizar usuario
  await user.update({
    password: hashedPassword,
    forcePasswordChange: true
  });

  // Email al USUARIO
  await sendEmail({
    to: user.email,
    subject: 'Contraseña temporal generada',
    html: `Hola ${user.name},<br><br>
           Tu contraseña temporal es: <strong>${tempPassword}</strong><br>
           Debes cambiarla al iniciar sesión.`
  });

  // Email al ADMIN
  await sendEmail({
    to: adminEmail, // <-- Usar el parámetro recibido
    subject: 'Notificación de restablecimiento',
    html: `Hola Administrador,<br><br>
           Has restablecido la contraseña de: <strong>${user.email}</strong>.<br>
           Fecha: ${new Date().toLocaleDateString()}`
  });

  return true;
};

const verificarUsuario = async (userId) => {
  if (!userId) {
    return {
      valid: false,
      status: 401,
      message: "Token inválido: Payload incompleto"
    };
  }

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return {
      valid: false,
      status: 401,
      message: "Usuario no existe en la base de datos"
    };
  }

  return {
    valid: true,
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.isApproved
    }
    
   
  };
 
 


}

// services/authService.js
const verifySessionService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    raw: true
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.status !== 'activo') {
    throw new Error('Cuenta no activa');
  }

  return user;
};

// routes/auth.js
const refreshTokens = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ code: "MISSING_REFRESH_TOKEN" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error("Usuario no encontrado");

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true });
  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(401).json({ code: "INVALID_REFRESH_TOKEN" });
  }
};


module.exports = {
  registerUserService,
  loginUserService,
  generateRecoveryTokenService,
  resetPasswordService,
  verificarUsuario,
  adminResetPasswordService,
  verifySessionService,
  refreshTokens
};