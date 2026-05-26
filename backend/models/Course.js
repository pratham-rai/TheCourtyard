// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true }, // e.g. "10 Days", "2 Months"
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true }, // YYYY-MM-DD
  price: { type: Number, required: true },
  slotsTotal: { type: Number, required: true },
  slotsEnrolled: { type: Number, default: 0 },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  schedule: { type: String, required: true }, // e.g. "Mon, Wed, Fri @ 17:00-18:30"
  image: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'completed'], 
    default: 'upcoming' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
