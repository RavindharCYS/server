const mongoose = require('mongoose');

const NewsletterSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  subscriptionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('NewsletterSubscription', NewsletterSubscriptionSchema);