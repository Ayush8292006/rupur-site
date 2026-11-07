/* =========================================================
   RUPUR backend – settings
   Saari secret keys .env file me hain (yeh file GitHub pe NAHI jaati).
   ========================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadEnvFile(file) {
  const vars = {};
  let buf;
  try { buf = fs.readFileSync(file); } catch { return vars; }
  // Windows Notepad kabhi "Unicode" (UTF-16) me save karta hai – woh bhi padh lo
  let text = buf[0] === 0xff && buf[1] === 0xfe ? buf.toString('utf16le') : buf.toString('utf8');
  text = text.replace(/^\uFEFF/, '');
  for (let line of text.split(/\r?\n|\r/)) {
    line = line.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).replace(/^export\s+/, '').trim();
    let v = line.slice(i + 1).trim();
    if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1);
    vars[k] = v;
  }
  return vars;
}

const ENV_FILE = path.join(ROOT, '.env');
const fileVars = loadEnvFile(ENV_FILE);

/** Pehle server ke environment variables, phir .env file */
function env(key, fallback = undefined) {
  const v = process.env[key];
  if (v !== undefined && v !== '') return v;
  return fileVars[key] !== undefined && fileVars[key] !== '' ? fileVars[key] : fallback;
}

function envBool(key, fallback = false) {
  const v = env(key);
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

const APP_ENV = env('APP_ENV', 'production');

module.exports = {
  ENV_FILE,
  fileVars,
  env,
  envBool,
  ROOT,
  APP_ENV,
  IS_DEV: APP_ENV === 'development',
  APP_URL: String(env('APP_URL', 'https://www.rupurfragrances.com')).replace(/\/+$/, ''),
  PORT: Number(env('PORT', 8000)),
  STORAGE_DIR: path.join(ROOT, 'storage'),

  // Shipping rules (client ne bataye)
  FREE_SHIPPING_ABOVE: Number(env('FREE_SHIPPING_ABOVE', 999)),
  SHIPPING_ONE_PIECE: Number(env('SHIPPING_ONE_PIECE', 80)),
  SHIPPING_MULTI_PIECE: Number(env('SHIPPING_MULTI_PIECE', 100)),
  // Naye member ka pehla order: itna % extra off (0 = band)
  WELCOME_DISCOUNT_PERCENT: Math.max(0, Math.min(50, Number(env('WELCOME_DISCOUNT_PERCENT', 5)) || 0)),
  MAX_QTY_PER_ITEM: 10,
};
