// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\WalletTransaction.js
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // positive for credits/refunds, negative for debits/purchases
  type: { type: String, enum: ['topup', 'court_booking', 'coaching_enrollment', 'spot_billing', 'refund'], required: true },
  description: { type: String, required: true }, // e.g., "Racket Rental", "Loaded ₹1000"
  paymentMethod: { type: String, enum: ['wallet', 'cash', 'card', 'tab'], required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to admin/reception user
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
