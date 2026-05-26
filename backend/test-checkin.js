const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Require all models to register their schemas with mongoose
const User = require('./models/User');
const Court = require('./models/Court');
const Booking = require('./models/Booking');
const Coach = require('./models/Coach');
const CoachingSession = require('./models/CoachingSession');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Membership = require('./models/Membership');
const Payment = require('./models/Payment');
const Tournament = require('./models/Tournament');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGODB_URI;

const runTest = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // 1. Fetch the user and course to find the seeded enrollment
    const user = await User.findOne({ email: 'player@thecourtyard.com' });
    const course = await Course.findOne({ title: '10 Days Summer Camp' });
    
    if (!user || !course) {
      throw new Error('Could not find seeded user or course');
    }

    const qrCodeData = `CY-ENROLL-${course._id}-${user._id}`;
    console.log(`🔍 Target QR Code data: ${qrCodeData}`);

    // 2. Query Enrollment in DB
    const enrollmentBefore = await Enrollment.findOne({ qrCodeData });
    if (!enrollmentBefore) {
      throw new Error('Seeded enrollment not found');
    }
    console.log(`📝 Enrollment status: ${enrollmentBefore.status}`);
    console.log(`📅 Attendance logs (before check-in):`, enrollmentBefore.attendance);

    // 3. Simulate calling /api/admin/scan-qr logic directly
    console.log('\n--- Simulating Admin Scanning the QR Code ---');
    const enrollment = await Enrollment.findOne({ qrCodeData })
      .populate({
        path: 'course',
        populate: { path: 'coach' }
      })
      .populate('user', '-password');

    const isValid = enrollment.status === 'active';
    const today = new Date().toISOString().split('T')[0];
    
    let alreadyMarked = false;
    let attendanceAdded = false;

    if (isValid) {
      if (enrollment.attendance.includes(today)) {
        alreadyMarked = true;
      } else {
        enrollment.attendance.push(today);
        await enrollment.save();
        attendanceAdded = true;
      }
    }

    console.log('📡 Response Result:');
    console.log({
      valid: isValid,
      isCoaching: true,
      alreadyMarked,
      attendanceAdded,
      enrollment: {
        id: enrollment._id,
        qrCodeData: enrollment.qrCodeData,
        status: enrollment.status,
        amountPaid: enrollment.amountPaid,
        attendance: enrollment.attendance,
        user: enrollment.user ? {
          name: enrollment.user.name,
          email: enrollment.user.email,
          membership: enrollment.user.membership
        } : null,
        course: enrollment.course ? {
          title: enrollment.course.title,
          duration: enrollment.course.duration,
          startDate: enrollment.course.startDate,
          endDate: enrollment.course.endDate,
          schedule: enrollment.course.schedule,
          coachName: enrollment.course.coach ? enrollment.course.coach.name : 'Unassigned'
        } : null
      }
    });

    // 4. Verify DB was updated
    const enrollmentAfter = await Enrollment.findOne({ qrCodeData });
    console.log(`\n📅 Attendance logs (after check-in):`, enrollmentAfter.attendance);
    if (attendanceAdded) {
      console.log('🎉 SUCCESS: New attendance entry added for today!');
    } else if (alreadyMarked) {
      console.log('🎉 SUCCESS: Attendance was already marked for today!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

runTest();
