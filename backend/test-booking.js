const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://courtyard_admin:admin%40123@cluster0.g5cd6jw.mongodb.net/the-courtyard?retryWrites=true&w=majority&appName=Cluster0');
    
    // Find an existing verified user or create one
    let user = await User.findOne({ isVerified: true });
    if (!user) {
      console.log('No verified user found');
      process.exit(1);
    }
    
    // Create a new token for this user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id, role: user.role }, 'the_courtyard_jwt_secret_key_2026_premium', { expiresIn: '7d' });
    
    console.log('Using user:', user.email);
    
    const courtsRes = await axios.get('http://localhost:5000/api/courts');
    const courtId = courtsRes.data[0]._id;
    console.log('Court ID:', courtId);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // use day after tomorrow to avoid overlap
    const dateStr = tomorrow.toISOString().split('T')[0];
    console.log('Making booking for:', dateStr);
    
    // Simulate the exact mobile payload
    const payload = {
      courtId: courtId,
      date: dateStr,
      slots: [6, 7],
      useWallet: false,
      paymentId: 'pay_rzp_12345'
    };
    
    console.log('Payload:', payload);

    const bookingRes = await axios.post('http://localhost:5000/api/bookings', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Booking successful:', bookingRes.data);
  } catch (err) {
    console.log('ERROR MESSAGE:', err.message);
    if (err.response) {
      console.log('DATA:', err.response.data);
    } else {
      console.log('ERR OBJ:', err);
    }
  }
  process.exit(0);
}

run();
