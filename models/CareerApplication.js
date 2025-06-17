const mongoose = require('mongoose');

const CareerApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  position: { type: String, required: true, trim: true }, // Preferred position
  experience: { type: String, trim: true }, // Experience level
  message: { type: String, trim: true }, // Additional info
  resumePath: { type: String, required: true }, // Path to the uploaded resume
  submissionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CareerApplication', CareerApplicationSchema);