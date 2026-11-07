/* RUPUR backend start:
     npm run dev   → apne computer pe (SQLite, MySQL ki zaroorat nahi)
     npm start     → live (MySQL, .env ki settings) */

// --dev: testing ki settings (jo .env me hain unhe yahan se badalna nahi padta)
if (process.argv.includes('--dev')) {
  const devDefaults = { APP_ENV: 'development', DB_DRIVER: 'sqlite', APP_URL: 'http://localhost:5173' };
  for (const [k, v] of Object.entries(devDefaults)) if (!process.env[k]) process.env[k] = v;

  const [major, minor] = process.versions.node.split('.').map(Number);
  if (process.env.DB_DRIVER === 'sqlite' && (major < 22 || (major === 22 && minor < 13))) {
    console.error(`\nAapka Node.js ${process.versions.node} hai. Bina MySQL ke chalane ke liye Node 22.13 ya naya chahiye.`);
    console.error('Ya toh nodejs.org se Node 22 (LTS) install karo, ya .env me MySQL ki details daal ke "npm start" chalao.\n');
    process.exit(1);
  }
}

const { PORT, APP_ENV, env } = require('./src/config');
const db = require('./src/db');
const { app, SITE_DIR } = require('./src/app');

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nRUPUR API chal raha hai: http://localhost:${PORT}/api/health  (${APP_ENV}, ${env('DB_DRIVER', 'mysql')})`);
      if (SITE_DIR) console.log(`Website bhi yahin se: ${SITE_DIR}`);
      if (String(env('RAZORPAY_KEY_ID', '')).startsWith('rzp_live_') && APP_ENV === 'development') {
        console.log('⚠️  .env me LIVE Razorpay keys hain – testing me payment karoge toh asli paise katenge.');
      }
    });
  })
  .catch((e) => {
    console.error('\nDatabase se connect nahi ho paya. .env me DB_HOST, DB_NAME, DB_USER, DB_PASS check karo.');
    console.error(e.message);
    process.exit(1);
  });
