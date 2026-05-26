const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, '../frontend/src/app/admin/page.js');
const serverPath = path.join(__dirname, '../backend/server.js');

function searchFile(filePath, query) {
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`=== Searching "${query}" in ${path.basename(filePath)} ===`);
  let count = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`${index + 1}: ${line.trim()}`);
      count++;
    }
  });
  console.log(`Found ${count} matches.\n`);
}

searchFile(adminPagePath, 'gst');
searchFile(adminPagePath, 'commission');
searchFile(adminPagePath, 'yellow');
searchFile(adminPagePath, 'buffer');

searchFile(serverPath, 'gst');
searchFile(serverPath, 'commission');
searchFile(serverPath, 'settings');
