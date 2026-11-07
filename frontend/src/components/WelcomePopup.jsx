import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoldButton } from './ui';

/* Naya member (abhi tak koi order nahi) login/signup kare toh ek baar ye popup.
   Discount server khud lagata hai – ye sirf batata hai. */
const seenKey = (id) => `rupur-welcome-seen-${id}`;

export default function WelcomePopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const pct = user?.welcomeOffer || 0;

  useEffect(() => {
    if (!user || !pct || pathname.startsWith('/checkout')) return;
    let seen = false;
    try { seen = localStorage.getItem(seenKey(user.id)) === '1'; } catch { /* private mode */ }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user, pct, pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open || !user) return null;

  function close() {
    try { localStorage.setItem(seenKey(user.id), '1'); } catch { /* ignore */ }
    setOpen(false);
  }
  const shop = () => { close(); navigate('/#shop'); };
  const first = (user.name || '').split(' ')[0];

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center px-5" role="dialog" aria-modal="true" aria-labelledby="welcome-title" data-lenis-prevent>
      <div className="welcome-fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="welcome-pop relative w-full max-w-md overflow-hidden rounded-[28px] border border-gold/30 bg-ink-soft p-8 text-center shadow-[0_40px_120px_-30px_rgba(176,141,87,0.55)] md:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{ background: 'radial-gradient(45% 45% at 50% 40%, rgba(212,178,122,0.3), transparent 100%)' }} />
        <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-mist transition hover:bg-white/10 hover:text-cream">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        <p className="relative text-[11px] font-medium uppercase tracking-[0.35em] text-gold">Welcome to RUPUR{first ? `, ${first}` : ''}</p>
        <div className="relative mx-auto mt-6 grid h-28 w-28 place-items-center rounded-full border border-gold/40 bg-gradient-to-b from-gold/25 to-transparent">
          <div>
            <p className="font-serif text-5xl leading-none text-gold-light">{pct}%</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream">extra off</p>
          </div>
        </div>
        <h2 id="welcome-title" className="relative mt-6 font-serif text-3xl text-cream">A gift for your first order</h2>
        <p className="relative mt-3 text-[15px] leading-relaxed text-mist">
          As a new member you get an extra <b className="text-cream">{pct}% off</b> on your first order. No code needed – it is applied automatically at checkout.
        </p>
        <GoldButton onClick={shop} className="relative mt-8 w-full">Shop now</GoldButton>
        <button type="button" onClick={close} className="relative mt-4 text-sm text-mist hover:text-cream">Maybe later</button>
      </div>
      <style>{`
        .welcome-fade { animation: wFade .4s ease both; }
        .welcome-pop { animation: wPop .6s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes wFade { from { opacity: 0; } }
        @keyframes wPop { from { opacity: 0; transform: translateY(24px) scale(.94); } }
        @media (prefers-reduced-motion: reduce) { .welcome-fade, .welcome-pop { animation: none; } }
      `}</style>
    </div>
  );
}
