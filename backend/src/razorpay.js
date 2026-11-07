/* Razorpay: order server pe banta hai, payment ke baad signature check hota hai.
   Secret key sirf yahan (server pe) use hoti hai, browser me kabhi nahi jaati. */
const crypto = require('crypto');
const { env } = require('./config');
const { httpRequest, logLine } = require('./util');

const base = () => String(env('RAZORPAY_API_BASE', 'https://api.razorpay.com')).replace(/\/+$/, '');
const configured = () => Boolean(env('RAZORPAY_KEY_ID') && env('RAZORPAY_KEY_SECRET'));

/** amount paise me (₹1 = 100 paise) */
async function createOrder(amountPaise, receipt, notes = {}) {
  if (!configured()) throw new Error('Razorpay keys are not set in .env');
  const auth = Buffer.from(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`).toString('base64');
  const r = await httpRequest('POST', `${base()}/v1/orders`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  });
  if (!r.ok || !r.body || !r.body.id) {
    logLine('razorpay.log', `create order failed: ${r.error || ''} ${r.status} ${r.raw.slice(0, 500)}`);
    throw new Error('Could not start the payment. Please try again.');
  }
  return r.body;
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function verifySignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', String(env('RAZORPAY_KEY_SECRET', ''))).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

function verifyWebhook(rawBody, signature) {
  const secret = String(env('RAZORPAY_WEBHOOK_SECRET', ''));
  if (!secret || !signature) return false;
  return safeEqual(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), signature);
}

module.exports = { createOrder, verifySignature, verifyWebhook };
