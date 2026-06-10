// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\scratch\test-past-slot-validation.js
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const getISTTime = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const hour = istTime.getUTCHours();
  return { dateStr, hour };
};

// Helper for making json requests
const makeRequest = (url, method, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('=== STARTING PAST SLOT VALIDATION TESTS ===\n');
  let failures = 0;

  const { dateStr: todayStr, hour: currentHour } = getISTTime();
  console.log(`IST Current Time Details:`);
  console.log(`- Date: ${todayStr}`);
  console.log(`- Hour: ${currentHour}:00\n`);

  // 1. Login as user
  console.log('1. Logging in as player...');
  const playerLogin = await makeRequest(`${API_BASE}/auth/login`, 'POST', {
    email: 'player@thecourtyard.com',
    password: 'userpassword'
  });
  if (playerLogin.status !== 200) {
    console.error('❌ Failed to login player:', playerLogin.body);
    process.exit(1);
  }
  const playerToken = playerLogin.body.token;
  console.log('✅ Player logged in successfully.\n');

  // 2. Fetch courts list
  console.log('2. Fetching courts...');
  const courtsRes = await makeRequest(`${API_BASE}/courts`, 'GET', null, {
    'Authorization': `Bearer ${playerToken}`
  });
  if (courtsRes.status !== 200 || !courtsRes.body.length) {
    console.error('❌ Failed to get courts:', courtsRes.body);
    process.exit(1);
  }
  const courtId = courtsRes.body[0]._id;
  console.log(`✅ Courts fetched. Using Court ID: ${courtId} (${courtsRes.body[0].name})\n`);

  // 3. Test standard booking past date
  console.log('3. Testing standard booking with past date (yesterday)...');
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayIST = new Date(yesterdayDate.getTime() + 5.5 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterdayIST.getUTCFullYear()}-${String(yesterdayIST.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayIST.getUTCDate()).padStart(2, '0')}`;
  
  const resPastDate = await makeRequest(`${API_BASE}/bookings`, 'POST', {
    courtId,
    date: yesterdayStr,
    slots: [9],
    paymentId: 'MOCK-123'
  }, { 'Authorization': `Bearer ${playerToken}` });

  if (resPastDate.status === 400 && resPastDate.body.error === 'Cannot book courts for past dates') {
    console.log('✅ Success: Past date booking rejected correctly.');
  } else {
    console.error(`❌ Failure: Expected 400 with "Cannot book courts for past dates", got ${resPastDate.status}:`, resPastDate.body);
    failures++;
  }
  console.log();

  // 4. Test standard booking past slots today (if hour > 6)
  if (currentHour > 6) {
    const pastSlot = currentHour - 1;
    console.log(`4. Testing standard booking with past hour today (slot ${pastSlot}:00)...`);
    const resPastSlot = await makeRequest(`${API_BASE}/bookings`, 'POST', {
      courtId,
      date: todayStr,
      slots: [pastSlot],
      paymentId: 'MOCK-123'
    }, { 'Authorization': `Bearer ${playerToken}` });

    if (resPastSlot.status === 400 && resPastSlot.body.error === 'Cannot book past or in-progress slots for today') {
      console.log('✅ Success: Past slot booking today rejected correctly.');
    } else {
      console.error(`❌ Failure: Expected 400 with "Cannot book past or in-progress slots for today", got ${resPastSlot.status}:`, resPastSlot.body);
      failures++;
    }
  } else {
    console.log('4. Skipping standard booking past hour test (it is before 6:00 AM IST today, no slot is in the past yet).');
  }
  console.log();

  // 5. Login as receptionist
  console.log('5. Logging in as receptionist...');
  const recepLogin = await makeRequest(`${API_BASE}/auth/login`, 'POST', {
    email: 'reception@thecourtyard.com',
    password: 'receptionpassword'
  });
  if (recepLogin.status !== 200) {
    console.error('❌ Failed to login receptionist:', recepLogin.body);
    process.exit(1);
  }
  const recepToken = recepLogin.body.token;
  console.log('✅ Receptionist logged in successfully.\n');

  // 6. Test spot booking past date
  console.log('6. Testing receptionist spot booking with past date (yesterday)...');
  const resSpotPastDate = await makeRequest(`${API_BASE}/admin/wallet/charge`, 'POST', {
    userId: playerLogin.body.user.id,
    paymentMethod: 'cash',
    items: [{
      isCourtBooking: true,
      courtId,
      date: yesterdayStr,
      slots: [9],
      price: 800,
      qty: 1,
      name: 'Court 1 Booking'
    }]
  }, { 'Authorization': `Bearer ${recepToken}` });

  if (resSpotPastDate.status === 400 && resSpotPastDate.body.error && resSpotPastDate.body.error.includes('Cannot book courts for past dates')) {
    console.log('✅ Success: Spot past date booking rejected correctly.');
  } else {
    console.error(`❌ Failure: Expected 400 with "Cannot book courts for past dates", got ${resSpotPastDate.status}:`, resSpotPastDate.body);
    failures++;
  }
  console.log();

  // 7. Test spot booking past slot today
  if (currentHour > 6) {
    const pastSlot = currentHour - 1;
    console.log(`7. Testing receptionist spot booking with past slot today (slot ${pastSlot}:00)...`);
    const resSpotPastSlot = await makeRequest(`${API_BASE}/admin/wallet/charge`, 'POST', {
      userId: playerLogin.body.user.id,
      paymentMethod: 'cash',
      items: [{
        isCourtBooking: true,
        courtId,
        date: todayStr,
        slots: [pastSlot],
        price: 800,
        qty: 1,
        name: 'Court 1 Booking'
      }]
    }, { 'Authorization': `Bearer ${recepToken}` });

    if (resSpotPastSlot.status === 400 && resSpotPastSlot.body.error && resSpotPastSlot.body.error.includes('Cannot book past or in-progress slots for today')) {
      console.log('✅ Success: Spot past slot booking today rejected correctly.');
    } else {
      console.error(`❌ Failure: Expected 400 with "Cannot book past or in-progress slots for today", got ${resSpotPastSlot.status}:`, resSpotPastSlot.body);
      failures++;
    }
  } else {
    console.log('7. Skipping spot booking past hour test (it is before 6:00 AM IST today).');
  }
  console.log();

  console.log('=== TEST SUITE COMPLETED ===');
  if (failures === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`❌ ${failures} TEST(S) FAILED.`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
