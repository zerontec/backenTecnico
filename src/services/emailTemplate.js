exports.welcomeNewUser = (user) => {
    return {
      subject: "👋 ¡Bienvenido a nuestra plataforma!",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola ${user.name},</h2>
          <p>Gracias por registrarte en nuestra plataforma.</p>
          <p>Tu cuenta está siendo revisada y será activada pronto.</p>
          <p>Te avisaremos por este mismo medio cuando esté lista.</p>
          <br/>
          <p>Saludos,</p>
          <strong>El equipo de UTNC</strong>
        </div>
      `
    };
  };
  