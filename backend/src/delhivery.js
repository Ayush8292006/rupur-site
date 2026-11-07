/* Delhivery: pincode check, shipment banana, tracking.
   Live URL: https://track.delhivery.com   Testing URL: https://staging-express.delhivery.com
   (.env me DELHIVERY_BASE_URL se badlo)
   API ke exact fields Delhivery One > Developer Portal se ek baar milaa lena. */
const { env, envBool } = require('./config');
const { httpRequest, logLine, fail } = require('./util');

const base = () => String(env('DELHIVERY_BASE_URL', 'https://track.delhivery.com')).replace(/\/+$/, '');
const enabled = () => envBool('DELHIVERY_ENABLED', true) && Boolean(env('DELHIVERY_API_KEY'));
const headers = (type = 'application/json') => ({
  Authorization: `Token ${env('DELHIVERY_API_KEY')}`,
  Accept: 'application/json',
  'Content-Type': type,
});

/** serviceable: true | false | null (null = pata nahi chal paya) */
async function checkPincode(pin) {
  if (!enabled()) return { serviceable: null, city: '', state: '' };
  const r = await httpRequest('GET', `${base()}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pin)}`, { headers: headers(), timeout: 12000 });
  if (!r.ok || !r.body) {
    logLine('delhivery.log', `pincode ${pin} check failed: ${r.status} ${r.error || ''} ${r.raw.slice(0, 300)}`);
    return { serviceable: null, city: '', state: '' };
  }
  const codes = r.body.delivery_codes || [];
  if (!codes.length) return { serviceable: false, city: '', state: '' };
  const pc = codes[0].postal_code || {};
  return {
    serviceable: String(pc.pre_paid || 'Y').toUpperCase() === 'Y',
    city: String(pc.city || pc.district || ''),
    state: String(pc.state_code || ''),
  };
}

/** Paid order ki shipment banao. Wapas AWB (tracking number) milta hai. */
async function createShipment(order, items, weightGrams) {
  if (!enabled()) throw new Error('Delhivery is not configured');
  const desc = items.map((i) => `${i.name} x${i.qty}`).join(', ').slice(0, 250);
  const address = [order.address_line1, order.address_line2].filter(Boolean).join(', ');
  const data = {
    shipments: [{
      name: order.name,
      add: address,
      pin: order.pincode,
      city: order.city,
      state: order.state,
      country: 'India',
      phone: order.phone,
      order: order.order_no,
      payment_mode: 'Prepaid',
      cod_amount: 0,
      total_amount: Number(order.total),
      products_desc: desc,
      quantity: Number(order.item_count),
      order_date: order.paid_at || order.created_at,
      weight: Math.max(1, weightGrams), // grams
      shipping_mode: env('DELHIVERY_SHIPPING_MODE', 'Surface'),
      seller_name: env('SELLER_NAME', 'Rupur Enterprises'),
      seller_add: env('SELLER_ADDRESS', ''),
      waybill: '',
    }],
    pickup_location: { name: env('DELHIVERY_PICKUP_LOCATION', 'Rupur Enterprises') },
  };
  const body = 'format=json&data=' + encodeURIComponent(JSON.stringify(data));
  const r = await httpRequest('POST', `${base()}/api/cmu/create.json`, { headers: headers('application/x-www-form-urlencoded'), body, timeout: 25000 });
  const pkg = r.body && Array.isArray(r.body.packages) ? r.body.packages[0] : null;
  const awb = pkg && pkg.waybill ? String(pkg.waybill) : '';
  if (!r.ok || !awb) {
    const why = pkg ? JSON.stringify(pkg.remarks || pkg) : r.raw.slice(0, 400) || r.error;
    logLine('delhivery.log', `create shipment ${order.order_no} failed: ${r.status} ${r.error || ''} ${why}`);
    throw new Error(`Delhivery: ${why || 'shipment not created'}`);
  }
  return awb;
}

/** AWB se parcel kahan hai */
async function track(awb) {
  if (!enabled() || !awb) return null;
  const r = await httpRequest('GET', `${base()}/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`, { headers: headers(), timeout: 12000 });
  const sh = r.body && r.body.ShipmentData && r.body.ShipmentData[0] && r.body.ShipmentData[0].Shipment;
  if (!r.ok || !sh) {
    logLine('delhivery.log', `track ${awb} failed: ${r.status} ${r.error || ''}`);
    return null;
  }
  const st = sh.Status || {};
  const scans = (sh.Scans || []).map((s) => {
    const d = s.ScanDetail || {};
    return { status: String(d.Scan || ''), detail: String(d.Instructions || ''), location: String(d.ScannedLocation || ''), time: String(d.ScanDateTime || '') };
  });
  return {
    status: String(st.Status || ''),
    detail: String(st.Instructions || ''),
    location: String(st.StatusLocation || ''),
    time: String(st.StatusDateTime || ''),
    expected: String(sh.ExpectedDeliveryDate || sh.PromisedDeliveryDate || ''),
    scans: scans.reverse(), // naya sabse upar
  };
}

const publicTrackingUrl = (awb) => `https://www.delhivery.com/track-v2/package/${encodeURIComponent(awb)}`;

/* GET /api/pincode/:pin */
async function pincodeRoute(req, res) {
  const pin = req.params.pin;
  if (!/^[1-9]\d{5}$/.test(pin)) fail('Enter a valid 6 digit pincode.', 422);
  res.json({ pincode: pin, ...(await checkPincode(pin)) });
}

module.exports = { enabled, checkPincode, createShipment, track, publicTrackingUrl, pincodeRoute };
