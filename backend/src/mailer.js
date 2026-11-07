/* Emails: order confirmation (customer + client), password reset, contact form.
   Gmail: SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=tls
   SMTP_PASS me Gmail ka 16 letter wala "App Password" daalna hai, normal password nahi. */
const nodemailer = require('nodemailer');
const db = require('./db');
const { env, APP_URL } = require('./config');
const { fail, str, now, logLine, validEmail } = require('./util');

let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  const secure = String(env('SMTP_SECURE', 'tls')).toLowerCase(); // tls | ssl | none
  transporter = nodemailer.createTransport({
    host: env('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(env('SMTP_PORT', 587)),
    secure: secure === 'ssl',
    requireTLS: secure === 'tls',
    ignoreTLS: secure === 'none',
    auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: String(env('SMTP_PASS', '')).replace(/\s+/g, '') } : undefined,
  });
  return transporter;
}

/** Email bhejo; fail ho toh log me likho, order nahi rukta */
async function sendMail(to, subject, html, text, replyTo) {
  if (!env('SMTP_HOST') || !env('SMTP_USER') || !env('SMTP_PASS')) {
    logLine('mail.log', `SMTP not configured, skipped mail to ${to}: ${subject}`);
    console.warn(`⚠️  Email NAHI gaya (${to}: ${subject}) – .env me SMTP_PASS (Gmail App Password) khaali hai.`);
    return false;
  }
  try {
    await getTransport().sendMail({
      from: { name: env('MAIL_FROM_NAME', 'RUPUR Fragrances'), address: env('MAIL_FROM', env('SMTP_USER')) },
      to, subject, html, text, replyTo,
    });
    logLine('mail.log', `sent to ${to}: ${subject}`);
    console.log(`✉️  Email gaya: ${to} – ${subject}`);
    return true;
  } catch (e) {
    logLine('mail.log', `FAILED to ${to}: ${subject} — ${e.message}`);
    console.warn(`⚠️  Email fail (${to}): ${e.message}`);
    return false;
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

/** Email ka common dhaancha (RUPUR style: kaala + sunehra) */
function layout(title, inner) {
  const site = esc(APP_URL);
  const phone = esc(env('SUPPORT_PHONE', '9713620850'));
  const email = esc(env('ORDER_NOTIFY_EMAIL', 'Rupurperfumes@gmail.com'));
  return `<!doctype html><html><body style="margin:0;background:#F4F1EC;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0A0A0A;padding:26px 28px;text-align:center">
<div style="font-family:Georgia,serif;font-size:28px;letter-spacing:6px;color:#E8D3A8">RUPUR</div>
<div style="font-size:10px;letter-spacing:4px;color:#B08D57;margin-top:6px">FRAGRANCE YOU FEEL</div>
</td></tr>
<tr><td style="padding:28px">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px">${title}</h1>
${inner}
</td></tr>
<tr><td style="background:#FAF7F2;padding:18px 28px;font-size:12px;color:#6B6158;line-height:1.6">
Need help? WhatsApp or call <b>${phone}</b> · ${email}<br>
Rupur Enterprises, In front of Tehsil, Kalapipal Mandi, Dist. Shajapur (M.P.) 465337<br>
<a href="${site}" style="color:#8A6A3B">${site}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o, items) {
  const rows = items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #EEE7DC">${esc(i.name)}
<div style="font-size:12px;color:#8A7F72">${esc(i.size)} · Qty ${i.qty} × ${rupees(i.price)}</div></td>
<td style="padding:10px 0;border-bottom:1px solid #EEE7DC;text-align:right;white-space:nowrap">${rupees(i.line_total)}</td></tr>`).join('');
  const ship = Number(o.shipping) === 0 ? 'Free' : rupees(o.shipping);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
<tr><td style="padding:10px 0 4px;color:#6B6158">Subtotal</td><td style="padding:10px 0 4px;text-align:right">${rupees(o.subtotal)}</td></tr>
<tr><td style="padding:4px 0;color:#6B6158">Shipping</td><td style="padding:4px 0;text-align:right">${ship}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #1A1A1A">Total paid</td><td style="padding:10px 0;text-align:right;font-weight:bold;font-size:16px;border-top:2px solid #1A1A1A">${rupees(o.total)}</td></tr>
</table>`;
}

const addressBlock = (o) => `<p style="font-size:14px;line-height:1.6;margin:0"><b>${esc(o.name)}</b><br>${esc(o.address_line1)}<br>${o.address_line2 ? esc(o.address_line2) + '<br>' : ''}${esc(o.city)}, ${esc(o.state)} – ${esc(o.pincode)}<br>Phone: ${esc(o.phone)}<br>Email: ${esc(o.email)}</p>`;

function textSummary(o, items) {
  let t = `Order ${o.order_no}\n\n`;
  for (const i of items) t += `- ${i.name} (${i.size}) x${i.qty} = ${rupees(i.line_total)}\n`;
  t += `\nSubtotal: ${rupees(o.subtotal)}\nShipping: ${Number(o.shipping) ? rupees(o.shipping) : 'Free'}\nTotal paid: ${rupees(o.total)}\n\nDeliver to:\n${o.name}\n${o.address_line1} ${o.address_line2 || ''}\n${o.city}, ${o.state} - ${o.pincode}\nPhone: ${o.phone}\n`;
  if (o.awb) t += `\nTracking number (Delhivery): ${o.awb}\n`;
  return t;
}

/** Order confirmed – customer + client dono ko */
async function sendOrderEmails(o, items) {
  const orderUrl = `${APP_URL}/orders/${encodeURIComponent(o.order_no)}`;
  const track = o.awb
    ? `<p style="font-size:14px;margin:16px 0">Delhivery tracking number: <b>${esc(o.awb)}</b></p>`
    : '<p style="font-size:14px;margin:16px 0;color:#6B6158">We will share your tracking number as soon as your parcel is handed to Delhivery.</p>';

  const customerHtml = layout('Thank you, your order is confirmed', `
<p style="font-size:14px;line-height:1.6;margin:0 0 6px">Hi ${esc(o.name)},</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 18px">We have received your payment. Your order <b>${esc(o.order_no)}</b> is being packed.</p>
${itemsTable(o, items)}${track}
<p style="font-size:13px;color:#6B6158;margin:0 0 8px">Delivering to</p>${addressBlock(o)}
<p style="margin:24px 0 0"><a href="${esc(orderUrl)}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">View order &amp; track</a></p>`);

  const ok1 = await sendMail(o.email, `Order confirmed – ${o.order_no} | RUPUR`, customerHtml,
    `Hi ${o.name},\n\nThank you! Your order is confirmed.\n\n${textSummary(o, items)}\nView your order: ${orderUrl}`);

  const shipNote = o.awb
    ? `<p style="font-size:14px">Delhivery shipment created. AWB: <b>${esc(o.awb)}</b>. Print the label from Delhivery One and keep the parcel ready for pickup.</p>`
    : `<p style="font-size:14px;color:#A2311F"><b>Delhivery shipment was NOT created automatically.</b> Please create it in Delhivery One.${o.shipment_error ? `<br><small>${esc(o.shipment_error)}</small>` : ''}</p>`;

  const adminHtml = layout(`New order received – ${esc(o.order_no)}`, `
<p style="font-size:14px;margin:0 0 6px">Payment received via Razorpay.</p>
<p style="font-size:13px;color:#6B6158;margin:0 0 18px">Payment ID: ${esc(o.razorpay_payment_id)} · ${esc(o.paid_at)}</p>
${itemsTable(o, items)}${shipNote}
<p style="font-size:13px;color:#6B6158;margin:16px 0 8px">Customer</p>${addressBlock(o)}`);

  const ok2 = await sendMail(env('ORDER_NOTIFY_EMAIL', 'Rupurperfumes@gmail.com'), `New order ${o.order_no} – ${rupees(o.total)}`, adminHtml,
    `New order received.\nPayment ID: ${o.razorpay_payment_id}\n`
    + (o.awb ? '' : `\n!! Delhivery shipment was NOT created automatically. Please create it in Delhivery One.\n${o.shipment_error ? `Reason: ${o.shipment_error}\n` : ''}`)
    + `\n${textSummary(o, items)}`, o.email);

  return ok1 && ok2;
}

function sendPasswordResetEmail(user, link) {
  const html = layout('Reset your password', `
<p style="font-size:14px;line-height:1.6">Hi ${esc(user.name)},</p>
<p style="font-size:14px;line-height:1.6">Tap the button below to set a new password. This link works for 1 hour.</p>
<p style="margin:22px 0"><a href="${esc(link)}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">Set new password</a></p>
<p style="font-size:12px;color:#8A7F72">If you did not ask for this, you can ignore this email.</p>`);
  return sendMail(user.email, 'Reset your RUPUR password', html, `Hi ${user.name},\n\nSet a new password here (valid for 1 hour):\n${link}\n\nIf you did not ask for this, ignore this email.`);
}

/* POST /api/contact – website ka contact form */
async function contact(req, res) {
  const { tooManyAttempts, recordAttempt } = require('./auth');
  const d = req.body;
  const name = str(d, 'name', 120);
  const email = str(d, 'email', 190).toLowerCase();
  const phone = str(d, 'phone', 20);
  const topic = str(d, 'topic', 60);
  const message = str(d, 'message', 3000);

  const errors = {};
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!validEmail(email)) errors.email = 'Enter a valid email.';
  if (message.length < 5) errors.message = 'Write a short message.';
  if (Object.keys(errors).length) fail('Please fix the highlighted fields.', 422, { fields: errors });
  const key = 'contact:' + req.ip;
  if (await tooManyAttempts(key, 5, 30)) fail('You have sent a few messages already. Please try again later or WhatsApp us.', 429);
  await recordAttempt(key);

  await db.run('INSERT INTO contact_messages (name, email, phone, topic, message, created_at) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone, topic, message, now()]);
  const html = layout('New website enquiry', `
<p style="font-size:14px;line-height:1.7"><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || '—')}<br><b>Topic:</b> ${esc(topic || '—')}</p>
<p style="font-size:14px;line-height:1.7;white-space:pre-wrap;background:#FAF7F2;padding:14px;border-radius:10px">${esc(message)}</p>`);
  await sendMail(env('ORDER_NOTIFY_EMAIL', 'Rupurperfumes@gmail.com'), `Website enquiry from ${name}`, html,
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nTopic: ${topic}\n\n${message}`, email);
  res.json({ ok: true });
}

module.exports = { sendMail, sendOrderEmails, sendPasswordResetEmail, contact };
