const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function sendTestMail() {
  console.log('Using SMTP Config:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.SMTP_FROM);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS.replace(/^'|'$/g, ''), // Strip quotes if any
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pixen.in',
      to: 'sauarbh.pandey@pucho.ai',
      subject: 'Pixen SMTP Test (Direct)',
      html: `<h3>Test Email</h3><p>Sent at ${new Date().toISOString()}</p>`,
    });
    console.log('✅ Email sent:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP Error:', err);
  }
}

sendTestMail();
