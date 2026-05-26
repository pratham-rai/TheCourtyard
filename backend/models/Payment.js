// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Court Booking', 'Coaching Session', 'Coaching Course', 'Membership', 'Club Amenities'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // refers to Booking, CoachingSession
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentMethod: { type: String, enum: ['cash', 'card', 'wallet', 'tab', 'online', 'split'], default: 'online' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
