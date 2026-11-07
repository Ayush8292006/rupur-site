import { Link, useNavigate } from 'react-router-dom';
import { useCart, shippingFor } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { rupees } from '../lib/api';
import { Card, EmptyState, GoldButton, GhostButton, PageShell } from '../components/ui';

export function QtyStepper({ qty, onChange, max = 10, small = false }) {
  const h = small ? 'h-9' : 'h-11';
  return (
    <div className={`inline-flex items-center rounded-full border border-white/15 ${h}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label="Decrease quantity" className={`${h} w-10 text-lg text-cream hover:text-gold-light`}>−</button>
      <span className="w-6 text-center text-sm tabular-nums text-cream" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Increase quantity" className={`${h} w-10 text-lg text-cream hover:text-gold-light disabled:opacity-30`}>+</button>
    </div>
  );
}

export function OrderSummary({ subtotal, count, shipping, children }) {
  const left = 999 - subtotal;
  return (
    <Card className="p-6 md:p-7">
      <h2 className="font-serif text-2xl text-cream">Order summary</h2>
      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between"><dt className="text-mist">Items ({count})</dt><dd className="tabular-nums text-cream">{rupees(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mist">Shipping</dt><dd className="tabular-nums text-cream">{shipping === 0 ? <span className="text-gold-light">Free</span> : rupees(shipping)}</dd></div>
        <div className="flex justify-between border-t border-white/10 pt-4 text-lg"><dt className="text-cream">Total</dt><dd className="font-semibold tabular-nums text-cream">{rupees(subtotal + shipping)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-mist">No taxes or hidden charges. You pay exactly this.</p>
      {count > 0 && left > 0 && (
        <p className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold-pale">Add {rupees(left)} more for free shipping.</p>
      )}
      {children}
    </Card>
  );
}

export default function CartPage() {
  const { lines, count, subtotal, setQty, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipping = shippingFor(subtotal, count);
  const soldOut = lines.filter((l) => l.product.soldOut);

  if (!lines.length) {
    return (
      <PageShell eyebrow="Your cart" title="Your" accent="cart">
        <EmptyState title="Your cart is empty" text="Find a scent you love and add it here." action={<GoldButton onClick={() => navigate('/#shop')}>Shop perfumes</GoldButton>} />
      </PageShell>
    );
  }

  const checkout = () => navigate(user ? '/checkout' : '/login?next=/checkout');

  return (
    <PageShell eyebrow="Your cart" title="Your" accent="cart" sub={`${count} item${count > 1 ? 's' : ''} ready for checkout`}>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          {lines.map(({ id, qty, product: p }) => (
            <li key={id} className="page-in">
              <Card className="flex gap-4 p-4 md:gap-6 md:p-5">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl md:h-32 md:w-28" style={{ backgroundColor: `${p.accent}33` }}>
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{p.gender} · {p.size}</p>
                      <h3 className="mt-1 truncate font-serif text-xl text-cream md:text-2xl">{p.name}</h3>
                      <p className="mt-1 text-sm text-mist">{rupees(p.price)} each</p>
                    </div>
                    <p className="shrink-0 text-lg font-semibold tabular-nums text-cream">{rupees(p.price * qty)}</p>
                  </div>
                  {p.soldOut && <p className="mt-2 text-sm text-red-300">Sold out – please remove to continue.</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QtyStepper small qty={qty} onChange={(n) => setQty(id, n)} />
                    <button onClick={() => remove(id)} className="text-sm text-mist underline-offset-4 hover:text-red-300 hover:underline">Remove</button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
          <li><Link to="/#shop" className="inline-block pt-2 text-sm text-gold-light hover:underline">← Continue shopping</Link></li>
        </ul>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary subtotal={subtotal} count={count} shipping={shipping}>
            <GoldButton onClick={checkout} disabled={soldOut.length > 0} className="mt-6 w-full">
              {user ? 'Checkout' : 'Log in to checkout'}
            </GoldButton>
            {!user && <GhostButton to="/signup?next=/checkout" className="mt-3 w-full">Create account</GhostButton>}
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-mist">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
              Secure payment by Razorpay
            </p>
          </OrderSummary>
        </div>
      </div>
    </PageShell>
  );
}
