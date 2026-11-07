/* Gmail se email ja raha hai ya nahi – seedha check.
   Chalao (backend folder me):  npm run test:mail
   Kisi aur email pe bhejna ho:  npm run test:mail -- kisi@example.com */
const nodemailer = require('nodemailer');
const fs = require('fs');
const { env, ENV_FILE, fileVars } = require('../src/config');

const user = env('SMTP_USER', '');
const pass = String(env('SMTP_PASS', '')).replace(/\s+/g, '');
const to = process.argv[2] || user;
const secure = String(env('SMTP_SECURE', 'tls')).toLowerCase();

console.log('\n--- Email test ---');
console.log('.env file :', ENV_FILE, fs.existsSync(ENV_FILE) ? '(mili)' : '(NAHI MILI)');
console.log('SMTP wali lines:', Object.keys(fileVars).filter((k) => /SMTP/i.test(k)).map((k) => JSON.stringify(k) + (fileVars[k] ? '=✔' : '=khaali')).join('  ') || '(koi nahi)');
if (process.env.SMTP_PASS !== undefined) console.log('⚠️  Computer pe SMTP_PASS naam ka alag variable bhi set hai:', JSON.stringify(process.env.SMTP_PASS));
console.log('SMTP_HOST :', env('SMTP_HOST', '(khaali)'));
console.log('SMTP_PORT :', env('SMTP_PORT', '(khaali)'));
console.log('SMTP_USER :', user || '(khaali)');
console.log('SMTP_PASS :', pass ? `${pass.length} letters (16 hone chahiye)` : '(khaali)');
console.log('Bhejna hai:', to || '(koi email nahi)');

if (!user || !pass) {
  console.log('\n❌ .env me SMTP_USER ya SMTP_PASS khaali hai. backend/.env file me bharo (.env.example me nahi).\n');
  process.exit(1);
}
if (pass.length !== 16) console.log('⚠️  Gmail App Password 16 letters ka hota hai – dobara check karo.');

const t = nodemailer.createTransport({
  host: env('SMTP_HOST', 'smtp.gmail.com'),
  port: Number(env('SMTP_PORT', 587)),
  secure: secure === 'ssl',
  requireTLS: secure === 'tls',
  auth: { user, pass },
  connectionTimeout: 15000,
});

(async () => {
  try {
    await t.verify();
    console.log('\n✅ Gmail se login ho gaya.');
    const info = await t.sendMail({
      from: { name: env('MAIL_FROM_NAME', 'RUPUR Fragrances'), address: env('MAIL_FROM', user) },
      to,
      subject: 'RUPUR test email',
      text: 'Ye test email hai. Mil gaya matlab website se emails jayenge.',
    });
    console.log(`✅ Email bhej diya: ${to}  (${info.response || 'ok'})`);
    console.log('   Inbox me na dikhe toh Spam / Promotions folder dekho.\n');
  } catch (e) {
    const m = `${e.code || ''} ${e.responseCode || ''} ${e.message}`;
    console.log('\n❌ Email fail:', e.message);
    if (/535|534|Username and Password not accepted|Invalid login|BadCredentials/i.test(m)) {
      console.log('→ App Password galat hai, ya 2-Step Verification on nahi hai, ya App Password kisi aur Gmail account ka hai.');
      console.log('  Rupurperfumes@gmail.com se hi naya App Password banao: myaccount.google.com/apppasswords');
    } else if (/ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENOTFOUND|timeout/i.test(m)) {
      console.log('→ Computer Gmail (port 587) tak nahi pahunch pa raha: internet, firewall ya antivirus check karo.');
      console.log('  .env me SMTP_PORT=465 aur SMTP_SECURE=ssl karke bhi try karo.');
    } else if (/self.signed|certificate/i.test(m)) {
      console.log('→ Antivirus (Avast/Kaspersky/Quick Heal ki "Mail shield") beech me aa raha hai. Use thodi der band karke try karo.');
    }
    console.log('');
    process.exit(1);
  }
})();