import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Shop', href: '#shop' },
  { label: 'Our Story', href: '#story' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState('#home');
  const { count } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  // Page badalne par menu band
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHidden(y > 300 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
      if (window.location.pathname !== '/') { setActive(''); return; }
      for (const l of [...LINKS].reverse()) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top < 140) { setActive(l.href); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className={`nav-in fixed inset-x-0 top-0 z-[200] transition-all duration-500 ease-luxe
          ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}
          ${scrolled || open
            ? 'bg-ink/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(212,178,122,0.15),0_20px_40px_-30px_rgba(0,0,0,0.9)]'
            : 'bg-ink'}`}
      >
        <div className="mx-auto grid h-16 max-w-[1500px] grid-cols-[48px_1fr_auto] items-center px-4 md:h-20 md:px-8 lg:grid-cols-[220px_1fr_auto] lg:gap-8">
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="relative z-10 h-12 w-12 lg:hidden flex flex-col justify-center items-start pl-2 group"
          >
            <span className={`h-[1.5px] bg-cream transition-all duration-300 ${open ? 'w-6 translate-y-[6px] rotate-45' : 'w-6 mb-1.5 group-hover:w-4'}`} />
            <span className={`h-[1.5px] bg-cream transition-all duration-300 ${open ? 'w-6 opacity-0' : 'w-5 mb-1.5 group-hover:w-6'}`} />
            <span className={`h-[1.5px] bg-cream transition-all duration-300 ${open ? 'w-6 -translate-y-[6px] -rotate-45' : 'w-4 group-hover:w-6'}`} />
          </button>

          {/* Logo Container */}
          <div className="relative flex items-center justify-center lg:justify-start h-full w-full">
            <a
              href="#home"
              onClick={() => setOpen(false)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:translate-x-0 flex items-center group z-50"
            >
              <img 
                src="/rupur-logo.png" 
                alt="RUPUR Logo" 
                className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 origin-center lg:origin-left scale-[2.5] md:scale-[3] lg:scale-[3.5] group-hover:scale-[3.6] lg:group-hover:scale-[3.7]" 
                style={{ mixBlendMode: 'screen', filter: 'invert(1)' }} 
              />
            </a>
          </div>

          {/* Desktop Links */}
          <ul className="hidden items-center justify-center gap-8 lg:flex xl:gap-10">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={`nav-link relative py-2 text-[11px] font-medium uppercase tracking-[0.25em] transition-colors duration-300 ${
                    onHome && active === l.href ? 'text-gold-light' : 'text-mist hover:text-cream'
                  }`}
                  data-active={onHome && active === l.href}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="flex items-center justify-self-end gap-3 md:gap-6 z-10">
            <a
              href="#shop"
              className="btn-shine relative hidden overflow-hidden rounded-full px-6 py-2.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-12px_#D4B27A] md:inline-block"
              style={{ background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)' }}
            >
              <span className="relative z-10">Shop Now</span>
            </a>

            <Link
              to={user ? '/orders' : '/login'}
              aria-label={user ? 'My orders' : 'Log in'}
              title={user ? `My orders (${user.name})` : 'Log in'}
              className="group relative hidden h-10 w-10 place-items-center rounded-full text-mist transition-all duration-300 hover:text-gold-light sm:grid"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
              </svg>
              {user && <span className="absolute right-[9px] top-[9px] h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </Link>

            <Link
              to="/cart"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              className="group relative grid h-10 w-10 place-items-center rounded-full text-mist transition-all duration-300 hover:text-gold-light"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-5 w-5">
                <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" strokeLinejoin="round" />
                <path d="M9 8V6.5a3 3 0 016 0V8" />
              </svg>
              {count > 0 && (
                <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-ink" style={{ background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)' }}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <ScrollProgress />
      </header>

      {/* ============ ULTRA PREMIUM MOBILE DRAWER ============ */}
      <div
        className={`fixed inset-x-0 bottom-0 top-16 z-[190] bg-[#0A0604] transition-all duration-500 ease-luxe lg:hidden ${
          open ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-4'
        }`}
      >
        {/* Subtle gold ambient glow */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
          style={{ background: 'radial-gradient(50% 100% at 50% 0%, rgba(212,178,122,0.12), transparent 70%)' }} />

        <div className="relative flex h-full flex-col px-6 pb-8 pt-6">
          
          {/* Menu Items */}
          <ul className="flex-1 flex flex-col gap-1 mt-4">
            {LINKS.map((l, i) => (
              <li key={l.href} className="overflow-hidden border-b border-white/[0.04]">
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`group flex items-baseline gap-4 py-5 transition-all duration-500 ease-luxe ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                  style={{ transitionDelay: open ? `${100 + i * 50}ms` : '0ms' }}
                >
                  <span className="text-[10px] font-medium tracking-[0.2em] text-gold/60">
                    0{i + 1}
                  </span>
                  <span className="font-serif text-[28px] leading-none text-cream transition-colors group-hover:text-gold-light">
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Bottom Section (CTA & Contact) */}
          <div 
            className={`mt-auto pt-6 transition-all duration-500 ease-luxe ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            style={{ transitionDelay: open ? '400ms' : '0ms' }}
          >
            {/* Account + cart */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Link to={user ? '/orders' : '/login'} className="grid h-[50px] place-items-center rounded-full border border-white/15 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream">
                {user ? 'My orders' : 'Log in'}
              </Link>
              <Link to="/cart" className="grid h-[50px] place-items-center rounded-full border border-white/15 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream">
                Cart{count > 0 ? ` (${count})` : ''}
              </Link>
            </div>

            {/* Shop Now Button */}
            <a
              href="#shop"
              onClick={() => setOpen(false)}
              className="btn-shine relative grid h-[54px] w-full place-items-center overflow-hidden rounded-full text-[12px] font-semibold uppercase tracking-[0.2em] text-ink active:scale-[.98]"
              style={{ background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)' }}
            >
              <span className="relative z-10">Shop Now</span>
            </a>

            {/* Contact Info */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="text-[9px] uppercase tracking-[0.3em] text-mist/70">Get in touch</span>
              <div className="flex flex-col items-center gap-1.5">
                <a href="tel:+919713620850" className="text-[14px] font-medium tracking-wide text-cream hover:text-gold transition-colors">
                  +91 97136 20850
                </a>
                <a href="mailto:rupurperfumes@gmail.com" className="text-[13px] text-mist hover:text-gold transition-colors">
                  rupurperfumes@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nav-in { animation: navIn .8s cubic-bezier(.19, 1, .22, 1) both; }
        @keyframes navIn { from { transform: translateY(-100%); opacity: 0; } to { transform: none; opacity: 1; } }

        .nav-link::after {
          content: ''; position: absolute; left: 50%; bottom: -6px; height: 1px; width: 0;
          background: #D4B27A; transform: translateX(-50%);
          transition: width .4s cubic-bezier(.19, 1, .22, 1);
          box-shadow: 0 0 8px rgba(212,178,122,0.6);
        }
        .nav-link:hover::after, .nav-link[data-active="true"]::after { width: 100%; }
        .badge-pop { animation: badgePop .5s cubic-bezier(.3,1.6,.5,1) both; }
        @keyframes badgePop { from { transform: scale(0); } to { transform: scale(1); } }

        .btn-shine::after {
          content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent);
          transform: skewX(-20deg); animation: shine 3.4s 1.2s ease-in-out infinite;
        }
        @keyframes shine { 0%, 65% { left: -60%; } 100% { left: 130%; } }
      `}</style>
    </>
  );
}

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]">
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${p})`,
          background: 'linear-gradient(90deg, #8A6A3B 0%, #E8D3A8 55%, #D4B27A 100%)',
          boxShadow: '0 0 8px rgba(232,211,168,0.5)',
        }}
      />
    </div>
  );
}