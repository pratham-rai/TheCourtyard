const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.js');
const content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING /api/admin/wallet/charge IN SERVER.JS ===');
let found = false;
let linesToPrint = [];
lines.forEach((line, index) => {
  if (line.includes('/api/admin/wallet/charge')) {
    found = true;
    for (let i = Math.max(0, index - 2); i < Math.min(lines.length, index + 65); i++) {
      linesToPrint.push(`${i + 1}: ${lines[i].trim()}`);
    }
  }
});
if (found) {
  console.log(linesToPrint.join('\n'));
} else {
  console.log('Not found');
}
