// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Court.js
const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surface: { type: String, required: true }, // e.g. "Indoor Acrylic Glass", "Outdoor Panoramic Sky"
  image: { type: String, required: true },
  description: { type: String },
  basePrice: { type: Number, required: true }, // Off-peak hourly rate
  peakPrice: { type: Number, required: true }, // Peak hourly rate
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Court', courtSchema);
