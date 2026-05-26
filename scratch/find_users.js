const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../backend/seed.js');
const seedContent = fs.readFileSync(seedPath, 'utf8');

const lines = seedContent.split('\n');
console.log('=== SEEDED PASSWORD VARIABLES IN SEED.JS ===');
lines.forEach((line, index) => {
  if (line.includes('Password') || line.includes('password')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
