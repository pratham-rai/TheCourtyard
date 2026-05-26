const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.js');
const content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING BOOKING PATHS IN SERVER.JS ===');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('app.post(\'/api/bookings') || line.toLowerCase().includes('create booking') || line.toLowerCase().includes('courtprice') || line.toLowerCase().includes('peakprice')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
