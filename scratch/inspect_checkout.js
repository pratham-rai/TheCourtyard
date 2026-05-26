const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../frontend/src/app/admin/page.js');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING handleSpotCheckoutSubmit IN PAGE.JS ===');
let found = false;
let linesToPrint = [];
lines.forEach((line, index) => {
  if (line.includes('handleSpotCheckoutSubmit')) {
    found = true;
    for (let i = Math.max(0, index - 2); i < Math.min(lines.length, index + 35); i++) {
      linesToPrint.push(`${i + 1}: ${lines[i].trim()}`);
    }
  }
});
if (found) {
  console.log(linesToPrint.join('\n'));
} else {
  console.log('Not found');
}
