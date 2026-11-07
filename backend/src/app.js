/* =========================================================
   RUPUR API – saare raaste (/api/...)
   Live pe yahi server website (frontend/dist) bhi dikhata hai.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const express = require('express');
const { IS_DEV, ROOT, env } = require('./config');
const { ApiError, wrap, logLine } = require('./util');
const auth = require('./auth');
const products = require('./products');
const dlv = require('./delhivery');
const orders = require('./orders');
const { contact } = require('./mailer');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Hostinger proxy ke peeche https sahi pehchaane

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

/* ---------------- API ---------------- */
const api = express.Router();
api.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// JSON body (raw bhi rakho – Razorpay webhook ke signature ke liye)
api.use(express.json({ limit: '100kb', verify: (req, res, buf) => { req.rawBody = buf; } }));

// POST sirf JSON me (isse dusri site form bhej ke attack nahi kar sakti)
api.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) return next(new ApiError('Send data as JSON.', 415));
  if (!req.body || typeof req.body !== 'object') req.body = {};
  next();
});

api.get('/health', (req, res) => res.json({ ok: true }));
api.get('/products', products.list);
api.post('/cart/quote', wrap(products.quote));
api.get('/pincode/:pin', wrap(dlv.pincodeRoute));

api.post('/auth/signup', wrap(auth.signup));
api.post('/auth/login', wrap(auth.login));
api.post('/auth/logout', wrap(auth.logout));
api.get('/auth/me', wrap(auth.me));
api.post('/auth/forgot', wrap(auth.forgot));
api.post('/auth/reset', wrap(auth.reset));

api.post('/checkout/create', wrap(orders.create));
api.post('/checkout/verify', wrap(orders.verify));
api.post('/checkout/cancelled', wrap(orders.cancelled));
api.post('/razorpay/webhook', wrap(orders.webhook));

api.get('/orders', wrap(orders.list));
api.get('/orders/:orderNo', wrap(orders.detail));

api.post('/contact', wrap(contact));

api.use((req, res, next) => next(new ApiError('Not found.', 404)));

// Saari galtiyan JSON me
// eslint-disable-next-line no-unused-vars
api.use((err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  logLine('error.log', `${err.name}: ${err.message}\n${err.stack || ''}`);
  res.status(500).json({ error: IS_DEV ? err.message : 'Something went wrong on our side. Please try again.' });
});

app.use('/api', api);

/* ---------------- Website (build ki hui) ---------------- */
const SITE_DIR = [env('FRONTEND_DIR'), path.join(ROOT, 'public'), path.join(ROOT, '..', 'frontend', 'dist')]
  .filter(Boolean)
  .map((d) => (path.isAbsolute(d) ? d : path.join(ROOT, d)))
  .find((d) => fs.existsSync(path.join(d, 'index.html')));

if (SITE_DIR) {
  app.use(express.static(SITE_DIR, { index: false, maxAge: '7d', setHeaders: (res, file) => { if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache'); } }));
  // /cart, /orders/... jaise pages bhi index.html se khulein
  app.get('*', (req, res) => res.sendFile(path.join(SITE_DIR, 'index.html')));
}

module.exports = { app, SITE_DIR };
