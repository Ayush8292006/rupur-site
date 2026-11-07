/* Products data/products.json se aate hain.
   Naya product jodna ho toh us file me ek aur { ... } block jod do aur server restart karo. */
const fs = require('fs');
const path = require('path');
const { env, ROOT, FREE_SHIPPING_ABOVE, SHIPPING_ONE_PIECE, SHIPPING_MULTI_PIECE, MAX_QTY_PER_ITEM } = require('./config');
const { fail, logLine } = require('./util');

const FILE = path.join(ROOT, 'data', 'products.json');
let cache = null;
let cacheMtime = 0;

/** File badle toh apne aap nayi list (restart ki zaroorat nahi) */
function allProducts() {
  let mtime = 0;
  try { mtime = fs.statSync(FILE).mtimeMs; } catch { /* file nahi */ }
  if (cache && mtime === cacheMtime) return cache;
  let data = [];
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { logLine('error.log', 'products.json read failed: ' + e.message); }
  cache = (Array.isArray(data) ? data : [])
    .filter((p) => p && p.id && p.name && p.price !== undefined)
    .map((p) => ({
      id: String(p.id),
      name: String(p.name),
      desc: String(p.desc || ''),
      size: String(p.size || ''),
      img: String(p.img || ''),
      images: (Array.isArray(p.images) ? p.images : []).map(String).filter(Boolean),
      story: String(p.story || ''),
      notes: (Array.isArray(p.notes) ? p.notes : []).map(String).filter(Boolean),
      accent: String(p.accent || '#B08D57'),
      gender: String(p.gender || 'Unisex'),
      type: String(p.type || 'Perfume'),
      price: Math.round(Number(p.price)),
      mrp: Math.round(Number(p.mrp ?? p.price)),
      soldOut: Boolean(p.soldOut),
      weight: Math.round(Number(p.weight ?? env('SHIP_WEIGHT_GRAMS', 300))), // grams, packing ke saath
    }));
  cacheMtime = mtime;
  return cache;
}

const findProduct = (id) => allProducts().find((p) => p.id === id) || null;

function list(req, res) {
  res.json({ products: allProducts().map(({ weight, ...p }) => p) });
}

/** ₹999 ya zyada: free. Kam: 1 piece ₹80, 2 ya zyada ₹100. Koi tax nahi. */
const shippingFor = (subtotal, count) => (subtotal >= FREE_SHIPPING_ABOVE ? 0 : count <= 1 ? SHIPPING_ONE_PIECE : SHIPPING_MULTI_PIECE);

/** Cart ka hisaab hamesha server pe (browser ke price pe bharosa nahi). items: [{id, qty}] */
/** discountPercent: naye member ka offer (offer.js) */
function priceCart(items, discountPercent = 0) {
  if (!Array.isArray(items) || !items.length) fail('Your cart is empty.', 422);
  const merged = new Map();
  for (const it of items) {
    const id = it && typeof it.id === 'string' ? it.id : '';
    const qty = it ? Math.floor(Number(it.qty)) : 0;
    if (!id || !(qty >= 1)) continue;
    merged.set(id, Math.min(MAX_QTY_PER_ITEM, (merged.get(id) || 0) + qty));
  }
  if (!merged.size) fail('Your cart is empty.', 422);

  let subtotal = 0, count = 0, weight = 0;
  const lines = [];
  const problems = [];
  for (const [id, qty] of merged) {
    const p = findProduct(id);
    if (!p) { problems.push('A product in your cart is no longer available.'); continue; }
    if (p.soldOut) { problems.push(`${p.name} is sold out. Remove it to continue.`); continue; }
    const line = p.price * qty;
    subtotal += line; count += qty; weight += p.weight * qty;
    lines.push({ id: p.id, name: p.name, size: p.size, img: p.img, price: p.price, qty, lineTotal: line });
  }
  if (problems.length) fail(problems[0], 409, { problems });
  const shipping = shippingFor(subtotal, count); // free shipping discount se pehle wale amount pe
  const discount = Math.round((subtotal * discountPercent) / 100);
  return { items: lines, itemCount: count, subtotal, discount, discountPercent: discount ? discountPercent : 0, shipping, total: subtotal - discount + shipping, weight };
}

async function quote(req, res) {
  // late require: auth -> mailer -> ... (circular se bachne ke liye)
  const user = await require('./auth').currentUser(req);
  const { weight, ...q } = priceCart(req.body.items, await require('./offer').welcomePercent(user));
  res.json({ ...q, freeShippingAbove: FREE_SHIPPING_ABOVE });
}

module.exports = { allProducts, findProduct, list, priceCart, quote, shippingFor };
