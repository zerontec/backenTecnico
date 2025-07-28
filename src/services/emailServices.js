const nodemailer = require("nodemailer");
const postmarkTransport = require('nodemailer-postmark-transport'); // Nuevo paquete
const { welcomeNewUser } = require("./emailTemplate");

const env = require("dotenv");
env.config();

const transporter = nodemailer.createTransport(
  postmarkTransport({
    auth: {
      apiKey: process.env.POSTMARK_API_TOKEN 
    }
  })
);

const sendEmail = async ({ to, subject, html }) => {
  if (!to) throw new Error("No se proporcionó destinatario (to)");

  const mailOptions = {
    from: `"UTNC" <${process.env.EMAIL_FROM}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    headers: {
      'X-PM-Track-Opens': 'true',
      'X-PM-Track-Links': 'true'
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      postmarkResponse: info.response
    };

  } catch (error) {
    console.error("❌ Postmark Error:", {
      statusCode: error.responseCode,
      message: error.message,
      responseBody: error.responseBody
    });
    
    throw new Error("Error al enviar el correo: " + error.message);
  }
};


// En tu archivo de servicio de emails (ej: emailService.js)
const sendWelcomeEmail = async (user) => {
  const plainUser = user.get ? user.get({ plain: true }) : user;
  
  if (!plainUser?.email) throw new Error("El usuario no tiene email definido");

  // Parámetros para la plantilla de Postmark
  const templateModel = {
    product_name: "UTNC", // Nombre de tu aplicación
    name: plainUser.name || plainUser.email.split('@')[0],
    product_url: "https://dashboardnew-tawny.vercel.app",
    action_url: "https://dashboardnew-tawny.vercel.app/",
    login_url: "https://dashboardnew-tawny.vercel.app/signin",
    username: plainUser.email,
    trial_length: "30", 
    trial_start_date: new Date().toLocaleDateString('es-ES'),
    trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
    support_email: "soporte@nbagro.xyz",
    live_chat_url: "https://dashboardnew-tawny.vercel.app/soporte",
    sender_name: "Equipo UTNC",
    help_url: "https://dashboardnew-tawny.vercel.app/ayuda",
    company_name: "UTNC",
    company_address: "Tu dirección aquí"
  };

  try {
    const result = await transporter.sendMail({
      from: `"UTNC" <${process.env.EMAIL_FROM}>`,
      to: plainUser.email,
      templateId: 40620533, 
      templateModel: templateModel
    });
    
    console.log('✅ Email de bienvenida enviado via plantilla:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error enviando plantilla:', {
      error: error.message,
      response: error.response?.body
    });
    throw new Error("Error al enviar email de bienvenida");
  }






};

const sendAdminNotification = async (newUser) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nbagro.xyz';
  
  const approvalLink = `${process.env.FRONT_URL}/admin/user-list`;
  
  await sendEmail({
    to: adminEmail,
    subject: "📋 Nuevo usuario registrado - Requiere aprobación",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Nuevo registro en ${process.env.APP_NAME || "UTNC"}</h2>
        <p>Un nuevo usuario veterinario se ha registrado y requiere aprobación:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Nombre:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.name} ${newUser.lastName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Email:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.email}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Cédula:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.cedula}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Colegio Veterinario:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.colegioVeterinario}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>MPPS:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.mpps}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>RUNSAI:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${newUser.runsai}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${approvalLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #2ecc71; 
                    color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Revisar y Aprobar Usuario
          </a>
        </div>
        
        <p style="font-size: 0.9em; color: #7f8c8d;">
          Este es un mensaje automático. Fecha: ${new Date().toLocaleDateString('es-ES')}
        </p>
      </div>
    `
  });
};

const sendStatusChangeNotification = async (user, newStatus) => {
  try {
    let subject, message;
    
    if (newStatus === 'inactivo') {
      subject = "Tu cuenta ha sido desactivada";
      message = `Lamentamos informarte que tu cuenta en ${process.env.APP_NAME} ha sido desactivada.`;
    } else if (newStatus === 'active') {
      subject = "¡Tu cuenta ha sido reactivada!";
      message = `¡Buenas noticias! Tu cuenta en ${process.env.APP_NAME} ha sido reactivada.`;
    } else {
      subject = "Cambio en el estado de tu cuenta";
      message = `El estado de tu cuenta en ${process.env.APP_NAME} ha sido cambiado a: ${newStatus}`;
    }

    await sendEmail({
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5276;">${subject}</h2>
          <p>Hola ${user.name},</p>
          <p>${message}</p>
          
          ${newStatus === 'inactivo' ? `
          <div style="background:rgb(23, 29, 29); padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>Contacta a nuestro equipo de soporte: 
              <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a>
            </p>
          </div>
          ` : ''}
          
          <p style="font-size: 0.9em; color: #7f8c8d;">
            Este es un mensaje automático, por favor no respondas directamente.
          </p>
        </div>
      `
    });
    
    console.log(`✅ Notificación de estado (${newStatus}) enviada a ${user.email}`);
  } catch (error) {
    console.error(`❌ Error enviando notificación de estado a ${user.email}:`, error.message);
    throw error;
  }
};

module.exports = { sendEmail, sendWelcomeEmail, sendAdminNotification, sendStatusChangeNotification };