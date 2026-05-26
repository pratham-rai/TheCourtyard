// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\SystemSettings.js
const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "tax_rate"
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // e.g. 18
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
