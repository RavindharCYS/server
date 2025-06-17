const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  service: { type: String, trim: true }, // Service they might be interested in
  submissionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);