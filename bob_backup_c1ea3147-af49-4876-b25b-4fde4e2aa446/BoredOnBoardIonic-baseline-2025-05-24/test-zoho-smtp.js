const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.eu',
  port: 465,
  secure: true, // true pour port 465
  auth: {
    user: 'bobplans@sunshine-adventures.net',
    pass: 'HzCXsEafd6PK'
  }
});

const mailOptions = {
  from: 'bobplans@sunshine-adventures.net',
  to: 'd_mangano@yahoo.com',
  subject: 'Test SMTP Zoho depuis Node.js',
  text: 'Ceci est un test d’envoi SMTP direct depuis Node.js via Zoho.',
  html: '<b>Ceci est un test d’envoi SMTP direct depuis Node.js via Zoho.</b>'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('Erreur d\'envoi :', error);
  }
  console.log('Email envoyé !', info.response);
}); 