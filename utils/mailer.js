const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerification(email, code) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu cuenta',
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Gracias por registrarte. Por favor, utiliza el siguiente código para verificar tu cuenta:</p>
      <h2 style="color: #4CAF50; font-size: 24px; text-align: center;">${code}</h2>
      <p>Si no has solicitado esta verificación, puedes ignorar este correo.</p>
    `,
  });
}

async function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Recuperación de contraseña',
    html: `
      <h1>Recuperación de contraseña</h1>
      <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
      <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Restablecer contraseña</a>
      <p>Si no has solicitado este cambio, puedes ignorar este correo.</p>
      <p>Este enlace expirará en 1 hora.</p>
    `,
  });
}

async function sendInvitation(email, inviteCode, inviterEmail) {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?email=${encodeURIComponent(email)}&code=${inviteCode}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Invitación para unirte a nuestra plataforma',
    html: `
      <h1>Has sido invitado</h1>
      <p>${inviterEmail} te ha invitado a unirte a su compañía en nuestra plataforma.</p>
      <p>Haz clic en el siguiente enlace para aceptar la invitación y configurar tu cuenta:</p>
      <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Aceptar invitación</a>
      <p>Si no conoces a esta persona, puedes ignorar este correo.</p>
    `,
  });
}

module.exports = { sendVerification, sendPasswordReset, sendInvitation };