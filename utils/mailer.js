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
    text: `Tu código de verificación es: ${code}`,
  });
}

module.exports = { sendVerification };
