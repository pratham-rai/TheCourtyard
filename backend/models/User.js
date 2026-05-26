// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'reception', 'coach'], default: 'user' },
  membership: { type: String, enum: ['None', 'Basic', 'Pro', 'Elite'], default: 'None' },
  membershipExpiry: { type: Date },
  walletBalance: { type: Number, default: 0 },
  tabBalance: { type: Number, default: 0 },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' }, // Links coach users to their Coach profile
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  isVerified: { type: Boolean, default: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  isGoogleUser: { type: Boolean, default: false },
  hasCreatedPassword: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
