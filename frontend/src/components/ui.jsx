import { Link } from 'react-router-dom';

/* Naye pages (login, cart, checkout, orders) ke common pieces – site jaisa kaala + sunehra design */

export const GOLD_BG = { background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)' };

export function PageShell({ eyebrow, title, accent, sub, children, narrow = false }) {
  return (
    <section className="relative min-h-[80svh] overflow-hidden bg-ink pb-24 pt-28 text-cream md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{ background: 'radial-gradient(55% 45% at 50% 0%, rgba(176,141,87,0.18), transparent 70%)' }} />
      <div className={`relative mx-auto px-5 md:px-8 ${narrow ? 'max-w-[460px]' : 'max-w-[1150px]'}`}>
        {(eyebrow || title) && (
          <header className={`page-in mb-10 ${narrow ? 'text-center' : ''}`}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && (
              <h1 className="mt-3 text-[38px] leading-[1.05] text-cream md:text-[54px]">
                {title} {accent && <span className="italic text-gold">{accent}</span>}
              </h1>
            )}
            {sub && <p className="mt-3 text-[15px] text-mist">{sub}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] ${className}`}>{children}</div>;
}

export function Field({ label, error, hint, className = '', as = 'input', children, ...props }) {
  const Tag = as;
  const id = props.id || props.name;
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-mist">{label}</span>
      <Tag
        id={id}
        aria-invalid={Boolean(error)}
        className={`mt-2 w-full rounded-xl border bg-white/[0.03] px-4 text-[15px] text-cream outline-none transition placeholder:text-white/25 focus:border-gold-light focus:bg-white/[0.05] ${
          as === 'textarea' ? 'min-h-[96px] py-3' : 'h-12'
        } ${error ? 'border-red-400/70' : 'border-white/10'}`}
        {...props}
      >
        {children}
      </Tag>
      {error ? <span className="mt-1.5 block text-xs text-red-300">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-mist/80">{hint}</span> : null}
    </label>
  );
}

export function GoldButton({ children, className = '', loading = false, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`btn-gold relative grid h-[52px] place-items-center overflow-hidden rounded-full px-8 text-[12px] font-bold uppercase tracking-[0.2em] text-ink shadow-[0_14px_40px_-16px_#B08D57] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${className}`}
      style={GOLD_BG}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading && <Spinner />}
        {children}
      </span>
    </button>
  );
}

export function GhostButton({ to, children, className = '', ...props }) {
  const cls = `grid h-[52px] place-items-center rounded-full border border-white/20 px-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-cream transition hover:border-gold/60 hover:text-gold-light ${className}`;
  return to ? <Link to={to} className={cls} {...props}>{children}</Link> : <button className={cls} {...props}>{children}</button>;
}

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Alert({ children, tone = 'error' }) {
  const t = tone === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-gold/30 bg-gold/10 text-gold-pale';
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${t}`}>{children}</p>;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-mist">
      <Spinner className="h-5 w-5 text-gold" /> {label}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <Card className="mx-auto max-w-lg px-8 py-14 text-center">
      <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" strokeLinejoin="round" />
        <path d="M9 8V6.5a3 3 0 016 0V8" />
      </svg>
      <p className="mt-5 font-serif text-3xl text-cream">{title}</p>
      {text && <p className="mt-2 text-[15px] text-mist">{text}</p>}
      {action && <div className="mt-8 flex justify-center">{action}</div>}
    </Card>
  );
}
