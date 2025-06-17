// server/controllers/careerController.js
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/emailSender');
const CareerApplication = require('../models/CareerApplication');

exports.submitApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array(),
    });
  }

  if (!req.file) { // req.file will be populated by multer
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  const { name, email, phone, position, experience, message } = req.body;
  const resumePath = req.file.path; // Path where multer saved the file

  try {
    const newApplication = new CareerApplication({
      name, email, phone, position, experience, message, resumePath
    });
    await newApplication.save();
    console.log('Career application saved to DB:', newApplication._id);

    // Send email to admin
    const adminEmailSubject = `New Career Application: ${position} - ${name}`;
    const adminEmailHtml = `
      <p>A new career application has been submitted:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
        ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
        <li><strong>Preferred Position:</strong> ${position}</li>
        ${experience ? `<li><strong>Experience Level:</strong> ${experience}</li>` : ''}
        ${message ? `<li><strong>Additional Info:</strong><br/>${message.replace(/\n/g, '<br/>')}</li>` : ''}
        <li><strong>Resume:</strong> Attached (or accessible at server path: ${resumePath})</li>
        <li><strong>Application ID:</strong> ${newApplication._id}</li>
      </ul>
      <p>Please review.</p>
    `;
    // For sending the actual file, nodemailer needs more setup, e.g., using `attachments`
    // For now, we'll just notify about the path.
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: adminEmailSubject,
      html: adminEmailHtml,
      text: `New career application from ${name} for ${position}. Resume path: ${resumePath}. ID: ${newApplication._id}`
    });

    // Send confirmation to user
    const userEmailSubject = `Your Application to Tzur Global has been Received, ${name}!`;
    const userEmailHtml = `
        <p>Dear ${name},</p>
        <p>Thank you for your interest in Tzur Global and for submitting your application for the ${position} role (or general consideration).</p>
        <p>We have successfully received your application (ID: ${newApplication._id}).</p>
        <p>Our hiring team will review your qualifications. If your profile matches our current needs, we will contact you for the next steps.</p>
        <p>Sincerely,<br/>The Tzur Global Team</p>
    `;
    await sendEmail({
        to: email,
        subject: userEmailSubject,
        html: userEmailHtml,
        text: `Dear ${name},\n\nThank you for applying to Tzur Global... Your application ID is ${newApplication._id}...\n\nSincerely,\nThe Tzur Global Team`
    });


    res.status(201).json({
      message: 'Application submitted successfully! We will review it and get in touch if your profile matches our needs.',
      applicationId: newApplication._id
    });

  } catch (error) {
    console.error('Error in submitApplication controller:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Database validation failed", errors: error.errors });
    }
    next(error);
  }
};