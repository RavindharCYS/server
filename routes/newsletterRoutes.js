// server/routes/newsletterRoutes.js
const express = require('express');
const { body } = require('express-validator');
const newsletterController = require('../controllers/newsletterController');

const router = express.Router();

router.post(
  '/subscribe',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  ],
  newsletterController.subscribe
);

module.exports = router;