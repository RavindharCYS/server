// server/controllers/bookingController.js
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/emailSender');
const Booking = require('../models/Booking'); // Import Booking model

exports.createBooking = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array(),
    });
  }

  const { service, serviceLabel, date, time, name, email, company, website } = req.body;
  const jsDate = new Date(date); // Ensure `date` from req.body is compatible with JS Date
                               // .toDate() in bookingRoutes already does this, but double check format from frontend

  const formattedDate = jsDate.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  try {
    // 1. Save to Database
    const newBooking = new Booking({
      service, serviceLabel, date: jsDate, time, name, email, company, website
    });
    await newBooking.save();
    console.log('Booking data saved to DB:', newBooking._id);

    // 2. Send confirmation email to the user (existing email logic)
    // ... (your existing user email logic, consider adding booking ID) ...
     const userEmailSubject = `Your Tzur Global Consultation for "${serviceLabel}" is Booked!`;
    const userEmailHtml = `
      <p>Dear ${name},</p>
      <p>Thank you for booking a consultation with Tzur Global for the <strong>${serviceLabel}</strong> service.</p>
      <p>Your session is scheduled for:</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      ${website ? `<p><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></p>` : ''}
      <p>Your Booking ID: ${newBooking._id}</p>
      <p>We will send you a calendar invitation and any necessary meeting details shortly.</p>
      <p>Best regards,<br/>The Tzur Global Team</p>
    `;
     const userEmailText = `Dear ${name},\n\nThank you for booking... Booking ID: ${newBooking._id} ...`;
    await sendEmail({ to: email, subject: userEmailSubject, text: userEmailText, html: userEmailHtml });


    // 3. Send notification email to admin (existing email logic)
    // ... (your existing admin email logic, consider adding booking ID) ...
    const adminEmailSubject = `New Consultation Booking: ${serviceLabel} - ${name}`;
    const adminEmailHtml = `
      <p>A new consultation has been booked:</p>
      <ul>
        <li><strong>Client Name:</strong> ${name}</li>
        <li><strong>Client Email:</strong> <a href="mailto:${email}">${email}</a></li>
        <li><strong>Service Requested:</strong> ${serviceLabel} (ID: ${service})</li>
        <li><strong>Preferred Date:</strong> ${formattedDate}</li>
        <li><strong>Preferred Time:</strong> ${time}</li>
        ${company ? `<li><strong>Company:</strong> ${company}</li>` : ''}
        ${website ? `<li><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></li>` : ''}
        <li><strong>Booking ID:</strong> ${newBooking._id}</li>
      </ul>
      <p>Please follow up.</p>
    `;
    const adminEmailText = `New Consultation Booking... Booking ID: ${newBooking._id} ...`;
    await sendEmail({ to: process.env.ADMIN_EMAIL, subject: adminEmailSubject, text: adminEmailText, html: adminEmailHtml });

    // 4. Send success response
    res.status(201).json({
      message: 'Booking successful and recorded! Confirmation emails have been sent.',
      bookingDetails: {
        id: newBooking._id, name, email, serviceLabel, date: formattedDate, time,
      },
    });

  } catch (error) {
    console.error('Error in createBooking controller:', error);
    if (error.name === 'ValidationError') {
         return res.status(400).json({ message: "Database validation failed", errors: error.errors });
    }
    next(error);
  }
};