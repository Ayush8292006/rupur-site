/* Checkout + orders
   1) POST /checkout/create : cart + address → order (pending) + Razorpay order
   2) Customer Razorpay pe pay karta hai
   3) POST /checkout/verify : signature check → order paid → Delhivery shipment → emails
   (Razorpay webhook bhi same kaam karta hai, agar customer ne beech me browser band kar diya) */
const crypto = require('crypto');
const db = require('./db');
const { env } = require('./config');
const { fail, str, now, logLine, validEmail, cleanPhone } = require('./util');
const { requireUser } = require('./auth');
const { priceCart, findProduct } = require('./products');
const { welcomePercent } = require('./offer');
const rzp = require('./razorpay');
const dlv = require('./delhivery');
const { sendOrderEmails } = require('./mailer');

function newOrderNo() {
  const d = now().slice(2, 10).replace(/-/g, ''); // yymmdd
  return 'RPR' + d + crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
}

function validateAddress(d) {
  const a = {
    name: str(d, 'name', 120),
    phone: cleanPhone(str(d, 'phone', 20)),
    email: str(d, 'email', 190).toLowerCase(),
    address_line1: str(d, 'address1', 255),
    address_line2: str(d, 'address2', 255),
    city: str(d, 'city', 100),
    state: str(d, 'state', 100),
    pincode: str(d, 'pincode', 10).replace(/\D/g, ''),
  };
  const errors = {};
  if (a.name.length < 2) errors.name = 'Enter the full name.';
  if (!/^[6-9]\d{9}$/.test(a.phone)) errors.phone = 'Enter a 10 digit mobile number.';
  if (!validEmail(a.email)) errors.email = 'Enter a valid email.';
  if (a.address_line1.length < 5) errors.address1 = 'Enter house no., street and area.';
  if (a.city.length < 2) errors.city = 'Enter the city.';
  if (a.state.length < 2) errors.state = 'Select the state.';
  if (!/^[1-9]\d{5}$/.test(a.pincode)) errors.pincode = 'Enter a valid 6 digit pincode.';
  if (Object.keys(errors).length) fail('Please fix the highlighted fields.', 422, { fields: errors });
  return a;
}

const orderItems = (orderId) => db.all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [orderId]);

function orderWeight(items) {
  return items.reduce((w, i) => w + (findProduct(i.product_id)?.weight ?? Number(env('SHIP_WEIGHT_GRAMS', 300))) * Number(i.qty), 0);
}

/* POST /api/checkout/create */
async function create(req, res) {
  const user = await requireUser(req);
  const cart = priceCart(req.body.items, await welcomePercent(user));
  const addr = validateAddress(req.body.address && typeof req.body.address === 'object' ? req.body.address : {});

  // Pincode pe delivery hoti hai? (pata na chale toh order rokte nahi)
  const pin = await dlv.checkPincode(addr.pincode);
  if (pin.serviceable === false) {
    fail('Sorry, Delhivery does not deliver to this pincode yet.', 422, { fields: { pincode: 'Delivery not available at this pincode.' } });
  }

  const orderNo = newOrderNo();
  const orderId = await db.tx(async (t) => {
    const r = await t.run(
      `INSERT INTO orders (order_no, user_id, status, subtotal, shipping, discount, total, item_count, name, phone, email,
        address_line1, address_line2, city, state, pincode, created_at)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, user.id, cart.subtotal, cart.shipping, cart.discount, cart.total, cart.itemCount, addr.name, addr.phone, addr.email,
        addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode, now()]
    );
    for (const i of cart.items) {
      await t.run('INSERT INTO order_items (order_id, product_id, name, size, img, price, qty, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.insertId, i.id, i.name, i.size, i.img, i.price, i.qty, i.lineTotal]);
    }
    return r.insertId;
  });

  let order;
  try {
    order = await rzp.createOrder(cart.total * 100, orderNo, { order_no: orderNo, email: addr.email });
  } catch (e) {
    await db.run("UPDATE orders SET status = 'failed' WHERE id = ?", [orderId]);
    fail(e.message, 502);
  }
  await db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [order.id, orderId]);

  res.status(201).json({
    orderNo,
    total: cart.total,
    discount: cart.discount,
    razorpay: {
      key: env('RAZORPAY_KEY_ID'), // Key ID public hoti hai, secret nahi
      orderId: order.id,
      amount: cart.total * 100,
      currency: 'INR',
      name: 'RUPUR Fragrances',
      description: `Order ${orderNo}`,
      prefill: { name: addr.name, email: addr.email, contact: addr.phone },
    },
  });
}

/** Payment confirm hone ke baad – ek hi baar asar karta hai, chahe verify + webhook dono aayein */
async function finalizePaid(razorpayOrderId, paymentId) {
  const o0 = await db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpayOrderId]);
  if (!o0) return null;
  if (o0.status !== 'paid') {
    await db.run("UPDATE orders SET status = 'paid', razorpay_payment_id = ?, paid_at = ? WHERE id = ? AND status <> 'paid'", [paymentId, now(), o0.id]);
  }
  let o = await db.get('SELECT * FROM orders WHERE id = ?', [o0.id]);
  const items = await orderItems(o.id);

  // Delhivery shipment – pehle "claim" karo taaki do request saath aayein toh bhi ek hi shipment bane
  if (!o.awb && dlv.enabled()) {
    const claim = await db.run("UPDATE orders SET awb = 'PENDING' WHERE id = ? AND awb IS NULL", [o.id]);
    if (claim.changes === 1) {
      try {
        const awb = await dlv.createShipment(o, items, orderWeight(items));
        await db.run('UPDATE orders SET awb = ?, shipment_error = NULL WHERE id = ?', [awb, o.id]);
      } catch (e) {
        await db.run('UPDATE orders SET awb = NULL, shipment_error = ? WHERE id = ?', [String(e.message).slice(0, 1000), o.id]);
      }
    }
    o = await db.get('SELECT * FROM orders WHERE id = ?', [o.id]);
  }

  // Emails – ek hi baar
  const claimed = await db.run('UPDATE orders SET emails_sent = 2 WHERE id = ? AND emails_sent = 0', [o.id]);
  if (claimed.changes === 1) {
    const ok = await sendOrderEmails({ ...o, awb: o.awb === 'PENDING' ? null : o.awb }, items);
    await db.run('UPDATE orders SET emails_sent = ? WHERE id = ?', [ok ? 1 : 3, o.id]);
  }
  return o;
}

/* POST /api/checkout/verify */
async function verify(req, res) {
  const user = await requireUser(req);
  const rzpOrder = str(req.body, 'razorpay_order_id', 64);
  const payment = str(req.body, 'razorpay_payment_id', 64);
  const sig = str(req.body, 'razorpay_signature', 128);
  if (!rzpOrder || !payment || !sig) fail('Payment details are missing.', 422);

  const o = await db.get('SELECT * FROM orders WHERE razorpay_order_id = ? AND user_id = ?', [rzpOrder, user.id]);
  if (!o) fail('Order not found.', 404);
  if (!rzp.verifySignature(rzpOrder, payment, sig)) {
    logLine('razorpay.log', `BAD SIGNATURE for ${o.order_no} payment ${payment}`);
    fail('We could not confirm this payment. If money was deducted, it will be refunded by Razorpay automatically. Please contact us.', 400);
  }
  const paid = await finalizePaid(rzpOrder, payment);
  res.json({ order: publicOrder(paid, await orderItems(paid.id)) });
}

/* POST /api/checkout/cancelled – customer ne Razorpay window band kar di */
async function cancelled(req, res) {
  const user = await requireUser(req);
  await db.run("UPDATE orders SET status = 'cancelled' WHERE order_no = ? AND user_id = ? AND status = 'pending'", [str(req.body, 'orderNo', 32), user.id]);
  res.json({ ok: true });
}

/* POST /api/razorpay/webhook – Razorpay dashboard me yeh URL daalna (events: payment.captured, order.paid) */
async function webhook(req, res) {
  const raw = req.rawBody ? req.rawBody.toString('utf8') : '';
  if (!rzp.verifyWebhook(raw, req.get('x-razorpay-signature') || '')) return res.status(400).json({ ok: false });
  const ev = req.body || {};
  const pay = ev.payload && ev.payload.payment && ev.payload.payment.entity;
  if (['payment.captured', 'order.paid'].includes(ev.event) && pay && pay.order_id && pay.id) {
    const o = await db.get('SELECT total FROM orders WHERE razorpay_order_id = ?', [pay.order_id]);
    if (o && Number(pay.amount) === Number(o.total) * 100) await finalizePaid(pay.order_id, pay.id);
    else logLine('razorpay.log', `webhook amount mismatch or unknown order: ${pay.order_id}`);
  }
  res.json({ ok: true });
}

function publicOrder(o, items, tracking = null) {
  const awb = o.awb && o.awb !== 'PENDING' ? o.awb : null;
  return {
    orderNo: o.order_no,
    status: o.status,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    discount: Number(o.discount || 0),
    total: Number(o.total),
    itemCount: Number(o.item_count),
    address: {
      name: o.name, phone: o.phone, email: o.email, address1: o.address_line1, address2: o.address_line2,
      city: o.city, state: o.state, pincode: o.pincode,
    },
    items: items.map((i) => ({ id: i.product_id, name: i.name, size: i.size, img: i.img, price: Number(i.price), qty: Number(i.qty), lineTotal: Number(i.line_total) })),
    awb,
    trackingUrl: awb ? dlv.publicTrackingUrl(awb) : null,
    tracking,
  };
}

/* GET /api/orders – mere orders (sirf jinka payment hua) */
async function list(req, res) {
  const user = await requireUser(req);
  const rows = await db.all("SELECT * FROM orders WHERE user_id = ? AND status = 'paid' ORDER BY id DESC LIMIT 100", [user.id]);
  const out = [];
  for (const o of rows) out.push(publicOrder(o, await orderItems(o.id)));
  res.json({ orders: out });
}

/* GET /api/orders/:orderNo – ek order + live tracking */
async function detail(req, res) {
  const user = await requireUser(req);
  const no = String(req.params.orderNo || '');
  if (!/^[A-Z0-9]{6,32}$/.test(no)) fail('Order not found.', 404);
  const o = await db.get('SELECT * FROM orders WHERE order_no = ? AND user_id = ?', [no, user.id]);
  if (!o || o.status !== 'paid') fail('Order not found.', 404);
  const awb = o.awb && o.awb !== 'PENDING' ? o.awb : null;
  const tracking = awb ? await dlv.track(awb) : null;
  res.json({ order: publicOrder(o, await orderItems(o.id), tracking) });
}

module.exports = { create, verify, cancelled, webhook, list, detail };
