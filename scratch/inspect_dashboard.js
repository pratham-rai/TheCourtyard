const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../frontend/src/app/dashboard/page.js');
if (!fs.existsSync(pagePath)) {
  console.log('dashboard/page.js does not exist');
  process.exit(1);
}

const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING TIME/SLOT IN DASHBOARD/PAGE.JS ===');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('10:') || line.toLowerCase().includes('slot') || line.toLowerCase().includes('buffer') || line.toLowerCase().includes('court')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
