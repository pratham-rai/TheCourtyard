// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

const seed = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // 1. Clean Database
    console.log('🧹 Purging old collections...');
    await User.deleteMany({});
    await Court.deleteMany({});
    await Booking.deleteMany({});
    await Coach.deleteMany({});
    await CoachingSession.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Membership.deleteMany({});
    await Payment.deleteMany({});
    await Tournament.deleteMany({});
    await Notification.deleteMany({});
    console.log('✨ Purge completed.');

    // 2. Seed Courts
    console.log('🏟️ Seeding Courts...');
    const courts = await Court.insertMany([
      {
        name: 'Court 1',
        surface: 'Professional Acrylic Cushion',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600',
        description: 'Premium indoor pickleball court with tournament-grade LED stadium floodlights, shock-absorbent acrylic cushioning, and high-contrast boundary markings.',
        basePrice: 800,
        peakPrice: 1200,
        isActive: true
      },
      {
        name: 'Court 2',
        surface: 'Professional Acrylic Cushion',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600',
        description: 'Premium indoor pickleball court with tournament-grade LED stadium floodlights, shock-absorbent acrylic cushioning, and high-contrast boundary markings.',
        basePrice: 800,
        peakPrice: 1200,
        isActive: true
      },
      {
        name: 'Court 3',
        surface: 'Professional Acrylic Cushion',
        image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=600',
        description: 'Premium indoor pickleball court with tournament-grade LED stadium floodlights, shock-absorbent acrylic cushioning, and high-contrast boundary markings.',
        basePrice: 800,
        peakPrice: 1200,
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${courts.length} premium courts.`);

    // 3. Seed Coaches
    console.log('👨‍🏫 Seeding Coaches...');
    const coaches = await Coach.insertMany([
      {
        name: 'Coach Pratham Raj',
        image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=600',
        bio: 'Former national level sports player with 8+ years crafting champions. Specializes in advanced top-spin serves, third shot kitchen drops, and fast volley reflex patterns.',
        specialization: ['Advanced Dinking', 'Spin Serves', 'Aggressive Third Shot Drops'],
        experience: 8,
        rating: 4.9,
        pricePerSession: 1500,
        availability: {
          days: ['Monday', 'Wednesday', 'Friday'],
          hours: [9, 10, 11, 15, 16, 17]
        }
      },
      {
        name: 'Coach Sarah Jenkins',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
        bio: 'Certified IPTPA Pro Trainer. Passionate about perfecting baseline backhands, paddle angle controls, and structuring beginner-to-advanced step progressions.',
        specialization: ['Beginner Foundations', 'Paddle Control', 'Tactical Positioning'],
        experience: 6,
        rating: 4.8,
        pricePerSession: 1200,
        availability: {
          days: ['Tuesday', 'Thursday', 'Saturday'],
          hours: [8, 9, 10, 14, 15]
        }
      },
      {
        name: 'Coach David Miller',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
        bio: 'Master of speed-up counters and rapid reflex dinking battles. Focuses on tournament competitive prep, mental fitness, and high-energy conditioning drills.',
        specialization: ['Kitchen Reflex Battles', 'Speed Dinking', 'Tournament Mindset'],
        experience: 10,
        rating: 5.0,
        pricePerSession: 1800,
        availability: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          hours: [10, 11, 16, 17, 18]
        }
      }
    ]);
    console.log(`✅ Seeded ${coaches.length} professional coaches.`);

    // 4. Seed Memberships
    console.log('🎫 Seeding Memberships...');
    const memberships = await Membership.insertMany([
      {
        name: 'Basic',
        price: 999,
        durationMonths: 1,
        benefits: ['10% discount on all court bookings', 'Book up to 3 days in advance', '1 free monthly guest pass']
      },
      {
        name: 'Pro',
        price: 1999,
        durationMonths: 1,
        benefits: ['25% discount on all court bookings', '10% discount on coaching programs', 'Book up to 7 days in advance', 'Priority locker room access']
      },
      {
        name: 'Elite',
        price: 4999,
        durationMonths: 1,
        benefits: ['100% FREE court bookings (unlimited off-peak)', '20% discount on all coaching programs', 'Book up to 14 days in advance', 'Free access to premium tournaments']
      }
    ]);
    console.log(`✅ Seeded ${memberships.length} memberships.`);

    // 5. Seed Tournaments
    console.log('🏆 Seeding Tournaments...');
    const tournaments = await Tournament.insertMany([
      {
        title: 'The Courtyard Summer Smash 2026',
        description: 'Our flagship double-elimination battle. Bring your best partner, compete under our high-performance stadium lights, and contest for the prestigious gold cup.',
        date: '2026-06-15',
        prizePool: '₹50,000 Cash + Trophy',
        entryFee: 999,
        image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600',
        status: 'upcoming'
      },
      {
        title: 'Kitchen Finesse & Dink Master Cup',
        description: 'A specialized championship testing patience, dink angles, and soft drops. Standard doubles format with separate brackets for intermediate and pro level pairings.',
        date: '2026-07-02',
        prizePool: '₹25,000 Pickleball Equipment Gear',
        entryFee: 499,
        image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600',
        status: 'upcoming'
      }
    ]);
    console.log(`✅ Seeded ${tournaments.length} tournament entries.`);

    // 6. Create Users
    console.log('👤 Seeding Users & Admins...');
    const hashedAdminPassword = await bcrypt.hash('adminpassword', 10);
    const hashedUserPassword = await bcrypt.hash('userpassword', 10);
    const hashedReceptionPassword = await bcrypt.hash('receptionpassword', 10);
    const hashedCoachPassword = await bcrypt.hash('coachpassword', 10);

    const admin = new User({
      name: 'Admin Courtyard',
      email: 'admin@thecourtyard.com',
      password: hashedAdminPassword,
      role: 'admin',
      membership: 'Elite',
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await admin.save();

    const userPratham = new User({
      name: 'Pratham Player',
      email: 'player@thecourtyard.com',
      password: hashedUserPassword,
      role: 'user',
      membership: 'Pro',
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await userPratham.save();

    const receptionUser = new User({
      name: 'Reception Courtyard',
      email: 'reception@thecourtyard.com',
      password: hashedReceptionPassword,
      role: 'reception',
      membership: 'None'
    });
    await receptionUser.save();

    // Create User accounts for seeded Coaches
    const coach1User = new User({
      name: 'Coach Pratham Raj',
      email: 'coach.pratham@thecourtyard.com',
      password: hashedCoachPassword,
      role: 'coach',
      coach: coaches[0]._id,
      membership: 'None'
    });
    await coach1User.save();

    const coach2User = new User({
      name: 'Coach Sarah Jenkins',
      email: 'coach.sarah@thecourtyard.com',
      password: hashedCoachPassword,
      role: 'coach',
      coach: coaches[1]._id,
      membership: 'None'
    });
    await coach2User.save();

    const coach3User = new User({
      name: 'Coach David Miller',
      email: 'coach.david@thecourtyard.com',
      password: hashedCoachPassword,
      role: 'coach',
      coach: coaches[2]._id,
      membership: 'None'
    });
    await coach3User.save();

    console.log('✅ Seeded admin, receptionist, user, and coach credentials.');

    // 7. Seed Past Bookings and Payments for Rich Analytics
    console.log('📈 Seeding bookings & payment transactions for dashboard graphs...');
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Seed 5 bookings
    const bookingsData = [
      {
        user: userPratham._id,
        court: courts[0]._id,
        date: todayStr,
        slots: [9, 10], // 9:00 - 11:00 AM
        totalAmount: 1200,
        status: 'confirmed',
        paymentId: 'PAY-112233',
        qrCodeData: 'CY-CENT-TOD-0910'
      },
      {
        user: userPratham._id,
        court: courts[1]._id,
        date: todayStr,
        slots: [17, 18], // 5:00 - 7:00 PM (Peak)
        totalAmount: 1350,
        status: 'confirmed',
        paymentId: 'PAY-445566',
        qrCodeData: 'CY-SKY-TOD-1718'
      },
      {
        user: admin._id,
        court: courts[2]._id,
        date: todayStr,
        slots: [19], // 7:00 - 8:00 PM (Peak)
        totalAmount: 0, // Elite gets 100% discount
        status: 'confirmed',
        paymentId: 'PAY-ELITE-7788',
        qrCodeData: 'CY-CLAY-TOD-19'
      }
    ];

    const bookings = await Booking.insertMany(bookingsData);

    // Create payment entries for bookings
    await Payment.insertMany([
      {
        user: userPratham._id,
        amount: 1200,
        type: 'Court Booking',
        referenceId: bookings[0]._id,
        razorpayPaymentId: 'PAY-112233',
        status: 'success'
      },
      {
        user: userPratham._id,
        amount: 1350,
        type: 'Court Booking',
        referenceId: bookings[1]._id,
        razorpayPaymentId: 'PAY-445566',
        status: 'success'
      },
      {
        user: admin._id,
        amount: 0,
        type: 'Court Booking',
        referenceId: bookings[2]._id,
        razorpayPaymentId: 'PAY-ELITE-7788',
        status: 'success'
      },
      {
        user: userPratham._id,
        amount: 1999,
        type: 'Membership',
        referenceId: userPratham._id,
        razorpayPaymentId: 'PAY-MEMB-PRO',
        status: 'success'
      }
    ]);

    // Seed coaching sessions
    const session = new CoachingSession({
      user: userPratham._id,
      coach: coaches[0]._id,
      programType: 'Advanced Matchplay',
      date: todayStr,
      slot: 15, // 3 PM
      amountPaid: 1350, // 10% discount on 1500
      status: 'scheduled'
    });
    await session.save();

    const coachPayment = new Payment({
      user: userPratham._id,
      amount: 1350,
      type: 'Coaching Session',
      referenceId: session._id,
      razorpayPaymentId: 'PAY-COACH-SH15',
      status: 'success'
    });
    await coachPayment.save();

    // Seed coaching courses
    console.log('📚 Seeding Coaching Courses...');
    const course1 = new Course({
      title: '10 Days Summer Camp',
      description: 'Master the kitchen, perfect your paddle positioning, and dominate baseline battles in this intense summer training camp.',
      duration: '10 Days',
      startDate: todayStr,
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 3000,
      slotsTotal: 15,
      slotsEnrolled: 1, // we will seed 1 enrollment below
      coach: coaches[1]._id, // Coach Sarah Jenkins
      schedule: 'Mon, Wed, Fri @ 16:00-17:30',
      image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600',
      status: 'active'
    });
    await course1.save();

    const course2 = new Course({
      title: '2 Months Professional Course',
      description: 'An elite 2-month professional course focusing on high-speed kitchen reflex counter attacks, advanced spin serves, and tactical championship mindset.',
      duration: '2 Months',
      startDate: todayStr,
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 12000,
      slotsTotal: 10,
      slotsEnrolled: 0,
      coach: coaches[0]._id, // Coach Pratham Raj
      schedule: 'Tue, Thu, Sat @ 18:00-19:30',
      image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600',
      status: 'upcoming'
    });
    await course2.save();

    console.log('✅ Seeded coaching courses.');

    // Seed sample enrollment for userPratham
    console.log('🤝 Seeding sample Course Enrollment...');
    const enrollment = new Enrollment({
      user: userPratham._id,
      course: course1._id,
      amountPaid: 2700, // ₹3000 - 10% Pro discount
      paymentId: 'ENROLL-PAY-SEED-1',
      qrCodeData: `CY-ENROLL-${course1._id}-${userPratham._id}`,
      status: 'active',
      attendance: [
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Attended yesterday
      ]
    });
    await enrollment.save();

    // Log payment for enrollment
    const enrollmentPayment = new Payment({
      user: userPratham._id,
      amount: 2700,
      type: 'Coaching Course',
      referenceId: enrollment._id,
      razorpayPaymentId: 'ENROLL-PAY-SEED-1',
      status: 'success'
    });
    await enrollmentPayment.save();
    console.log('✅ Seeded course enrollment and transaction.');

    console.log('🎉 Seeding successfully completed! Database looks extremely rich and alive.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed dramatically:', error.message);
    process.exit(1);
  }
};

seed();
