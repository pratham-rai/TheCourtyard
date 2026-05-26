// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\models\Enrollment.js
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amountPaid: { type: Number, required: true },
  paymentId: { type: String, required: true }, // local mock transaction ID
  qrCodeData: { type: String, required: true, unique: true }, // Format: CY-ENROLL-{courseId}-{userId}
  enrolledAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'completed'], 
    default: 'active' 
  },
  attendance: [{ type: String }], // Array of check-in dates in YYYY-MM-DD format
  progressLogs: [{
    date: { type: String, required: true },
    remarks: String,
    skills: {
      footwork: { type: Number, min: 1, max: 5 },
      serve: { type: Number, min: 1, max: 5 },
      dinking: { type: Number, min: 1, max: 5 },
      backhand: { type: Number, min: 1, max: 5 },
      stamina: { type: Number, min: 1, max: 5 }
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
