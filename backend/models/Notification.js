// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'promo', 'booking'], default: 'info' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If null, this is broadcast to all users
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
