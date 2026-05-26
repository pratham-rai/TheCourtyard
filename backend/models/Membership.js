// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Membership.js
const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  name: { type: String, enum: ['Basic', 'Pro', 'Elite'], required: true, unique: true },
  price: { type: Number, required: true },
  durationMonths: { type: Number, default: 1 },
  benefits: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Membership', membershipSchema);
