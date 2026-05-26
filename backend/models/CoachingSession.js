// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\CoachingSession.js
const mongoose = require('mongoose');

const coachingSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  programType: { 
    type: String, 
    enum: ['Beginner Bootcamp', 'Intermediate Drill', 'Advanced Matchplay', 'Kids Program', 'Personal Training', 'Group Coaching'],
    required: true
  },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  slot: { type: Number, required: true }, // hour, e.g. 10 meaning 10:00-11:00
  amountPaid: { type: Number, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CoachingSession', coachingSessionSchema);
