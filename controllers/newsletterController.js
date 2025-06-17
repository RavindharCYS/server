// server/controllers/newsletterController.js
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/emailSender');
const NewsletterSubscription = require('../models/NewsletterSubscription');

exports.subscribe = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed. Please check your input.',
      errors: errors.array(),
    });
  }

  const { email } = req.body;

  try {
    let subscription = await NewsletterSubscription.findOne({ email });
    if (subscription) {
      return res.status(200).json({ message: 'You are already subscribed to our newsletter!', subscriptionId: subscription._id });
    }

    subscription = new NewsletterSubscription({ email });
    await subscription.save();
    console.log('Newsletter subscription saved to DB:', subscription._id);

    // Optional: Send welcome email to subscriber
    const welcomeSubject = 'Welcome to the Tzur Global Newsletter!';
    const welcomeHtml = `
      <p>Hi there,</p>
      <p>Thank you for subscribing to the Tzur Global newsletter!</p>
      <p>Stay tuned for updates, insights, and special offers.</p>
      <p>Best regards,<br/>The Tzur Global Team</p>
    `;
    await sendEmail({
      to: email,
      subject: welcomeSubject,
      html: welcomeHtml,
      text: 'Welcome to Tzur Global Newsletter! ...'
    });

    // Optional: Notify admin (or not, depends on preference for newsletters)
    /*
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Newsletter Subscription',
      text: `New subscription from: ${email}`,
      html: `<p>New newsletter subscription from: ${email}</p>`
    });
    */

    res.status(201).json({
      message: 'Successfully subscribed to the newsletter! Welcome aboard.',
      subscriptionId: subscription._id
    });

  } catch (error) {
    console.error('Error in newsletter subscribe controller:', error);
    if (error.code === 11000) { // Mongoose duplicate key error
        return res.status(400).json({ message: "This email is already subscribed." });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Database validation failed", errors: error.errors });
    }
    next(error);
  }
};