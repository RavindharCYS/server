// server/routes/bookingRoutes.js
const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Route: POST /api/bookings
// Description: Handles new booking submissions.
router.post(
  '/', // The path is relative to '/api/bookings' defined in server.js
  [
    // Validation middleware using express-validator
    body('service').trim().notEmpty().withMessage('Service selection is required.'),
    body('serviceLabel').trim().notEmpty().withMessage('Service label is required.'),
    body('date')
      .notEmpty().withMessage('Date is required.')
      .isISO8601().withMessage('Date must be a valid ISO 8601 date string.')
      .toDate(), // Converts to JS Date object
    body('time').trim().notEmpty().withMessage('Time selection is required.'),
    body('name').trim().notEmpty().withMessage('Full name is required.').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('company').optional({ checkFalsy: true }).trim(), // Allows empty string or null
    body('website').optional({ checkFalsy: true }).trim().isURL().withMessage('If provided, website must be a valid URL.'),
    // Add any other specific validations for your form fields
  ],
  bookingController.createBooking // Controller function to handle the request
);

module.exports = router;