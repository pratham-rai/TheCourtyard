// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Tournament.js
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  prizePool: { type: String, required: true },
  entryFee: { type: Number, required: true },
  image: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  winners: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tournament', tournamentSchema);
