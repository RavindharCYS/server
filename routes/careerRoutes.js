// server/routes/careerRoutes.js
const express = require('express');
const { body } = require('express-validator');
const careerController = require('../controllers/careerController');
const upload = require('../middleware/uploadMiddleware'); // Import multer middleware

const router = express.Router();

router.post(
  '/',
  upload.single('resumeFile'), // Field name for the resume file in the form (frontend FormData key)
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().isMobilePhone('any', { strictMode: false }).withMessage('Valid phone number if provided.'),
    body('position').trim().notEmpty().withMessage('Preferred position is required.'),
    body('experience').optional({ checkFalsy: true }).trim(),
    body('message').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters.'),
    // Note: 'resumeFile' is handled by multer, validation for it would typically be client-side and then by multer itself.
  ],
  careerController.submitApplication
);

module.exports = router;