const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  service: { type: String, required: true, trim: true },
  serviceLabel: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  company: { type: String, trim: true },
  website: { type: String, trim: true },
  submissionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);