/* User signup / login / logout / password reset */
const crypto = require('crypto');
const db = require('./db');
const { APP_URL, IS_DEV } = require('./config');
const { fail, str, now, fmtDate, minutesFromNow, validEmail, cleanPhone } = require('./util');

const COOKIE = 'rupur_sid';
const SESSION_DAYS = 30;

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

/* ---- password: scrypt (Node me built-in) ---- */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltHex, hashHex] = parts;
  const expected = Buffer.from(hashHex, 'hex');
  const got = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: +N, r: +r, p: +p });
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

const publicUser = (u) => ({ id: Number(u.id), name: u.name, email: u.email, phone: u.phone });

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(req, res, token, maxAgeMs) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  });
}

async function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.run('INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)', [
    userId, sha256(token), minutesFromNow(SESSION_DAYS * 1440), now(),
  ]);
  setSessionCookie(req, res, token, SESSION_DAYS * 86400000);
}

async function currentUser(req) {
  if (req._user !== undefined) return req._user;
  const token = parseCookies(req.headers.cookie)[COOKIE] || '';
  if (!/^[0-9a-f]{64}$/.test(token)) return (req._user = null);
  const row = await db.get(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?',
    [sha256(token), now()]
  );
  return (req._user = row || null);
}

async function requireUser(req) {
  const u = await currentUser(req);
  if (!u) fail('Please log in to continue.', 401);
  return u;
}

/* ---- rate limit: zyada galat koshish pe rok ---- */
async function tooManyAttempts(key, max = 5, minutes = 15) {
  await db.run('DELETE FROM login_attempts WHERE created_at < ?', [minutesFromNow(-1440)]);
  const r = await db.get('SELECT COUNT(*) AS n FROM login_attempts WHERE attempt_key = ? AND created_at > ?', [key, minutesFromNow(-minutes)]);
  return Number(r.n) >= max;
}
const recordAttempt = (key) => db.run('INSERT INTO login_attempts (attempt_key, created_at) VALUES (?, ?)', [key, now()]);
const clearAttempts = (key) => db.run('DELETE FROM login_attempts WHERE attempt_key = ?', [key]);

/* ---------------- handlers ---------------- */

async function signup(req, res) {
  const d = req.body;
  const name = str(d, 'name', 120);
  const email = str(d, 'email', 190).toLowerCase();
  const phone = cleanPhone(str(d, 'phone', 20));
  const password = typeof d.password === 'string' ? d.password : '';

  const errors = {};
  if (name.length < 2) errors.name = 'Enter your full name.';
  if (!validEmail(email)) errors.email = 'Enter a valid email address.';
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a 10 digit mobile number.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password.length > 200) errors.password = 'Password is too long.';
  if (Object.keys(errors).length) fail('Please fix the highlighted fields.', 422, { fields: errors });

  const key = 'signup:' + req.ip;
  if (await tooManyAttempts(key, 10, 60)) fail('Too many sign-ups from this network. Try again in an hour.', 429);
  await recordAttempt(key);

  if (await db.get('SELECT id FROM users WHERE email = ?', [email])) {
    fail('An account with this email already exists. Log in instead.', 409, { fields: { email: 'This email is already registered.' } });
  }
  const r = await db.run('INSERT INTO users (name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?)', [
    name, email, phone, hashPassword(password), now(),
  ]);
  await startSession(req, res, r.insertId);
  res.status(201).json({ user: publicUser(await db.get('SELECT * FROM users WHERE id = ?', [r.insertId])) });
}

async function login(req, res) {
  const d = req.body;
  const email = str(d, 'email', 190).toLowerCase();
  const password = typeof d.password === 'string' ? d.password.slice(0, 200) : '';
  if (!validEmail(email) || !password) fail('Enter your email and password.', 422);

  const key = `login:${email}:${req.ip}`;
  if (await tooManyAttempts(key)) fail('Too many wrong attempts. Try again in 15 minutes or reset your password.', 429);

  const u = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!u || !verifyPassword(password, u.password_hash)) {
    await recordAttempt(key);
    fail('Email or password is incorrect.', 401);
  }
  await clearAttempts(key);
  await startSession(req, res, u.id);
  res.json({ user: publicUser(u) });
}

async function logout(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await db.run('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
  res.clearCookie(COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: req.secure });
  res.json({ ok: true });
}

async function me(req, res) {
  const u = await currentUser(req);
  res.json({ user: u ? publicUser(u) : null });
}

async function forgot(req, res) {
  const email = str(req.body, 'email', 190).toLowerCase();
  if (!validEmail(email)) fail('Enter a valid email address.', 422);
  const key = 'forgot:' + req.ip;
  if (!(await tooManyAttempts(key, 5, 30))) {
    await recordAttempt(key);
    const u = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (u) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.run('INSERT INTO password_resets (user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)', [
        u.id, sha256(token), minutesFromNow(60), now(),
      ]);
      // late require: mailer bhi auth ke helpers use karta hai
      const link = `${APP_URL}/reset-password?token=${token}`;
      // Testing me (npm run dev) link terminal me bhi dikhao, taaki bina Gmail ke check ho sake
      if (IS_DEV) console.log(`\n🔑 Password reset link (${email}):\n${link}\n`);
      require('./mailer').sendPasswordResetEmail(u, link);
    } else if (IS_DEV) {
      console.log(`(forgot password: ${email} naam ka koi account nahi hai – isliye email nahi bheja)`);
    }
  } else if (IS_DEV) {
    console.log('(forgot password: 30 min me 5 se zyada try – thodi der ruko)');
  }
  // Hamesha same jawab, taaki koi email daal ke account ka pata na laga sake
  res.json({ ok: true });
}

async function reset(req, res) {
  const token = str(req.body, 'token', 128);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (password.length < 8 || password.length > 200) fail('Password must be at least 8 characters.', 422, { fields: { password: 'At least 8 characters.' } });
  if (!/^[0-9a-f]{64}$/.test(token)) fail('This reset link is not valid. Request a new one.', 400);

  const row = await db.get('SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?', [sha256(token), now()]);
  if (!row) fail('This reset link has expired. Request a new one.', 400);

  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), row.user_id]);
  await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id]);
  await db.run('DELETE FROM sessions WHERE user_id = ?', [row.user_id]); // sab jagah se logout
  await startSession(req, res, row.user_id);
  res.json({ user: publicUser(await db.get('SELECT * FROM users WHERE id = ?', [row.user_id])) });
}

module.exports = {
  signup, login, logout, me, forgot, reset,
  currentUser, requireUser, tooManyAttempts, recordAttempt, fmtDate,
};
