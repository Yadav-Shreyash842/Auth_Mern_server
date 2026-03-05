const nodemailer = require ("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ [NODEMAILER] Email configuration error:', error.message);
    console.error('Please check:');
    console.error('1. EMAIL_USER is set correctly');
    console.error('2. EMAIL_PASS is an App Password (not regular Gmail password)');
    console.error('3. Less secure app access is enabled OR using App Password');
  } else {
    console.log('✅ [NODEMAILER] Email server is ready to send messages');
  }
});

module.exports = transporter;