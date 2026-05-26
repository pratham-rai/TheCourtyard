// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
require('dotenv').config();

// Models
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
const WalletTransaction = require('./models/WalletTransaction');
const SystemSettings = require('./models/SystemSettings');
const InventoryItem = require('./models/InventoryItem');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'the_courtyard_jwt_secret_key_2026_premium';

// ==========================================
// MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error checking admin privileges' });
  }
};

const isReceptionOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'reception')) {
      return res.status(403).json({ error: 'Reception or Admin privileges required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error checking operational privileges' });
  }
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    let user;

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUser) {
      if (existingUser.hasCreatedPassword || existingUser.isGoogleUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      // This is a guest placeholder account! Let's claim it.
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.hasCreatedPassword = true;
      existingUser.isVerified = false;
      existingUser.verificationCode = otp;
      existingUser.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
      await existingUser.save();
      user = existingUser;
    } else {
      user = new User({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user',
        isVerified: false,
        verificationCode: otp,
        verificationCodeExpires: Date.now() + 15 * 60 * 1000,
        isGoogleUser: false,
        hasCreatedPassword: true
      });
      await user.save();
    }

    // Print the verification code simulation to the console
    console.log('\n=========================================');
    console.log('📧 REGISTRATION OTP SIMULATION');
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${otp}`);
    console.log('=========================================\n');

    res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: 'Verification code simulated and sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if account email is verified
    if (user.isVerified === false) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = otp;
      user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      console.log('\n=========================================');
      console.log('📧 REGISTRATION OTP SIMULATION (LOGIN RE-TRIGGER)');
      console.log(`To: ${email}`);
      console.log(`Verification Code: ${otp}`);
      console.log('=========================================\n');

      return res.status(400).json({
        error: 'Your email is not verified yet. Please verify your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        isGoogleUser: user.isGoogleUser,
        hasCreatedPassword: user.hasCreatedPassword
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google access token is required' });

    // Set credentials and request user info using google-auth-library client
    const client = new OAuth2Client();
    client.setCredentials({ access_token: token });
    
    const userInfoResponse = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const payload = userInfoResponse.data;
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Failed to retrieve email from Google account' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && user.hasCreatedPassword === false && user.isGoogleUser === false) {
      // Claim guest placeholder for Google user
      user.name = name;
      user.isGoogleUser = true;
      user.isVerified = true; // Google logins are verified
      await user.save();
    } else if (!user) {
      // Create new user with secure dummy password
      const randomPassword = Math.random().toString(36).slice(-16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = new User({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user',
        membership: 'None',
        isVerified: true,
        isGoogleUser: true,
        hasCreatedPassword: false
      });
      await user.save();

      // Welcome Notification
      const welcomeNotification = new Notification({
        title: 'Welcome to The Courtyard!',
        message: `Hey ${name}, welcome to the premium home of pickleball. Check out our courts and memberships!`,
        type: 'info',
        user: user._id
      });
      await welcomeNotification.save();
    }

    const appToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        isGoogleUser: user.isGoogleUser,
        hasCreatedPassword: user.hasCreatedPassword
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    if (user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Create custom welcome notification now that they are verified
    const welcomeNotification = new Notification({
      title: 'Welcome to The Courtyard!',
      message: `Hey ${user.name}, welcome to the premium home of pickleball. Check out our courts and memberships!`,
      type: 'info',
      user: user._id
    });
    await welcomeNotification.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        isGoogleUser: user.isGoogleUser,
        hasCreatedPassword: user.hasCreatedPassword
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log('\n=========================================');
    console.log('📧 REGISTRATION OTP SIMULATION (RESEND)');
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${otp}`);
    console.log('=========================================\n');

    res.json({ message: 'Verification code resent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

app.post('/api/auth/create-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.hasCreatedPassword = true;
    await user.save();

    // Send a success notification
    const pwdNotification = new Notification({
      title: 'Password Created Successfully',
      message: 'You can now log in using your email and password, in addition to Google Login.',
      type: 'info',
      user: user._id
    });
    await pwdNotification.save();

    res.json({ message: 'Password created successfully. You can now log in with email/password.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create password' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal that the user does not exist.
      return res.json({ message: 'A secure recovery link has been dispatched to your email.' });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Log the link to the console for local QA testing!
    const resetUrl = `http://localhost:3000/auth/reset?token=${resetToken}`;
    console.log('\n=========================================');
    console.log('📧 PASSWORD RESET SIMULATION');
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log('=========================================\n');

    res.json({ 
      message: 'A secure recovery link has been dispatched to your email.',
      devResetUrl: resetUrl
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password recovery request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password recovery token is invalid or has expired' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Dispatch secure notification
    const resetNotif = new Notification({
      title: 'Password Updated Successfully',
      message: 'Your account password has been updated securely. If you did not do this, contact support immediately.',
      type: 'info',
      user: user._id
    });
    await resetNotif.save();

    res.json({ message: 'Your password has been successfully updated!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to update account password' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ==========================================
// COURT ROUTES
// ==========================================
app.get('/api/courts', async (req, res) => {
  try {
    const courts = await Court.find({ isActive: true });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

app.post('/api/admin/courts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { basePrice, peakPrice } = req.body;
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: 'Court not found' });

    if (basePrice) court.basePrice = basePrice;
    if (peakPrice) court.peakPrice = peakPrice;

    await court.save();
    res.json({ message: 'Court pricing updated successfully', court });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update court pricing' });
  }
});

app.get('/api/courts/availability', async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) {
      return res.status(400).json({ error: 'Court ID and Date (YYYY-MM-DD) are required' });
    }

    const bookings = await Booking.find({ court: courtId, date, status: 'confirmed' });
    
    // Extract booked slots
    let bookedSlots = [];
    bookings.forEach(b => {
      bookedSlots = bookedSlots.concat(b.slots);
    });

    res.json({ date, courtId, bookedSlots });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve availability' });
  }
});

// ==========================================
// COURT BOOKING ROUTES
// ==========================================
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { courtId, date, slots, paymentId } = req.body;
    if (!courtId || !date || !slots || !slots.length) {
      return res.status(400).json({ error: 'Court ID, Date, and Time slots are required' });
    }

    const court = await Court.findById(courtId);
    if (!court || !court.isActive) {
      return res.status(404).json({ error: 'Court is not available' });
    }

    // Check if slots are already booked
    const existingBookings = await Booking.find({ court: courtId, date, status: 'confirmed' });
    let alreadyBooked = [];
    existingBookings.forEach(eb => {
      alreadyBooked = alreadyBooked.concat(eb.slots);
    });

    const isOverlap = slots.some(slot => alreadyBooked.includes(slot));
    if (isOverlap) {
      return res.status(400).json({ error: 'One or more of the selected slots are already booked' });
    }

    const user = await User.findById(req.user.id);
    
    // Pricing engine: Peak hours are 6:00 AM - 9:00 AM and 5:00 PM - 10:00 PM (slots: 6, 7, 8, 17, 18, 19, 20, 21)
    let total = 0;
    slots.forEach(slot => {
      const isPeak = (slot >= 6 && slot < 9) || (slot >= 17 && slot < 22);
      total += isPeak ? court.peakPrice : court.basePrice;
    });

    // Discount Engine based on membership
    let discount = 0;
    if (user.membership === 'Basic') discount = 0.10; // 10%
    else if (user.membership === 'Pro') discount = 0.25; // 25%
    else if (user.membership === 'Elite') discount = 1.00; // 100% Free!

    const discountAmount = total * discount;
    const finalAmount = total - discountAmount;

    let walletDeduction = 0;
    if (req.body.useWallet) {
      walletDeduction = Math.min(user.walletBalance || 0, finalAmount);
      user.walletBalance = (user.walletBalance || 0) - walletDeduction;
      await user.save();

      if (walletDeduction > 0) {
        const walletTx = new WalletTransaction({
          user: user._id,
          amount: -walletDeduction,
          type: 'court_booking',
          description: `Split Payment for Court Booking (Wallet portion)`,
          paymentMethod: 'wallet',
          processedBy: user._id
        });
        await walletTx.save();
      }
    }

    const booking = new Booking({
      user: user._id,
      court: courtId,
      date,
      slots,
      totalAmount: finalAmount,
      status: 'confirmed',
      paymentId: walletDeduction > 0 
        ? (finalAmount > walletDeduction ? `SPLIT-W${walletDeduction}-${paymentId || `MOCK-${Date.now()}`}` : `WALLET-FULL-${Date.now()}`)
        : (paymentId || `MOCK-PAY-${Date.now()}`)
    });
    
    // Set QR code data to the actual database ID of the booking
    booking.qrCodeData = booking._id.toString();
    await booking.save();

    // Create payment entry
    const payment = new Payment({
      user: user._id,
      amount: finalAmount,
      type: 'Court Booking',
      referenceId: booking._id,
      razorpayPaymentId: paymentId || `MOCK-PAY-${Date.now()}`,
      status: 'success'
    });
    await payment.save();

    // User notification
    const bookingNotif = new Notification({
      title: 'Court Booking Confirmed',
      message: `Your booking for ${court.name} on ${date} at ${slots.map(s => `${s}:00`).join(', ')} is confirmed. QR check-in ready!`,
      type: 'booking',
      user: user._id
    });
    await bookingNotif.save();

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (error) {
    console.log('BOOKING ERROR:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('court')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.status = 'cancelled';
    await booking.save();

    // Send refund/cancellation alert
    const cancelNotif = new Notification({
      title: 'Booking Cancelled',
      message: `Your court booking on ${booking.date} has been cancelled successfully. Refund initiated.`,
      type: 'booking',
      user: req.user.id
    });
    await cancelNotif.save();

    res.json({ message: 'Booking successfully cancelled', booking });
  } catch (error) {
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

// ==========================================
// COACHING SYSTEM ROUTES
// ==========================================
app.get('/api/coaching/coaches', async (req, res) => {
  try {
    const coaches = await Coach.find();
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

app.post('/api/coaching/book', authenticateToken, async (req, res) => {
  try {
    const { coachId, programType, date, slot } = req.body;
    if (!coachId || !programType || !date || !slot) {
      return res.status(400).json({ error: 'Coach ID, Program category, Date, and Time slot are required' });
    }

    const coach = await Coach.findById(coachId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    // Concurrency Check: Check if coach is already booked for this slot
    const existingSession = await CoachingSession.findOne({ coach: coachId, date, slot, status: 'scheduled' });
    if (existingSession) {
      return res.status(400).json({ error: 'The coach is already booked for this time slot.' });
    }

    const user = await User.findById(req.user.id);
    let amount = coach.pricePerSession;

    // Apply coaching discount if user is Pro (10%) or Elite (20%)
    if (user.membership === 'Pro') amount = amount * 0.90;
    else if (user.membership === 'Elite') amount = amount * 0.80;

    const coachingSession = new CoachingSession({
      user: user._id,
      coach: coachId,
      programType,
      date,
      slot,
      amountPaid: amount,
      status: 'scheduled'
    });
    await coachingSession.save();

    const payment = new Payment({
      user: user._id,
      amount,
      type: 'Coaching Session',
      referenceId: coachingSession._id,
      status: 'success',
      razorpayPaymentId: `COACH-PAY-${Date.now()}`
    });
    await payment.save();

    const coachingNotif = new Notification({
      title: 'Coaching Session Confirmed',
      message: `Your ${programType} with Coach ${coach.name} is scheduled on ${date} at ${slot}:00. Get ready!`,
      type: 'booking',
      user: user._id
    });
    await coachingNotif.save();

    res.status(201).json({ message: 'Coaching slot successfully booked', coachingSession });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book coaching session' });
  }
});

app.get('/api/coaching/my', authenticateToken, async (req, res) => {
  try {
    const sessions = await CoachingSession.find({ user: req.user.id })
      .populate('coach')
      .sort({ date: 1, slot: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaching sessions' });
  }
});

// GET ALL ACTIVE/UPCOMING COURSES
app.get('/api/coaching/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('coach');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaching courses' });
  }
});

// ENROLL IN A COURSE
app.post('/api/coaching/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const course = await Course.findById(courseId).populate('coach');
    if (!course) return res.status(404).json({ error: 'Coaching course not found' });

    // Check capacity
    if (course.slotsEnrolled >= course.slotsTotal) {
      return res.status(400).json({ error: 'This course is fully enrolled!' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({ user: req.user.id, course: courseId, status: 'active' });
    if (existingEnrollment) {
      return res.status(400).json({ error: 'You are already enrolled in this coaching course!' });
    }

    const user = await User.findById(req.user.id);
    let amount = course.price;

    // Apply coaching discount if user is Pro (10%) or Elite (20%)
    if (user.membership === 'Pro') amount = amount * 0.90;
    else if (user.membership === 'Elite') amount = amount * 0.80;

    let walletDeduction = 0;
    if (req.body.useWallet) {
      walletDeduction = Math.min(user.walletBalance || 0, amount);
      user.walletBalance = (user.walletBalance || 0) - walletDeduction;
      await user.save();

      if (walletDeduction > 0) {
        const walletTx = new WalletTransaction({
          user: user._id,
          amount: -walletDeduction,
          type: 'coaching_enrollment',
          description: `Split Payment for Academy Enrollment (Wallet portion)`,
          paymentMethod: 'wallet',
          processedBy: user._id
        });
        await walletTx.save();
      }
    }

    const finalPaymentId = walletDeduction > 0 
      ? (amount > walletDeduction ? `SPLIT-W${walletDeduction}-${req.body.paymentId || `MOCK-${Date.now()}`}` : `WALLET-FULL-${Date.now()}`)
      : (req.body.paymentId || `ENROLL-PAY-${Date.now()}`);

    const qrCodeData = `CY-ENROLL-${courseId}-${user._id}`;

    const enrollment = new Enrollment({
      user: user._id,
      course: courseId,
      amountPaid: amount,
      paymentId: finalPaymentId,
      qrCodeData,
      status: 'active',
      attendance: []
    });
    await enrollment.save();

    // Increment course capacity
    course.slotsEnrolled += 1;
    await course.save();

    // Log payment transaction
    const payment = new Payment({
      user: user._id,
      amount,
      type: 'Coaching Course',
      referenceId: enrollment._id,
      status: 'success',
      razorpayPaymentId: finalPaymentId
    });
    await payment.save();

    // Send notification
    const enrollNotif = new Notification({
      title: 'Course Enrollment Confirmed!',
      message: `You have successfully enrolled in "${course.title}". Schedule: ${course.schedule}. Coach: ${course.coach?.name || 'Assigned soon'}. Get ready!`,
      type: 'booking',
      user: user._id
    });
    await enrollNotif.save();

    res.status(201).json({ message: 'Course enrollment successful!', enrollment, course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// GET LOGGED IN USER'S ENROLLMENTS
app.get('/api/coaching/my-enrollments', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id, status: 'active' })
      .populate({
        path: 'course',
        populate: { path: 'coach' }
      })
      .sort({ enrolledAt: -1 });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// ==========================================
// MEMBERSHIP ROUTES
// ==========================================
app.post('/api/memberships/buy', authenticateToken, async (req, res) => {
  try {
    const { tier } = req.body; // Basic, Pro, Elite
    if (!['Basic', 'Pro', 'Elite'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid membership tier' });
    }

    const pricing = { 'Basic': 999, 'Pro': 1999, 'Elite': 4999 };
    const price = pricing[tier];

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // 30 days validity

    const user = await User.findById(req.user.id);

    let walletDeduction = 0;
    if (req.body.useWallet) {
      walletDeduction = Math.min(user.walletBalance || 0, price);
      user.walletBalance = (user.walletBalance || 0) - walletDeduction;
      if (walletDeduction > 0) {
        const walletTx = new WalletTransaction({
          user: user._id,
          amount: -walletDeduction,
          type: 'spot_billing',
          description: `Split Payment for ${tier} Membership (Wallet portion)`,
          paymentMethod: 'wallet',
          processedBy: user._id
        });
        await walletTx.save();
      }
    }

    user.membership = tier;
    user.membershipExpiry = expiry;
    await user.save();

    const finalPaymentId = walletDeduction > 0 
      ? (price > walletDeduction ? `SPLIT-W${walletDeduction}-${req.body.paymentId || `MOCK-${Date.now()}`}` : `WALLET-FULL-${Date.now()}`)
      : (req.body.paymentId || `MEMB-PAY-${Date.now()}`);

    // Create payment entry
    const payment = new Payment({
      user: user._id,
      amount: price,
      type: 'Membership',
      referenceId: user._id, // self reference
      status: 'success',
      razorpayPaymentId: finalPaymentId
    });
    await payment.save();

    const membershipNotif = new Notification({
      title: 'Membership Activated!',
      message: `Congratulations! Your premium ${tier} membership has been activated. Enjoy elite court perks!`,
      type: 'promo',
      user: user._id
    });
    await membershipNotif.save();

    res.json({ message: `Successfully upgraded to ${tier}`, user: { id: user._id, name: user.name, email: user.email, role: user.role, membership: user.membership } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// ==========================================
// TOURNAMENTS ROUTES
// ==========================================
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ date: 1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

app.post('/api/tournaments/register/:id', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    if (tournament.registrations.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are already registered for this tournament' });
    }

    tournament.registrations.push(req.user.id);
    await tournament.save();

    // Notify user
    const tourNotif = new Notification({
      title: 'Tournament Entry Confirmed',
      message: `You've registered for '${tournament.title}' on ${tournament.date}. Good luck on the courts!`,
      type: 'booking',
      user: req.user.id
    });
    await tourNotif.save();

    res.json({ message: 'Successfully registered for tournament', tournament });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register for tournament' });
  }
});

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // 1. Fetch upcoming confirmed bookings for this user today
    const upcomingBookings = await Booking.find({
      user: userId,
      date: todayStr,
      status: 'confirmed'
    }).populate('court');

    // 2. Check if any booking is starting within 1 to 1.5 hours
    for (const booking of upcomingBookings) {
      if (booking.slots && booking.slots.length > 0 && booking.court) {
        const firstSlot = booking.slots[0];
        const hoursDiff = firstSlot - currentHour;
        
        if (hoursDiff > 0 && hoursDiff <= 1.5) {
          const uniqueTitle = `Court Reminder: ${booking.court.name}`;
          const existingReminder = await Notification.findOne({
            user: userId,
            title: uniqueTitle,
            createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } // sent in last 12 hours
          });

          if (!existingReminder) {
            const reminderNotif = new Notification({
              title: uniqueTitle,
              message: `Reminder: Your reservation on "${booking.court.name}" starts in 1 hour (at ${firstSlot}:00). Please arrive 10 minutes early to prepare!`,
              type: 'booking',
              user: userId
            });
            await reminderNotif.save();
          }
        }
      }
    }

    // 3. Retrieve global + user specific notifications
    const notifications = await Notification.find({
      $or: [{ user: userId }, { user: null }]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// ==========================================
// ADMIN DASHBOARD & ANALYTICS
// ==========================================
app.get('/api/admin/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalBookingsCount = await Booking.countDocuments({ status: 'confirmed' });
    const totalSessionsCount = await CoachingSession.countDocuments({ status: 'scheduled' });
    const totalMembersCount = await User.countDocuments({ membership: { $ne: 'None' } });
    
    // Revenue calculator
    const courtRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const coachRevenue = await CoachingSession.aggregate([
      { $match: { status: 'scheduled' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);

    const memberRevenue = await Payment.aggregate([
      { $match: { type: 'Membership', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const rCourt = courtRevenue[0]?.total || 0;
    const rCoach = coachRevenue[0]?.total || 0;
    const rMemb = memberRevenue[0]?.total || 0;
    const totalRevenue = rCourt + rCoach + rMemb;

    // Court utilization calculator
    // Count of booked slots in total vs maximum slots available in the system
    const activeCourtsCount = await Court.countDocuments({ isActive: true });
    // Say we track availability across a 7-day window, 16 active hours per day (6 AM to 10 PM)
    const totalCapacitySlots = activeCourtsCount * 7 * 16;
    const activeBookedSlotsCount = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $project: { numberOfSlots: { $size: '$slots' } } },
      { $group: { _id: null, totalSlots: { $sum: '$numberOfSlots' } } }
    ]);
    const bookedCount = activeBookedSlotsCount[0]?.totalSlots || 0;
    const courtUtilization = totalCapacitySlots > 0 ? Math.min(Math.round((bookedCount / totalCapacitySlots) * 100), 100) : 0;

    // Peak booking hours heatmap (which hour is booked the most)
    const bookings = await Booking.find({ status: 'confirmed' });
    const hourFrequency = {};
    bookings.forEach(b => {
      b.slots.forEach(slot => {
        hourFrequency[slot] = (hourFrequency[slot] || 0) + 1;
      });
    });

    // Formulate peak hours data
    const peakHoursData = Object.entries(hourFrequency).map(([hour, count]) => ({
      hour: `${hour}:00`,
      bookings: count
    })).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

    // Membership tier counts
    const membershipGrowth = {
      Basic: await User.countDocuments({ membership: 'Basic' }),
      Pro: await User.countDocuments({ membership: 'Pro' }),
      Elite: await User.countDocuments({ membership: 'Elite' })
    };

    // Top Coach listings
    const sessions = await CoachingSession.find({ status: 'scheduled' }).populate('coach');
    const coachTally = {};
    sessions.forEach(s => {
      if (s.coach) {
        coachTally[s.coach.name] = (coachTally[s.coach.name] || 0) + 1;
      }
    });
    const mostBookedCoach = Object.entries(coachTally)
      .map(([name, count]) => ({ name, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions)[0]?.name || 'N/A';

    res.json({
      summary: {
        totalBookings: totalBookingsCount,
        totalCoaching: totalSessionsCount,
        totalMembers: totalMembersCount,
        totalRevenue,
        courtRevenue: rCourt,
        coachingRevenue: rCoach,
        membershipRevenue: rMemb
      },
      courtUtilization,
      peakBookingHours: peakHoursData,
      membershipGrowth,
      mostBookedCoach
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate analytics' });
  }
});

app.get('/api/admin/users', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/bookings', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    let bookings = await Booking.find()
      .populate('user', 'name email membership')
      .populate('court', 'name')
      .sort({ createdAt: -1 });
    
    if (req.user.role === 'reception') {
      bookings = bookings.map(b => {
        const obj = b.toObject();
        delete obj.totalAmount;
        return obj;
      });
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/admin/bookings/cancel/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.status = 'cancelled';
    await booking.save();

    // Notify user
    const cancelNotif = new Notification({
      title: 'Booking Cancelled by Admin',
      message: `Your court booking on ${booking.date} has been cancelled by the club administrator.`,
      type: 'booking',
      user: booking.user
    });
    await cancelNotif.save();

    res.json({ message: 'Booking successfully cancelled by admin', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.get('/api/admin/coaching', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    let sessions = await CoachingSession.find()
      .populate('user', 'name email')
      .populate('coach', 'name')
      .sort({ createdAt: -1 });

    if (req.user.role === 'reception') {
      sessions = sessions.map(s => {
        const obj = s.toObject();
        delete obj.amountPaid;
        return obj;
      });
    }
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaching logs' });
  }
});

app.post('/api/admin/block-slot', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { courtId, date, slots } = req.body;
    if (!courtId || !date || !slots || !slots.length) {
      return res.status(400).json({ error: 'Court, Date and Slots required' });
    }

    // Check if slots are already booked
    const existingBookings = await Booking.find({ court: courtId, date, status: 'confirmed' });
    let alreadyBooked = [];
    existingBookings.forEach(eb => {
      alreadyBooked = alreadyBooked.concat(eb.slots);
    });

    const isOverlap = slots.some(slot => alreadyBooked.includes(slot));
    if (isOverlap) {
      return res.status(400).json({ error: 'One or more of the selected slots are already booked or locked.' });
    }

    const blockBooking = new Booking({
      user: req.user.id,
      court: courtId,
      date,
      slots,
      totalAmount: 0,
      status: 'confirmed',
      paymentId: 'SYSTEM-BLOCKED'
    });
    
    // Set QR code data to actual booking ID
    blockBooking.qrCodeData = blockBooking._id.toString();
    await blockBooking.save();

    res.json({ message: 'Court slots successfully blocked for maintenance', blockBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block court slots' });
  }
});

app.post('/api/admin/promo', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Broadcast notification (user = null)
    const promoNotification = new Notification({
      title,
      message,
      type: type || 'promo',
      user: null
    });
    await promoNotification.save();

    res.status(201).json({ message: 'Broadcast notification successfully dispatched', promoNotification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispatch notification broadcast' });
  }
});

// ==========================================
// COURT CRUD MANAGEMENT ROUTINGS
// ==========================================

// GET ALL COURTS FOR ADMIN (including inactive ones)
app.get('/api/admin/courts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courts list' });
  }
});

// CREATE COURT
app.post('/api/admin/courts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, surface, basePrice, peakPrice, image, description } = req.body;
    if (!name || !surface || !basePrice || !peakPrice || !image) {
      return res.status(400).json({ error: 'Name, surface, base price, peak price, and image are required' });
    }
    const court = new Court({ name, surface, basePrice, peakPrice, image, description, isActive: true });
    await court.save();
    res.status(201).json({ message: 'Court created successfully', court });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create court' });
  }
});

// UPDATE COURT Fully
app.put('/api/admin/courts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, surface, basePrice, peakPrice, image, description, isActive } = req.body;
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: 'Court not found' });

    if (name !== undefined) court.name = name;
    if (surface !== undefined) court.surface = surface;
    if (basePrice !== undefined) court.basePrice = basePrice;
    if (peakPrice !== undefined) court.peakPrice = peakPrice;
    if (image !== undefined) court.image = image;
    if (description !== undefined) court.description = description;
    if (isActive !== undefined) court.isActive = isActive;

    await court.save();
    res.json({ message: 'Court updated successfully', court });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update court' });
  }
});

// DELETE COURT
app.delete('/api/admin/courts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const court = await Court.findByIdAndDelete(req.params.id);
    if (!court) return res.status(404).json({ error: 'Court not found' });
    res.json({ message: 'Court deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete court' });
  }
});

// ==========================================
// COACH CRUD MANAGEMENT ROUTINGS
// ==========================================

// CREATE COACH
app.post('/api/admin/coaches', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, image, bio, specialization, experience, pricePerSession, availability, commissionRate } = req.body;
    if (!name || !image || !bio || !experience || !pricePerSession) {
      return res.status(400).json({ error: 'Name, image, bio, experience, and price per session are required' });
    }
    const defaultAvailability = availability || { days: ['Monday', 'Wednesday', 'Friday'], hours: [9, 10, 11, 14, 15, 16] };
    const coach = new Coach({
      name,
      image,
      bio,
      specialization: specialization || [],
      experience,
      pricePerSession,
      availability: defaultAvailability,
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : 70
    });
    await coach.save();
    res.status(201).json({ message: 'Coach profile created successfully', coach });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coach profile' });
  }
});

// UPDATE COACH
app.put('/api/admin/coaches/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, image, bio, specialization, experience, pricePerSession, availability, rating, commissionRate } = req.body;
    const coach = await Coach.findById(req.params.id);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    if (name !== undefined) coach.name = name;
    if (image !== undefined) coach.image = image;
    if (bio !== undefined) coach.bio = bio;
    if (specialization !== undefined) coach.specialization = specialization;
    if (experience !== undefined) coach.experience = experience;
    if (pricePerSession !== undefined) coach.pricePerSession = pricePerSession;
    if (availability !== undefined) coach.availability = availability;
    if (rating !== undefined) coach.rating = rating;
    if (commissionRate !== undefined) coach.commissionRate = Number(commissionRate);

    await coach.save();
    res.json({ message: 'Coach profile updated successfully', coach });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update coach profile' });
  }
});

// DELETE COACH
app.delete('/api/admin/coaches/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });
    res.json({ message: 'Coach profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coach profile' });
  }
});

// ==========================================
// COURSE CRUD MANAGEMENT ROUTINGS
// ==========================================

// GET ALL COURSES (ADMIN)
app.get('/api/admin/courses', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    let courses = await Course.find().populate('coach');
    if (req.user.role === 'reception') {
      courses = courses.map(c => {
        const obj = c.toObject();
        delete obj.price;
        return obj;
      });
    }
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses list' });
  }
});

// CREATE COURSE
app.post('/api/admin/courses', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, duration, startDate, endDate, price, slotsTotal, coach, schedule, image, status } = req.body;
    if (!title || !description || !duration || !startDate || !endDate || !price || !slotsTotal || !coach || !schedule || !image) {
      return res.status(400).json({ error: 'All course fields (title, description, duration, startDate, endDate, price, slotsTotal, coach, schedule, image) are required' });
    }

    const course = new Course({
      title,
      description,
      duration,
      startDate,
      endDate,
      price,
      slotsTotal,
      coach,
      schedule,
      image,
      status: status || 'upcoming'
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// UPDATE COURSE
app.put('/api/admin/courses/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, duration, startDate, endDate, price, slotsTotal, coach, schedule, image, status } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const oldSchedule = course.schedule;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (duration !== undefined) course.duration = duration;
    if (startDate !== undefined) course.startDate = startDate;
    if (endDate !== undefined) course.endDate = endDate;
    if (price !== undefined) course.price = price;
    if (slotsTotal !== undefined) course.slotsTotal = slotsTotal;
    if (coach !== undefined) course.coach = coach;
    if (schedule !== undefined) course.schedule = schedule;
    if (image !== undefined) course.image = image;
    if (status !== undefined) course.status = status;

    await course.save();

    // If schedule changed, dispatch notifications to all actively enrolled students
    if (schedule !== undefined && oldSchedule !== schedule) {
      try {
        const enrollments = await Enrollment.find({ course: course._id, status: 'active' });
        for (const enrollment of enrollments) {
          const scheduleNotif = new Notification({
            title: 'Course Schedule Updated',
            message: `The schedule for your course "${course.title}" has been updated to: "${schedule}". Please adjust your calendar.`,
            type: 'info',
            user: enrollment.user
          });
          await scheduleNotif.save();
        }
      } catch (err) {
        console.error('Failed to dispatch course reschedule notifications:', err);
      }
    }

    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE COURSE
app.delete('/api/admin/courses/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ==========================================
// TOURNAMENT CRUD MANAGEMENT ROUTINGS
// ==========================================

// CREATE TOURNAMENT
app.post('/api/admin/tournaments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, date, prizePool, entryFee, image, status } = req.body;
    if (!title || !description || !date || !prizePool || !entryFee || !image) {
      return res.status(400).json({ error: 'All tournament fields (title, description, date, prizePool, entryFee, image) are required' });
    }
    const tournament = new Tournament({
      title,
      description,
      date,
      prizePool,
      entryFee,
      image,
      status: status || 'upcoming'
    });
    await tournament.save();
    
    // Notify all users about new tournament (broadcast)
    const tourNotif = new Notification({
      title: '🏆 New Tournament Launched!',
      message: `Registrations are open for '${title}' on ${date}. Compete for ${prizePool}!`,
      type: 'promo',
      user: null
    });
    await tourNotif.save();

    res.status(201).json({ message: 'Tournament created successfully', tournament });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// UPDATE TOURNAMENT
app.put('/api/admin/tournaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, date, prizePool, entryFee, image, status, winners } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    if (title !== undefined) tournament.title = title;
    if (description !== undefined) tournament.description = description;
    if (date !== undefined) tournament.date = date;
    if (prizePool !== undefined) tournament.prizePool = prizePool;
    if (entryFee !== undefined) tournament.entryFee = entryFee;
    if (image !== undefined) tournament.image = image;
    if (status !== undefined) tournament.status = status;
    if (winners !== undefined) tournament.winners = winners;

    await tournament.save();
    res.json({ message: 'Tournament updated successfully', tournament });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// DELETE TOURNAMENT
app.delete('/api/admin/tournaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// ==========================================
// USER CRUD MANAGEMENT ROUTINGS
// ==========================================

// UPDATE USER DETAILS (Membership tier, role)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role, membership, name, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role !== undefined) user.role = role;
    
    if (membership !== undefined) {
      user.membership = membership;
      if (membership !== 'None') {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1); // 30 days validity
        user.membershipExpiry = expiry;
      } else {
        user.membershipExpiry = undefined;
      }
    }
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    await user.save();

    // Notify user of profile/membership update
    const userNotif = new Notification({
      title: 'Account Status Updated',
      message: `Your account details were updated by the club administrator. Current tier: ${user.membership}`,
      type: 'info',
      user: user._id
    });
    await userNotif.save();

    res.json({ message: 'User updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, membership: user.membership } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE USER
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Check if trying to delete self
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'You cannot delete your own administrator account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Clean up user's bookings, coaching sessions, etc. optionally, but at least delete the user
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// ==========================================
// COACHING ENROLLMENT CRUD ROUTINGS
// ==========================================

// GET ALL ENROLLMENTS (Admin)
app.get('/api/admin/enrollments', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    let enrollments = await Enrollment.find()
      .populate({
        path: 'user',
        select: 'name email membership'
      })
      .populate({
        path: 'course',
        populate: {
          path: 'coach',
          select: 'name specialization'
        }
      });
    
    if (req.user.role === 'reception') {
      enrollments = enrollments.map(e => {
        const obj = e.toObject();
        delete obj.amountPaid;
        if (obj.course) {
          delete obj.course.price;
        }
        return obj;
      });
    }
    res.json(enrollments);
  } catch (error) {
    console.error('Fetch Enrollments Error:', error);
    res.status(500).json({ error: 'Failed to retrieve enrollments' });
  }
});

// CREATE ENROLLMENT (Admin Manual)
app.post('/api/admin/enrollments', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { userId, courseId, amountPaid, paymentId, status } = req.body;
    const isReception = req.user.role === 'reception';
    const amountVal = isReception ? 0 : amountPaid;
    if (!userId || !courseId || (!isReception && amountPaid === undefined)) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Player not found' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Check capacity
    if (course.slotsEnrolled >= course.slotsTotal) {
      return res.status(400).json({ error: 'This course is full. Capacity reached.' });
    }

    // Check unique qrCodeData to avoid duplicate enrollment
    const qrCodeData = `CY-ENROLL-${courseId}-${userId}`;
    const existing = await Enrollment.findOne({ qrCodeData });
    if (existing) {
      return res.status(400).json({ error: 'Player is already enrolled in this course' });
    }

    const txId = paymentId || `MOCK-TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      amountPaid: amountVal,
      paymentId: txId,
      qrCodeData,
      status: status || 'active',
      attendance: []
    });

    await enrollment.save();

    // Increment slots count
    course.slotsEnrolled += 1;
    await course.save();

    // Create system notification for player
    const userNotif = new Notification({
      title: 'Enrolled in Course',
      message: `You have been registered for ${course.title} starting on ${course.startDate}. Check your Dashboard for your Pass.`,
      type: 'success',
      user: userId
    });
    await userNotif.save();

    // Populate enrollment for the response
    const populated = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'user',
        select: 'name email membership'
      })
      .populate({
        path: 'course',
        populate: {
          path: 'coach',
          select: 'name specialization'
        }
      });

    res.status(201).json({ message: 'Enrollment created successfully', enrollment: populated });
  } catch (error) {
    console.error('Create Enrollment Error:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

// UPDATE ENROLLMENT (Admin)
app.put('/api/admin/enrollments/:id', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { courseId, amountPaid, status, attendance } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const originalCourseId = enrollment.course.toString();
    const originalStatus = enrollment.status;

    // Handle course change
    if (courseId && courseId !== originalCourseId) {
      const newCourse = await Course.findById(courseId);
      if (!newCourse) return res.status(404).json({ error: 'Target course not found' });

      // If active, manage slots
      if (enrollment.status === 'active') {
        if (newCourse.slotsEnrolled >= newCourse.slotsTotal) {
          return res.status(400).json({ error: 'Target course is full' });
        }
        newCourse.slotsEnrolled += 1;
        await newCourse.save();

        const oldCourse = await Course.findById(originalCourseId);
        if (oldCourse) {
          oldCourse.slotsEnrolled = Math.max(0, oldCourse.slotsEnrolled - 1);
          await oldCourse.save();
        }
      }

      enrollment.course = courseId;
      enrollment.qrCodeData = `CY-ENROLL-${courseId}-${enrollment.user}`;
    }

    // Handle status change
    if (status && status !== originalStatus) {
      const currentCourseId = enrollment.course.toString();
      const courseObj = await Course.findById(currentCourseId);

      if (courseObj) {
        if (originalStatus === 'active' && status !== 'active') {
          // Changed from active to cancelled/completed - decrement slots
          courseObj.slotsEnrolled = Math.max(0, courseObj.slotsEnrolled - 1);
          await courseObj.save();
        } else if (originalStatus !== 'active' && status === 'active') {
          // Changed from inactive to active - increment slots (check capacity first)
          if (courseObj.slotsEnrolled >= courseObj.slotsTotal) {
            return res.status(400).json({ error: 'Cannot activate enrollment, course is full' });
          }
          courseObj.slotsEnrolled += 1;
          await courseObj.save();
        }
      }
      enrollment.status = status;
    }

    if (amountPaid !== undefined && req.user.role !== 'reception') enrollment.amountPaid = amountPaid;
    if (attendance !== undefined) enrollment.attendance = attendance;

    await enrollment.save();

    const populated = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'user',
        select: 'name email membership'
      })
      .populate({
        path: 'course',
        populate: {
          path: 'coach',
          select: 'name specialization'
        }
      });

    res.json({ message: 'Enrollment updated successfully', enrollment: populated });
  } catch (error) {
    console.error('Update Enrollment Error:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// DELETE ENROLLMENT (Admin)
app.delete('/api/admin/enrollments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    // Decrement slots count if active
    if (enrollment.status === 'active') {
      const course = await Course.findById(enrollment.course);
      if (course) {
        course.slotsEnrolled = Math.max(0, course.slotsEnrolled - 1);
        await course.save();
      }
    }

    await Enrollment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Delete Enrollment Error:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

app.post('/api/admin/scan-qr', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    // Check if it's a coaching course enrollment QR code
    if (qrCode.startsWith('CY-ENROLL-')) {
      const enrollment = await Enrollment.findOne({ qrCodeData: qrCode })
        .populate({
          path: 'course',
          populate: { path: 'coach' }
        })
        .populate('user', '-password');

      if (!enrollment) {
        return res.status(404).json({ error: 'No coaching enrollment found matching this QR code', valid: false });
      }

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

          // Dispatch instant check-in confirmation notification
          try {
            const checkinNotif = new Notification({
              title: 'Coaching Check-in Successful',
              message: `Your check-in for the course "${enrollment.course.title}" has been verified today. Enjoy your class!`,
              type: 'booking',
              user: enrollment.user._id
            });
            await checkinNotif.save();
          } catch (err) {
            console.error('Failed to create coaching check-in notification:', err);
          }
        }
      }

      return res.json({
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
    }

    // Otherwise, assume it's a standard court booking QR code
    const booking = await Booking.findOne({
      $or: [
        { qrCodeData: qrCode },
        { _id: mongoose.Types.ObjectId.isValid(qrCode) ? qrCode : null }
      ]
    })
      .populate('court')
      .populate('user', '-password');

    if (!booking) {
      return res.status(404).json({ error: 'No booking found matching this QR code', valid: false });
    }

    // Check if booking is confirmed or cancelled
    const isValid = booking.status === 'confirmed';

    // Check if the booking date is today or in the future
    const today = new Date().toISOString().split('T')[0];
    const isExpired = booking.date < today;

    const canCheckIn = isValid && !isExpired;

    // Automatically check-in the user if the pass is valid
    if (canCheckIn && !booking.checkedIn) {
      booking.checkedIn = true;
      await booking.save();

      // Dispatch instant check-in confirmation notification
      try {
        const checkinNotif = new Notification({
          title: 'Court Check-in Successful',
          message: `Welcome to The Courtyard! Your check-in on "${booking.court.name}" has been verified successfully. Enjoy your game!`,
          type: 'booking',
          user: booking.user._id
        });
        await checkinNotif.save();
      } catch (err) {
        console.error('Failed to create court check-in notification:', err);
      }
    }

    res.json({
      valid: canCheckIn,
      isCoaching: false,
      status: booking.status,
      isExpired,
      checkedIn: booking.checkedIn,
      booking: {
        id: booking._id,
        qrCodeData: booking.qrCodeData,
        date: booking.date,
        slots: booking.slots,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentId: booking.paymentId,
        createdAt: booking.createdAt,
        checkedIn: booking.checkedIn,
        court: booking.court ? {
          name: booking.court.name,
          surface: booking.court.surface
        } : null,
        user: booking.user ? {
          name: booking.user.name,
          email: booking.user.email,
          membership: booking.user.membership
        } : null
      }
    });
  } catch (error) {
    console.error('QR Scan Error:', error);
    res.status(500).json({ error: 'Failed to verify QR code' });
  }
});

// ==========================================
// CUSTOMIZABLE SYSTEM SETTINGS FOR TAXES
// ==========================================
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'tax_rate' });
    if (!settings) {
      settings = new SystemSettings({ key: 'tax_rate', value: 18, description: 'Standard GST tax percentage' });
      await settings.save();
    }
    res.json({ tax_rate: settings.value });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tax_rate } = req.body;
    if (tax_rate === undefined || isNaN(tax_rate)) {
      return res.status(400).json({ error: 'Valid tax rate value is required' });
    }
    let settings = await SystemSettings.findOne({ key: 'tax_rate' });
    if (!settings) {
      settings = new SystemSettings({ key: 'tax_rate', value: Number(tax_rate), description: 'Standard GST tax percentage' });
    } else {
      settings.value = Number(tax_rate);
      settings.updatedAt = Date.now();
    }
    await settings.save();
    res.json({ tax_rate: settings.value, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==========================================
// POS, SPOT BILLING & WALLET TOP-UPS
// ==========================================
app.post('/api/admin/wallet/topup', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid user ID and positive amount are required' });
    }
    if (!['cash', 'card', 'razorpay'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method (cash, card, razorpay) is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    const transaction = new WalletTransaction({
      user: user._id,
      amount: Number(amount),
      type: 'topup',
      description: 'Wallet Top-Up',
      paymentMethod,
      processedBy: req.user.id
    });
    await transaction.save();

    res.json({
      message: `Successfully loaded ₹${amount} into wallet`,
      walletBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    console.error('Wallet Top-Up Error:', error);
    res.status(500).json({ error: 'Wallet top-up failed' });
  }
});

app.post('/api/admin/wallet/charge', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { userId, items, paymentMethod } = req.body;
    if (!userId || !items || !items.length) {
      return res.status(400).json({ error: 'User ID and items array are required' });
    }
    if (!['wallet', 'cash', 'card', 'tab'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method (wallet, cash, card, tab) is required' });
    }

    let user;
    if (userId === 'guest') {
      if (['wallet', 'tab'].includes(paymentMethod)) {
        return res.status(400).json({ error: 'Unregistered guest players can only pay via Cash or Card POS.' });
      }
      
      const guestEmail = req.body.guestEmail;
      if (!guestEmail || !guestEmail.trim()) {
        return res.status(400).json({ error: 'Guest contact email is required' });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail.trim())) {
        return res.status(400).json({ error: 'Valid guest contact email is required' });
      }

      const guestName = req.body.guestName || 'Guest Player';
      
      // Attempt to find existing user by email (could be a registered user or a placeholder)
      user = await User.findOne({ email: guestEmail.toLowerCase().trim() });
      if (!user) {
        // Create a new placeholder user profile
        user = new User({
          name: guestName,
          email: guestEmail.toLowerCase().trim(),
          password: 'guest-dummy-password-123',
          role: 'user',
          membership: 'None',
          isVerified: false, // Unverified until they sign up
          isGoogleUser: false,
          hasCreatedPassword: false
        });
        await user.save();
      }
    } else {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
    }

    // Validate any court bookings and check stock for inventory items
    for (const item of items) {
      if (item.isCourtBooking) {
        if (!item.courtId || !item.date || !item.slots || !item.slots.length) {
          return res.status(400).json({ error: 'Court ID, Date, and Time slots are required for spot booking' });
        }
        
        const court = await Court.findById(item.courtId);
        if (!court || !court.isActive) {
          return res.status(404).json({ error: `Selected court is not active or not found` });
        }
        
        // Overlap occupancy check
        const existingBookings = await Booking.find({ court: item.courtId, date: item.date, status: 'confirmed' });
        let alreadyBooked = [];
        existingBookings.forEach(eb => {
          alreadyBooked = alreadyBooked.concat(eb.slots);
        });
        
        const isOverlap = item.slots.some(slot => alreadyBooked.includes(slot));
        if (isOverlap) {
          return res.status(400).json({ error: `One or more selected slots for court "${court.name}" on ${item.date} are already booked.` });
        }
      } else {
        // This is an amenity/catalog item. Check stock if it is a tracked inventory item.
        if (item.id && !item.id.startsWith('custom_') && !item.id.startsWith('item_custom')) {
          try {
            const invItem = await InventoryItem.findById(item.id);
            if (invItem) {
              if (invItem.stock < item.qty) {
                return res.status(400).json({ error: `Insufficient stock for "${invItem.name}". Available: ${invItem.stock}, Requested: ${item.qty}` });
              }
            }
          } catch (e) {
            // Treat as custom if ID doesn't parse as ObjectId
          }
        }
      }
    }

    let total = 0;
    const itemsDescription = items.map(item => {
      total += Number(item.price) * Number(item.qty);
      return `${item.name} x${item.qty}`;
    }).join(', ');

    let walletDeduction = 0;
    if (req.body.useWallet && userId !== 'guest') {
      walletDeduction = Math.min(user.walletBalance || 0, total);
      user.walletBalance = (user.walletBalance || 0) - walletDeduction;
      
      if (walletDeduction > 0) {
        const walletTx = new WalletTransaction({
          user: user._id,
          amount: -walletDeduction,
          type: 'spot_billing',
          description: `Split Wallet portion: ${itemsDescription}`,
          paymentMethod: 'wallet',
          processedBy: req.user.id
        });
        await walletTx.save();
      }
    }

    const netCharge = total - walletDeduction;
    if (netCharge > 0) {
      if (paymentMethod === 'wallet') {
        if ((user.walletBalance || 0) < netCharge) {
          return res.status(400).json({ error: `Insufficient wallet balance. Total is ₹${netCharge}, but wallet has ₹${user.walletBalance || 0}.` });
        }
        user.walletBalance = (user.walletBalance || 0) - netCharge;
      } else if (paymentMethod === 'tab') {
        user.tabBalance = (user.tabBalance || 0) + netCharge;
      }
    }

    await user.save();

    // Decrement stock for inventory items
    for (const item of items) {
      if (!item.isCourtBooking && item.id && !item.id.startsWith('custom_') && !item.id.startsWith('item_custom')) {
        try {
          const invItem = await InventoryItem.findById(item.id);
          if (invItem) {
            invItem.stock = Math.max(0, invItem.stock - item.qty);
            await invItem.save();
          }
        } catch (e) {
          // Ignore stock decrements for custom item formats
        }
      }
    }

    const transaction = new WalletTransaction({
      user: user._id,
      amount: -(netCharge > 0 ? netCharge : total),
      type: 'spot_billing',
      description: walletDeduction > 0 ? `POS (Split) - ${itemsDescription}` : `POS (${paymentMethod.toUpperCase()}) - ${itemsDescription}`,
      paymentMethod: walletDeduction > 0 && netCharge === 0 ? 'wallet' : paymentMethod,
      processedBy: req.user.id
    });
    await transaction.save();

    // Determine stored payment method for Payment record
    let storedPaymentMethod = paymentMethod;
    if (walletDeduction > 0 && netCharge === 0) storedPaymentMethod = 'wallet';
    else if (walletDeduction > 0 && netCharge > 0) storedPaymentMethod = 'split';

    // Split checkout Payment records into 'Court Booking' and 'Club Amenities'
    const courtItems = items.filter(item => item.isCourtBooking);
    const amenityItems = items.filter(item => !item.isCourtBooking);

    if (courtItems.length > 0) {
      const courtTotal = courtItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
      const courtPayment = new Payment({
        user: user._id,
        amount: courtTotal,
        type: 'Court Booking',
        referenceId: transaction._id,
        status: 'success',
        paymentMethod: storedPaymentMethod,
        razorpayPaymentId: walletDeduction > 0 ? `mock-split-pos-${Date.now()}` : `mock-${paymentMethod}-pos-${Date.now()}`
      });
      await courtPayment.save();
    }

    if (amenityItems.length > 0) {
      const amenityTotal = amenityItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
      const amenityPayment = new Payment({
        user: user._id,
        amount: amenityTotal,
        type: 'Club Amenities',
        referenceId: transaction._id,
        status: 'success',
        paymentMethod: storedPaymentMethod,
        razorpayPaymentId: walletDeduction > 0 ? `mock-split-pos-${Date.now()}` : `mock-${paymentMethod}-pos-${Date.now()}`
      });
      await amenityPayment.save();
    }

    // Now instantiate all validated court bookings
    for (const item of items) {
      if (item.isCourtBooking) {
        const court = await Court.findById(item.courtId);
        const booking = new Booking({
          user: user._id,
          court: item.courtId,
          date: item.date,
          slots: item.slots,
          totalAmount: Number(item.price) * Number(item.qty),
          status: 'confirmed',
          paymentId: `POS-SPOT-${Date.now()}`
        });
        booking.qrCodeData = booking._id.toString();
        await booking.save();

        // Create player notification
        const bookingNotif = new Notification({
          title: 'Court Booking Confirmed (Spot Booking)',
          message: `Your spot booking for ${court.name} on ${item.date} at ${item.slots.map(s => `${s}:00`).join(', ')} is confirmed. QR check-in ready!`,
          type: 'booking',
          user: user._id
        });
        await bookingNotif.save();
      }
    }

    res.json({
      message: `Successfully charged ₹${total} via ${paymentMethod}`,
      walletBalance: user.walletBalance,
      tabBalance: user.tabBalance,
      transaction
    });
  } catch (error) {
    console.error('Wallet Charge Error:', error);
    res.status(500).json({ error: 'Spot charging failed' });
  }
});

app.get('/api/admin/wallet/transactions/:userId', authenticateToken, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ user: req.params.userId })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Fetch Wallet Transactions Error:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction logs' });
  }
});

app.get('/api/admin/users/:id/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      walletBalance: user.walletBalance || 0,
      tabBalance: user.tabBalance || 0
    });
  } catch (error) {
    console.error('Fetch User Balance Error:', error);
    res.status(500).json({ error: 'Failed to fetch user balances' });
  }
});

app.get('/api/payments/my-ledger', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    // Return ALL wallet transactions (topups, spot billing, court bookings, coaching, refunds)
    const transactions = await WalletTransaction.find({ user: req.user.id })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ payments, transactions });
  } catch (error) {
    console.error('Fetch My Ledger Error:', error);
    res.status(500).json({ error: 'Failed to retrieve ledger logs' });
  }
});

app.post('/api/users/settle-tab', authenticateToken, async (req, res) => {
  try {
    const { amount, useWallet, paymentMethod } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid settlement amount is required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (useWallet) {
      if ((user.walletBalance || 0) < amount) {
        return res.status(400).json({ error: `Insufficient wallet balance. Total tab settlement is ₹${amount}, but wallet only has ₹${user.walletBalance || 0}.` });
      }
      user.walletBalance = (user.walletBalance || 0) - amount;
      user.tabBalance = Math.max(0, (user.tabBalance || 0) - amount);
      await user.save();

      // Log wallet debit transaction
      const transaction = new WalletTransaction({
        user: user._id,
        amount: -amount,
        type: 'spot_billing',
        description: 'Tab Balance Settlement via Wallet',
        paymentMethod: 'wallet',
        processedBy: user._id
      });
      await transaction.save();

      // Register payment
      const payment = new Payment({
        user: user._id,
        amount: amount,
        type: 'Court Booking',
        referenceId: transaction._id,
        status: 'success',
        razorpayPaymentId: `wallet-tab-settle-${Date.now()}`
      });
      await payment.save();

      return res.json({
        message: 'Tab balance successfully settled using wallet funds!',
        walletBalance: user.walletBalance,
        tabBalance: user.tabBalance
      });
    } else if (paymentMethod === 'card') {
      // Mock Razorpay / Card online payment
      user.tabBalance = Math.max(0, (user.tabBalance || 0) - amount);
      await user.save();

      const payment = new Payment({
        user: user._id,
        amount: amount,
        type: 'Court Booking',
        referenceId: user._id, // User reference as dummy reference
        status: 'success',
        razorpayPaymentId: `razorpay-tab-settle-${Date.now()}`
      });
      await payment.save();

      return res.json({
        message: 'Tab balance successfully settled via mock Razorpay checkout!',
        walletBalance: user.walletBalance,
        tabBalance: user.tabBalance
      });
    } else {
      return res.status(400).json({ error: 'Invalid settlement method' });
    }
  } catch (error) {
    console.error('Player Settle Tab Error:', error);
    res.status(500).json({ error: 'Failed to process tab settlement' });
  }
});

app.post('/api/users/wallet/topup', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive topup amount is required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    // Log credit transaction
    const transaction = new WalletTransaction({
      user: user._id,
      amount: Number(amount),
      type: 'topup',
      description: 'Online Wallet Top-Up via Razorpay',
      paymentMethod: 'card',
      processedBy: user._id
    });
    await transaction.save();

    const payment = new Payment({
      user: user._id,
      amount: Number(amount),
      type: 'Membership', // standard payment enum type
      referenceId: transaction._id,
      status: 'success',
      razorpayPaymentId: `razorpay-topup-${Date.now()}`
    });
    await payment.save();

    res.json({
      message: `Successfully topped up ₹${amount} in your club wallet!`,
      walletBalance: user.walletBalance,
      tabBalance: user.tabBalance
    });
  } catch (error) {
    console.error('Player Wallet Topup Error:', error);
    res.status(500).json({ error: 'Failed to top up wallet balance' });
  }
});

app.post('/api/admin/users/:id/settle-tab', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive settlement amount is required' });
    }
    if (!['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Tab settlements at desk can only be settled via Cash or Card POS' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.tabBalance = Math.max(0, (user.tabBalance || 0) - amount);
    await user.save();

    const payment = new Payment({
      user: user._id,
      amount: amount,
      type: 'Court Booking',
      referenceId: user._id,
      status: 'success',
      razorpayPaymentId: `pos-tab-settle-${Date.now()}`
    });
    await payment.save();

    res.json({
      message: `Successfully settled ₹${amount} of tab balance via ${paymentMethod === 'cash' ? 'Cash' : 'Card POS'}`,
      walletBalance: user.walletBalance,
      tabBalance: user.tabBalance
    });
  } catch (error) {
    console.error('POS Settle Tab Error:', error);
    res.status(500).json({ error: 'Failed to settle tab balance' });
  }
});

// ==========================================
// MASTER LEDGER & REVENUE COMMISSION SPLITS
// ==========================================
app.get('/api/admin/ledger', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('user', 'name email membership')
      .sort({ createdAt: -1 });
      
    const walletTx = await WalletTransaction.find({})
      .populate('user', 'name email membership')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate Master Ledger statistics
    const grossRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Build a unified Master Transaction array
    const paymentTxList = payments.map(p => {
      // Resolve payment method: use stored paymentMethod field first, then infer from razorpayPaymentId
      let method = p.paymentMethod || 'online';
      if (method === 'online') {
        const pid = (p.razorpayPaymentId || '').toLowerCase();
        if (pid.includes('wallet')) method = 'wallet';
        else if (pid.includes('cash')) method = 'cash';
        else if (pid.includes('split')) method = 'split';
        else if (pid.includes('tab')) method = 'tab';
        else if (pid.startsWith('mock-pos') || pid.startsWith('rzp') || pid.startsWith('razorpay')) method = 'card';
      }

      let desc = '';
      if (p.type === 'Court Booking') {
        const pid = (p.razorpayPaymentId || '').toLowerCase();
        if (pid.includes('pos') || pid.includes('spot')) desc = `Spot POS Billing (${p.user?.name || 'Guest'})`;
        else desc = `Court Reservation (${p.user?.name || 'Guest'})`;
      }
      else if (p.type === 'Coaching Course') desc = `Academy Enrollment (${p.user?.name || 'Guest'})`;
      else if (p.type === 'Club Amenities') desc = `Amenities Purchase (${p.user?.name || 'Guest'})`;
      else if (p.type === 'Membership') desc = `Membership Upgrade (${p.user?.name || 'Guest'})`;
      else if (p.type === 'Wallet Top-Up') desc = `Prepaid Wallet Top-Up (${p.user?.name || 'Guest'})`;
      else if (p.type === 'Tab Settlement') desc = `Postpaid Tab Settlement (${p.user?.name || 'Guest'})`;
      else desc = `${p.type} Fee (${p.user?.name || 'Guest'})`;

      return {
        _id: p._id,
        createdAt: p.createdAt,
        user: p.user,
        description: desc,
        paymentMethod: method,
        amount: p.amount
      };
    });

    const walletUnifiedList = walletTx.map(w => {
      return {
        _id: w._id,
        createdAt: w.createdAt,
        user: w.user,
        description: w.description || `${w.type.toUpperCase()} (Wallet)`,
        paymentMethod: 'wallet',
        amount: w.amount
      };
    });

    const unifiedTransactions = [...paymentTxList, ...walletUnifiedList].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      transactions: unifiedTransactions,
      summary: {
        grossRevenue
      }
    });
  } catch (error) {
    console.error('Fetch Master Ledger Error:', error);
    res.status(500).json({ error: 'Failed to fetch ledger details' });
  }
});

app.post('/api/admin/wallet/refund-override', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'User ID and positive amount are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    const transaction = new WalletTransaction({
      user: user._id,
      amount: Number(amount),
      type: 'refund',
      description: description || 'Admin Override Refund',
      paymentMethod: 'wallet',
      processedBy: req.user.id
    });
    await transaction.save();

    res.json({
      message: `Manual refund override of ₹${amount} credited successfully`,
      walletBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    console.error('Refund Override Error:', error);
    res.status(500).json({ error: 'Refund override processing failed' });
  }
});

// ==========================================
// COACH PORTAL APIS
// ==========================================
app.post('/api/coach/progress', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'coach' && currentUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Coach or Admin privileges required' });
    }

    const { enrollmentId, date, remarks, skills } = req.body;
    if (!enrollmentId || !date) {
      return res.status(400).json({ error: 'Enrollment ID and check-in date are required' });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    // Append skill evaluation progress log
    enrollment.progressLogs.push({
      date,
      remarks,
      skills: {
        footwork: Number(skills?.footwork || 3),
        serve: Number(skills?.serve || 3),
        dinking: Number(skills?.dinking || 3),
        backhand: Number(skills?.backhand || 3),
        stamina: Number(skills?.stamina || 3)
      },
      recordedBy: currentUser._id
    });

    // Automatically check-in student's attendance for today if not already present
    if (!enrollment.attendance.includes(date)) {
      enrollment.attendance.push(date);
    }

    await enrollment.save();
    res.json({ message: 'Student progress recorded successfully', enrollment });
  } catch (error) {
    console.error('Save Student Progress Error:', error);
    res.status(500).json({ error: 'Failed to record student progress' });
  }
});

app.get('/api/coach/my-students', authenticateToken, async (req, res) => {
  try {
    const coachUser = await User.findById(req.user.id).populate('coach');
    if (!coachUser || coachUser.role !== 'coach' || !coachUser.coach) {
      return res.status(403).json({ error: 'Active Coach profile required' });
    }

    // Find all courses led by this coach
    const courses = await Course.find({ coach: coachUser.coach._id });
    const courseIds = courses.map(c => c._id);

    // Find all active enrollments for these courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email membership')
      .populate('course', 'title schedule duration startDate endDate');

    res.json({ courses, enrollments });
  } catch (error) {
    console.error('Fetch Coach Students Error:', error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

// ==========================================
// ADMIN QUALITY CONTROL ANALYTICS
// ==========================================
app.get('/api/admin/coaching/quality-control', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const courses = await Course.find({}).populate('coach');
    const enrollments = await Enrollment.find({}).populate('user');

    const report = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.course && e.course.toString() === course._id.toString());
      const capacityRate = course.slotsTotal > 0 ? (courseEnrollments.length / course.slotsTotal) * 100 : 0;

      // Compute average attendance
      let totalAttendanceExpectedCount = 0;
      let totalAttendanceActualCount = 0;
      courseEnrollments.forEach(e => {
        totalAttendanceExpectedCount += 10; // default total sessions
        totalAttendanceActualCount += e.attendance.length;
      });

      const averageAttendanceRate = totalAttendanceExpectedCount > 0 
        ? (totalAttendanceActualCount / totalAttendanceExpectedCount) * 100 
        : 0;

      return {
        courseId: course._id,
        title: course.title,
        coachName: course.coach ? course.coach.name : 'Unassigned',
        enrolledCount: courseEnrollments.length,
        slotsTotal: course.slotsTotal,
        capacityRate: Math.round(capacityRate),
        averageAttendanceRate: Math.round(averageAttendanceRate),
        status: course.status
      };
    });

    res.json(report);
  } catch (error) {
    console.error('Fetch QC Analytics Error:', error);
    res.status(500).json({ error: 'Failed to generate Quality Control reports' });
  }
});

// ==========================================
// INVENTORY MANAGEMENT ROUTES
// ==========================================

// Get all inventory items (accessible by reception/admin)
app.get('/api/admin/inventory', authenticateToken, isReceptionOrAdmin, async (req, res) => {
  try {
    const items = await InventoryItem.find({}).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Create a new inventory item (Admin only)
app.post('/api/admin/inventory', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, isActive } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }
    const existing = await InventoryItem.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    const item = new InventoryItem({
      name: name.trim(),
      price,
      stock,
      isActive: isActive !== undefined ? isActive : true
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update an inventory item (Admin only)
app.put('/api/admin/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, isActive } = req.body;
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (name) {
      const existing = await InventoryItem.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ error: 'An item with this name already exists' });
      }
      item.name = name.trim();
    }
    if (price !== undefined) item.price = price;
    if (stock !== undefined) item.stock = stock;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete an inventory item (Admin only)
app.delete('/api/admin/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

const seedInventory = async () => {
  try {
    const count = await InventoryItem.countDocuments();
    if (count === 0) {
      console.log('📦 Seeding default inventory items...');
      const defaultItems = [
        { name: 'Racket Rental', price: 200, stock: 20, isActive: true },
        { name: 'Premium Water', price: 50, stock: 50, isActive: true },
        { name: 'Energy Drink', price: 120, stock: 30, isActive: true },
        { name: 'Towel Service', price: 100, stock: 15, isActive: true },
        { name: 'Trainer Fee', price: 1500, stock: 9999, isActive: true },
        { name: 'Guest Pass Fee', price: 500, stock: 9999, isActive: true }
      ];
      await InventoryItem.insertMany(defaultItems);
      console.log('✅ Seeded default inventory items successfully.');
    }
  } catch (err) {
    console.error('❌ Failed to seed inventory items: ', err.message);
  }
};

// ==========================================
// DATABASE CONNECTION & SERVER LAUNCH
// ==========================================
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas - The Courtyard');
    await seedInventory();
    app.listen(PORT, () => {
      console.log(`🚀 The Courtyard Server is cruising on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection crash: ', err.message);
    process.exit(1);
  });
