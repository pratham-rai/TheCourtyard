const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../frontend/src/app/admin/page.js');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING setCourtGridData IN PAGE.JS ===');
lines.forEach((line, index) => {
  if (line.includes('setCourtGridData')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
