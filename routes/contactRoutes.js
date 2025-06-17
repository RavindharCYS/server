// server/routes/contactRoutes.js
const express = require('express');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');

const router = express.Router();

// Route: POST /api/contact
// Description: Handles contact form submissions.
router.post(
  '/', // The path is relative to '/api/contact' defined in server.js
  [
    // Validation middleware
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().isMobilePhone('any', { strictMode: false }).withMessage('Please enter a valid phone number if provided.'), // 'any' for international, strictMode false is more lenient
    body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Subject cannot exceed 150 characters.'),
    body('message').trim().notEmpty().withMessage('Message is required.').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters.'),
    body('service').optional({ checkFalsy: true }).trim(),
    // Note: The 'consent' checkbox is usually validated on the frontend by making the input 'required'.
    // If you need server-side validation for it, you could add:
    // body('consent').equals('true').withMessage('You must agree to the privacy policy.');
  ],
  contactController.submitContactForm // Controller function
);

module.exports = router;