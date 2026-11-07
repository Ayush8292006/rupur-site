import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, rupees } from '../lib/api';
import { Alert, Card, EmptyState, GoldButton, GhostButton, Loading, PageShell } from '../components/ui';

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDateTime = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

// Delhivery status → hamare 4 steps
const STEPS = ['Order placed', 'Shipped', 'Out for delivery', 'Delivered'];
function stepFor(order) {
  const s = (order.tracking?.status || '').toLowerCase();
  if (s.includes('delivered') && !s.includes('un')) return 3;
  if (s.includes('dispatch') || s.includes('out for')) return 2;
  if (order.awb && s && !s.includes('manifest') && !s.includes('not picked') && !s.includes('pending')) return 1;
  return 0;
}

function StatusPill({ order }) {
  const step = stepFor(order);
  const label = order.tracking?.status || (order.awb ? 'Ready to ship' : 'Being packed');
  const tone = step === 3 ? 'bg-emerald-400/15 text-emerald-200' : 'bg-gold/15 text-gold-pale';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

function useRequireLogin(path) {
  const { user, ready } = useAuth();
  if (!ready) return { wait: true };
  if (!user) return { redirect: `/login?next=${encodeURIComponent(path)}` };
  return {};
}

export function OrdersPage() {
  const gate = useRequireLogin('/orders');
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/orders').then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
  }, [user]);

  if (gate.redirect) return <Navigate to={gate.redirect} replace />;
  if (gate.wait) return <PageShell><Loading /></PageShell>;

  return (
    <PageShell eyebrow={`Hi, ${user.name.split(' ')[0]}`} title="My" accent="orders">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm text-mist">
        <span>{user.email} · {user.phone}</span>
        <button onClick={logout} className="rounded-full border border-white/15 px-4 py-2 text-cream hover:border-gold/60">Log out</button>
      </div>
      {error && <Alert>{error}</Alert>}
      {!orders && !error && <Loading label="Loading your orders…" />}
      {orders && !orders.length && (
        <EmptyState title="No orders yet" text="When you place an order, you can track it here." action={<GoldButton onClick={() => (window.location.href = '/#shop')}>Shop perfumes</GoldButton>} />
      )}
      {orders && orders.length > 0 && (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.orderNo} className="page-in">
              <Link to={`/orders/${o.orderNo}`} className="group block">
                <Card className="flex flex-col gap-4 p-5 transition group-hover:border-gold/40 md:flex-row md:items-center md:p-6">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i) => (
                      <img key={i.id} src={i.img} alt="" className="h-16 w-14 rounded-xl border-2 border-ink object-cover" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Order {o.orderNo}</p>
                    <p className="mt-1 truncate text-cream">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
                    <p className="mt-1 text-sm text-mist">Placed {fmtDate(o.paidAt || o.createdAt)} · {rupees(o.total)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                    <StatusPill order={o} />
                    <span className="text-sm text-gold-light group-hover:underline">View & track →</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

export function OrderDetailPage() {
  const { orderNo } = useParams();
  const [params] = useSearchParams();
  const placed = params.get('placed') === '1';
  const gate = useRequireLogin(`/orders/${orderNo}`);
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api(`/orders/${encodeURIComponent(orderNo)}`).then((d) => setOrder(d.order)).catch((e) => setError(e.message));
  }, [user, orderNo]);

  if (gate.redirect) return <Navigate to={gate.redirect} replace />;
  if (gate.wait || (!order && !error)) return <PageShell><Loading label="Loading order…" /></PageShell>;
  if (error) return <PageShell title="Order" accent="not found"><Alert>{error}</Alert><GhostButton to="/orders" className="mt-6 inline-grid">Back to my orders</GhostButton></PageShell>;

  const step = stepFor(order);
  const a = order.address;

  return (
    <PageShell
      eyebrow={placed ? 'Thank you' : `Order ${order.orderNo}`}
      title={placed ? 'Order' : 'Order'}
      accent={placed ? 'confirmed' : 'details'}
      sub={placed ? `We have emailed the confirmation to ${a.email}. Order no. ${order.orderNo}` : `Placed on ${fmtDate(order.paidAt || order.createdAt)}`}
    >
      {placed && (
        <div className="page-in mb-8 flex items-center gap-4 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-100">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-xl">✓</span>
          <p className="text-[15px]">Payment of <b>{rupees(order.total)}</b> received. Your parcel will be handed to Delhivery soon.</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Tracking */}
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-cream">Delivery status</h2>
              <StatusPill order={order} />
            </div>

            <ol className="mt-7 grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full border text-sm ${i <= step ? 'border-transparent bg-gold text-ink' : 'border-white/15 text-mist'}`}>{i < step ? '✓' : i + 1}</span>
                  <span className={`mt-2 block text-[11px] leading-tight md:text-xs ${i <= step ? 'text-cream' : 'text-mist'}`}>{s}</span>
                </li>
              ))}
            </ol>

            {order.awb ? (
              <div className="mt-7 rounded-2xl bg-white/[0.03] p-4 text-sm">
                <p className="text-mist">Delhivery tracking number</p>
                <p className="mt-1 font-mono text-lg tracking-wider text-cream">{order.awb}</p>
                {order.tracking?.expected && <p className="mt-2 text-mist">Expected by <span className="text-cream">{fmtDate(order.tracking.expected)}</span></p>}
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-gold-light hover:underline">Track on Delhivery ↗</a>
              </div>
            ) : (
              <p className="mt-7 rounded-2xl bg-white/[0.03] p-4 text-sm text-mist">Your order is being packed. The tracking number will appear here once the parcel is handed to Delhivery.</p>
            )}

            {order.tracking?.scans?.length > 0 && (
              <ul className="mt-6 space-y-4 border-l border-white/10 pl-5">
                {order.tracking.scans.map((sc, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-gold shadow-[0_0_10px_#D4B27A]' : 'bg-white/25'}`} />
                    <p className="text-[15px] text-cream">{sc.detail || sc.status}</p>
                    <p className="text-xs text-mist">{[sc.location, fmtDateTime(sc.time)].filter(Boolean).join(' · ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Items */}
          <Card className="p-6 md:p-8">
            <h2 className="font-serif text-2xl text-cream">Items</h2>
            <ul className="mt-5 divide-y divide-white/10">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-4">
                  <img src={i.img} alt="" className="h-16 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-cream">{i.name}</p>
                    <p className="text-sm text-mist">{i.size} · {i.qty} × {rupees(i.price)}</p>
                  </div>
                  <p className="tabular-nums text-cream">{rupees(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-white/10 pt-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="tabular-nums">{rupees(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-gold-light"><dt>New member offer</dt><dd className="tabular-nums">− {rupees(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-mist">Shipping</dt><dd className="tabular-nums">{order.shipping ? rupees(order.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between text-lg"><dt>Total paid</dt><dd className="font-semibold tabular-nums">{rupees(order.total)}</dd></div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Card className="p-6">
            <h2 className="font-serif text-xl text-cream">Delivering to</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-mist">
              <span className="text-cream">{a.name}</span><br />
              {a.address1}<br />
              {a.address2 && <>{a.address2}<br /></>}
              {a.city}, {a.state} – {a.pincode}<br />
              {a.phone}
            </p>
          </Card>
          <Card className="p-6 text-sm text-mist">
            Questions about this order? WhatsApp or call{' '}
            <a href="https://wa.me/919713620850" target="_blank" rel="noreferrer" className="text-gold-light hover:underline">97136 20850</a> and share order no. <span className="text-cream">{order.orderNo}</span>.
          </Card>
          <div className="flex gap-3">
            <GhostButton to="/orders" className="flex-1">All orders</GhostButton>
            <GhostButton to="/#shop" className="flex-1">Shop more</GhostButton>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
