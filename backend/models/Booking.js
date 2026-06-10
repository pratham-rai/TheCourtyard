// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  slots: [{ type: Number, required: true }], // array of hours e.g. [9, 10] meaning 9:00-11:00
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
  paymentId: { type: String }, // Razorpay transaction/mock ID
  qrCodeData: { type: String, required: true }, // Unique code for check-in
  checkedIn: { type: Boolean, default: false }, // Whether the user has been scanned in
  checkedInSlots: [{ type: Number, default: [] }], // Specific slots checked in
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
