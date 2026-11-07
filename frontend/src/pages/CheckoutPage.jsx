import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart, shippingFor, discountFor } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, loadRazorpay, rupees } from '../lib/api';
import { Alert, Card, Field, GoldButton, Loading, PageShell, Spinner } from '../components/ui';
import { OrderSummary } from './CartPage';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
const ADDR_KEY = 'rupur-last-address';

function validate(a) {
  const er = {};
  if (a.name.trim().length < 2) er.name = 'Enter the full name.';
  if (!/^[6-9]\d{9}$/.test(a.phone.replace(/\D/g, '').slice(-10))) er.phone = 'Enter a 10 digit mobile number.';
  if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) er.email = 'Enter a valid email.';
  if (a.address1.trim().length < 5) er.address1 = 'Enter house no., street and area.';
  if (a.city.trim().length < 2) er.city = 'Enter the city.';
  if (!a.state) er.state = 'Select the state.';
  if (!/^[1-9]\d{5}$/.test(a.pincode)) er.pincode = 'Enter a valid 6 digit pincode.';
  return er;
}

export default function CheckoutPage() {
  const { user, ready, refresh } = useAuth();
  const { lines, items, count, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState(() => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(ADDR_KEY) || '{}'); } catch { /* ignore */ }
    return { name: '', phone: '', email: '', address1: '', address2: '', city: '', state: '', pincode: '', ...saved };
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [pin, setPin] = useState({ state: 'idle' }); // idle | checking | ok | no | unknown
  const filledFromUser = useRef(false);

  // Login wale user ka naam/email/phone pehle se bhar do
  useEffect(() => {
    if (user && !filledFromUser.current) {
      filledFromUser.current = true;
      setAddr((a) => ({ ...a, name: a.name || user.name, email: a.email || user.email, phone: a.phone || user.phone }));
    }
  }, [user]);

  // Pincode daalte hi Delhivery se check
  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(addr.pincode)) { setPin({ state: 'idle' }); return; }
    let live = true;
    setPin({ state: 'checking' });
    api(`/pincode/${addr.pincode}`)
      .then((d) => {
        if (!live) return;
        if (d.serviceable === true) setPin({ state: 'ok' });
        else if (d.serviceable === false) setPin({ state: 'no' });
        else setPin({ state: 'unknown' });
        if (d.city) setAddr((a) => ({ ...a, city: a.city || d.city.replace(/\b\w/g, (c) => c.toUpperCase()) }));
      })
      .catch(() => live && setPin({ state: 'unknown' }));
    return () => { live = false; };
  }, [addr.pincode]);

  if (ready && !user) return <Navigate to="/login?next=/checkout" replace />;
  if (!ready) return <PageShell><Loading /></PageShell>;
  if (!lines.length && !paying) return <Navigate to="/cart" replace />;

  const shipping = shippingFor(subtotal, count);
  const pct = user?.welcomeOffer || 0;
  const discount = discountFor(subtotal, pct);
  const total = subtotal - discount + shipping;
  const set = (k) => (e) => {
    const v = k === 'pincode' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
    setAddr((a) => ({ ...a, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const pay = async (e) => {
    e.preventDefault();
    const er = validate(addr);
    if (pin.state === 'no') er.pincode = 'Delivery is not available at this pincode.';
    setErrors(er);
    if (Object.keys(er).length) {
      setError('Please fix the highlighted fields.');
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setError('');
    setPaying(true);
    try { localStorage.setItem(ADDR_KEY, JSON.stringify(addr)); } catch { /* ignore */ }

    let created;
    try {
      const [Razorpay, data] = await Promise.all([
        loadRazorpay(),
        api('/checkout/create', { method: 'POST', body: { items, address: addr } }),
      ]);
      created = data;
      const r = data.razorpay;
      const rzp = new Razorpay({
        key: r.key,
        order_id: r.orderId,
        amount: r.amount,
        currency: r.currency,
        name: r.name,
        description: r.description,
        image: '/rupur-logo.png',
        prefill: r.prefill,
        theme: { color: '#B08D57' },
        handler: async (resp) => {
          try {
            const v = await api('/checkout/verify', { method: 'POST', body: resp });
            clear();
            refresh();
            navigate(`/orders/${v.order.orderNo}?placed=1`, { replace: true });
          } catch (err) {
            setPaying(false);
            setError(`${err.message} Your order number is ${data.orderNo}.`);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError('Payment was cancelled. You can try again.');
            api('/checkout/cancelled', { method: 'POST', body: { orderNo: data.orderNo } }).catch(() => {});
          },
        },
      });
      rzp.on('payment.failed', (resp) => {
        setError(resp?.error?.description ? `Payment failed: ${resp.error.description}` : 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      setErrors(err.fields || {});
      setError(err.message);
      if (created) api('/checkout/cancelled', { method: 'POST', body: { orderNo: created.orderNo } }).catch(() => {});
    }
  };

  const pinNote = {
    checking: <span className="flex items-center gap-2 text-mist"><Spinner className="h-3 w-3" /> Checking delivery…</span>,
    ok: <span className="text-emerald-300">✓ Delivery available by Delhivery</span>,
    no: <span className="text-red-300">Delhivery does not deliver to this pincode yet.</span>,
    unknown: <span className="text-mist">We will confirm delivery for this pincode.</span>,
  }[pin.state];

  return (
    <PageShell eyebrow="Checkout" title="Delivery" accent="details" sub="Pay securely with UPI, cards or net banking.">
      <form onSubmit={pay} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Card className="page-in p-6 md:p-8">
          <h2 className="font-serif text-2xl text-cream">Where should we deliver?</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="name" autoComplete="name" value={addr.name} onChange={set('name')} error={errors.name} />
            <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={addr.phone} onChange={set('phone')} error={errors.phone} hint="Delhivery will call this number" />
            <Field label="Email" name="email" type="email" autoComplete="email" value={addr.email} onChange={set('email')} error={errors.email} hint="Order confirmation is sent here" className="sm:col-span-2" />
            <Field label="House no., street, area" name="address1" autoComplete="address-line1" value={addr.address1} onChange={set('address1')} error={errors.address1} className="sm:col-span-2" />
            <Field label="Landmark (optional)" name="address2" autoComplete="address-line2" value={addr.address2} onChange={set('address2')} className="sm:col-span-2" />
            <div>
              <Field label="Pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" value={addr.pincode} onChange={set('pincode')} error={errors.pincode} placeholder="465337" />
              {!errors.pincode && pinNote && <p className="mt-1.5 text-xs">{pinNote}</p>}
            </div>
            <Field label="City" name="city" autoComplete="address-level2" value={addr.city} onChange={set('city')} error={errors.city} />
            <Field as="select" label="State" name="state" autoComplete="address-level1" value={addr.state} onChange={set('state')} error={errors.state} className="sm:col-span-2 [&_select]:bg-ink-soft">
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Field>
          </div>
        </Card>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary subtotal={subtotal} count={count} shipping={shipping} discount={discount} discountPercent={pct}>
            <ul className="mt-5 space-y-3 border-t border-white/10 pt-5">
              {lines.map(({ id, qty, product: p }) => (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <img src={p.img} alt="" className="h-12 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-cream">{p.name} <span className="text-mist">× {qty}</span></span>
                  <span className="tabular-nums text-cream">{rupees(p.price * qty)}</span>
                </li>
              ))}
            </ul>
            {error && <div className="mt-5"><Alert>{error}</Alert></div>}
            <GoldButton type="submit" loading={paying} className="mt-6 w-full">
              {paying ? 'Opening payment' : `Pay ${rupees(total)}`}
            </GoldButton>
            <p className="mt-4 text-center text-xs leading-relaxed text-mist">
              Payments are handled by Razorpay. All sales are final – please check your order before paying.
            </p>
          </OrderSummary>
        </div>
      </form>
    </PageShell>
  );
}
