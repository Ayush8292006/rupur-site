const fs = require('fs');
const path = require('path');
const { STORAGE_DIR } = require('./config');

class ApiError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const fail = (message, status = 400, extra = {}) => { throw new ApiError(message, status, extra); };

/** async route ki galti seedha error handler tak jaaye */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const str = (obj, key, max = 255) => {
  const v = obj && (typeof obj[key] === 'string' || typeof obj[key] === 'number') ? String(obj[key]).trim() : '';
  return [...v].slice(0, max).join('');
};

const now = () => fmtDate(new Date());

/** 'YYYY-MM-DD HH:MM:SS' India time me */
function fmtDate(d) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).reduce((o, x) => ((o[x.type] = x.value), o), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

const minutesFromNow = (m) => fmtDate(new Date(Date.now() + m * 60000));

function logLine(file, msg) {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.appendFileSync(path.join(STORAGE_DIR, file), `[${new Date().toISOString()}] ${msg}\n`);
  } catch { /* log na likh paye toh bhi chalne do */ }
}

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 190;

function cleanPhone(p) {
  let d = String(p || '').replace(/\D+/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Bahar ki API (Razorpay, Delhivery) ko call */
async function httpRequest(method, url, { headers = {}, body, timeout = 20000 } = {}) {
  try {
    const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(timeout) });
    const raw = await res.text();
    let json = null;
    try { json = JSON.parse(raw); } catch { /* JSON nahi */ }
    return { ok: res.ok, status: res.status, body: json, raw, error: null };
  } catch (e) {
    return { ok: false, status: 0, body: null, raw: '', error: e.message || 'Network error' };
  }
}

module.exports = { ApiError, fail, wrap, str, now, fmtDate, minutesFromNow, logLine, validEmail, cleanPhone, httpRequest };
