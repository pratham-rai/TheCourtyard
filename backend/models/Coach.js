// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Coach.js
const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  bio: { type: String, required: true },
  specialization: [{ type: String }], // e.g. ["Dinking", "Spin & Serve", "Tactical Positioning"]
  experience: { type: Number, required: true }, // years
  rating: { type: Number, default: 5.0 },
  pricePerSession: { type: Number, required: true }, // hourly rate
  commissionRate: { type: Number, default: 70 }, // percentage of payment kept by coach (e.g. 70%)
  availability: {
    days: [{ type: String }], // e.g. ["Monday", "Wednesday", "Friday"]
    hours: [{ type: Number }] // e.g. [9, 10, 11, 14, 15, 16] (24h format)
  }
});

module.exports = mongoose.model('Coach', coachSchema);
