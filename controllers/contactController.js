// server/controllers/contactController.js
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/emailSender');
const Contact = require('../models/Contact'); // Import Contact model

exports.submitContactForm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array(),
    });
  }

  const { name, email, phone, subject, message, service } = req.body;

  try {
    // 1. Save to Database
    const newContactSubmission = new Contact({
      name, email, phone, subject, message, service
    });
    await newContactSubmission.save();
    console.log('Contact form data saved to DB:', newContactSubmission._id);

    // 2. Send the contact message to the admin/team (existing email logic)
    // ... (your existing admin email sending logic) ...
    const adminEmailSubject = `New Contact Form Message from ${name}: "${subject || 'General Inquiry'}"`;
    const adminEmailHtml = `
      <p>You have received a new message via the Tzur Global contact form:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
        ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
        ${service ? `<li><strong>Regarding Service:</strong> ${service}</li>` : ''}
        <li><strong>Subject:</strong> ${subject || 'Not specified'}</li>
      </ul>
      <hr>
      <h3>Message:</h3>
      <p style="white-space: pre-wrap;">${message}</p>
      <hr>
      <p>Database Record ID: ${newContactSubmission._id}</p>
      <p>Please respond to this inquiry promptly.</p>
    `;
    const adminEmailText = `New Contact Form Message:\nName: ${name}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ''}${service ? `Regarding Service: ${service}\n` : ''}Subject: ${subject || 'Not specified'}\n\nMessage:\n${message}\n\nDatabase Record ID: ${newContactSubmission._id}\nPlease respond promptly.`;

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: adminEmailSubject,
      text: adminEmailText,
      html: adminEmailHtml,
    });


    // 3. (Optional) Send an auto-reply confirmation to the user (existing email logic)
    // ... (your existing user email sending logic) ...
    const userEmailSubject = `We've Received Your Message, ${name}!`;
    const userEmailHtml = `
      <p>Dear ${name},</p>
      <p>Thank you for contacting Tzur Global! We have successfully received your message regarding "${subject || 'your inquiry'}".</p>
      <p>Our team will review your submission and get back to you as soon as possible, typically within 1-2 business days.</p>
      <p>Sincerely,<br/>The Tzur Global Team</p>
    `;
    const userEmailText = `Dear ${name},\n\nThank you for contacting Tzur Global! We have received your message regarding "${subject || 'your inquiry'}".\nOur team will review your submission and get back to you soon.\n\nSincerely,\nThe Tzur Global Team`;

    await sendEmail({
        to: email,
        subject: userEmailSubject,
        text: userEmailText,
        html: userEmailHtml,
    });

    // 4. Send success response
    res.status(200).json({
      message: 'Your message has been sent successfully and recorded! We will get back to you shortly.',
      submissionId: newContactSubmission._id
    });

  } catch (error) {
    console.error('Error in submitContactForm controller:', error);
    if (error.name === 'ValidationError') {
         return res.status(400).json({ message: "Database validation failed", errors: error.errors });
    }
    next(error);
  }
};