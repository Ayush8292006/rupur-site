/* Website build karke backend/public me copy karta hai, taaki ek hi Node app sab chala de.
   Chalao:  npm run build:site   (backend folder me) */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontend = path.join(__dirname, '..', '..', 'frontend');
const out = path.join(__dirname, '..', 'public');

console.log('1/3 frontend ke packages install…');
execSync('npm install', { cwd: frontend, stdio: 'inherit' });
console.log('2/3 website build…');
execSync('npm run build', { cwd: frontend, stdio: 'inherit' });
console.log('3/3 backend/public me copy…');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(frontend, 'dist'), out, { recursive: true });
console.log('Ho gaya: ' + out);
