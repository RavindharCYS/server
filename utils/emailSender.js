// server/utils/emailSender.js
const nodemailer = require('nodemailer');

// Configure the email transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465 (SSL), false for other ports (TLS/STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Some services might require more specific TLS options
  // tls: {
  //   ciphers:'SSLv3', // Example, adjust as needed
  //   rejectUnauthorized: false // Use with caution, for self-signed certs during dev
  // }
});

/**
 * Sends an email using the pre-configured transporter.
 * @param {object} mailDetails - The details for the email.
 * @param {string} mailDetails.to - Recipient's email address(es).
 * @param {string} mailDetails.subject - Subject line of the email.
 * @param {string} mailDetails.text - Plain text body of the email.
 *   (Optional if html is provided)
 * @param {string} mailDetails.html - HTML body of the email.
 *   (Optional if text is provided)
 * @returns {Promise<object>} - The info object returned by Nodemailer's sendMail.
 * @throws {Error} - If email sending fails.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('Missing required email parameters (to, subject, and text or html).');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM_ADDRESS, // Sender address (configured in .env)
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to} with subject "${subject}":`, error);
    // Rethrow a more specific error or a generic one for the controller to handle
    throw new Error(`Failed to send email. Please check server logs. Original error: ${error.message}`);
  }
};

module.exports = sendEmail;