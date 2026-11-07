import { useEffect, useRef, useState } from 'react';

const VIDEO = '/rupur-video.mp4';
const POSTER = '/rupur-poster.jpg';

const HERO = {
  title: 'RUPUR',
  tagline: 'Fragrance you feel',
  primary: { label: 'Shop Now', href: '#shop' },
  secondary: { label: 'Our Story', href: '#story' },
};

const TRUST = [
  { t: 'Free Shipping', s: 'above ₹999', d: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { t: 'Secure', s: 'payment', d: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4' },
  { t: 'Tracked', s: 'delivery', d: 'M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
];

const CATEGORIES = [
  { label: 'Men', filter: 'Men', icon: 'men' },
  { label: 'Women', filter: 'Women', icon: 'women' },
  { label: 'Unisex', filter: 'Unisex', icon: 'unisex' },
  { label: 'Attar', filter: 'Attar', icon: 'attar' },
];

const COLLECTIONS = [
  { title: 'Perfume Spray', sub: 'Every spray, a mood', img: '/products/ira-card.webp', filter: 'All' },
  { title: 'Roll-On Attar', sub: 'Pure oils, no alcohol', img: '/products/rose-elixir-card.webp', filter: 'Attar' },
  { title: 'Gift Sets', sub: 'Boxed & ready to gift', img: '/products/romantic-dance-card.webp', filter: 'All' },
];

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function GenderIcon({ type }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const c = 'h-[22px] w-[22px] md:h-7 md:w-7';
  if (type === 'men')
    return (<svg viewBox="0 0 24 24" className={c}><circle cx="9.5" cy="14.5" r="6" {...stroke} /><path d="M13.5 10.5l6-6M14.5 4.5h5v5" {...stroke} /></svg>);
  if (type === 'women')
    return (<svg viewBox="0 0 24 24" className={c}><circle cx="12" cy="9" r="6" {...stroke} /><path d="M12 15v7M8.5 19h7" {...stroke} /></svg>);
  if (type === 'unisex')
    return (<svg viewBox="0 0 24 24" className={c}><circle cx="11" cy="11" r="5.5" {...stroke} /><path d="M15 7l5-5M16 2h4v4M11 16.5V22M8 19.5h6" {...stroke} /></svg>);
  return (<svg viewBox="0 0 24 24" className={c}><path d="M10 2.5h4v3.5h-4z" {...stroke} /><path d="M8.5 7h7l2 4v8.5A2.5 2.5 0 0115 22H9a2.5 2.5 0 01-2.5-2.5V11z" {...stroke} /></svg>);
}

const pickCategory = (filter) => window.dispatchEvent(new CustomEvent('rupur:category', { detail: filter }));

function SafeImg({ src, alt, className = '', eager = false }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <div className={`${className} bg-ink-soft`} role="img" aria-label={alt} />;
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setOk(false)} className={className} />;
}

function Ornament({ className = '' }) {
  return (
    <span aria-hidden className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/60" />
      <svg viewBox="0 0 12 12" className="h-1.5 w-1.5 text-gold"><path d="M6 0l1.6 4.4L12 6 7.6 7.6 6 12 4.4 7.6 0 6l4.4-1.6z" fill="currentColor" /></svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/60" />
    </span>
  );
}

export default function Hero() {
  const [chipsRef, chipsIn] = useReveal();
  const [cardsRef, cardsIn] = useReveal();
  const [trustRef, trustIn] = useReveal();
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const textRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const frame = frameRef.current;
      if (!frame) return;
      const h = frame.offsetHeight || 1;
      const p = Math.min(Math.max(window.scrollY / (h * 0.9), 0), 1);
      const ease = 1 - Math.pow(1 - p, 2);
      const mobile = window.innerWidth < 768;
      frame.style.transform = `scale(${1 - ease * (mobile ? 0.06 : 0.1)})`;
      frame.style.borderRadius = `${ease * (mobile ? 24 : 36)}px`;
      if (videoRef.current) videoRef.current.style.transform = `scale(${1 + ease * 0.18}) translateY(${ease * 4}%)`;
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${-ease * 90}px)`;
        textRef.current.style.opacity = `${Math.max(1 - p * 1.6, 0)}`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <section id="home" className="relative bg-ink pt-16 text-cream md:pt-20 overflow-hidden font-sans">
      {/* Background Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[700px]"
        style={{ background: 'radial-gradient(55% 45% at 50% 0%, rgba(176,141,87,0.22), transparent 70%)' }} />

      {/* ============ VIDEO ============ */}
      <div
        ref={frameRef}
        className="banner-in grain relative h-[80svh] min-h-[500px] w-full origin-top overflow-hidden bg-ink will-change-transform md:h-[calc(100svh-80px)] md:min-h-[580px]"
      >
        <video
          ref={videoRef}
          src={VIDEO}
          poster={POSTER}
          autoPlay muted loop playsInline preload="auto"
          aria-label="RUPUR perfume video"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
        />

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/5" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px 40px rgba(0,0,0,0.6)' }} />

        {/* Text block - Modern & Professional */}
        <div ref={textRef} className="absolute inset-x-0 bottom-12 z-10 flex flex-col items-center px-6 text-center will-change-transform md:bottom-20">
          
          {/* Top Eyebrow with Lines */}
          <div className="rise flex items-center justify-center gap-4" style={{ animationDelay: '150ms' }}>
            <span className="h-px w-6 md:w-8 bg-gold/50" />
            <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.5em] text-white md:text-[11px] md:tracking-[0.7em]">
              Maison de Parfum
            </span>
            <span className="h-px w-6 md:w-8 bg-gold/50" />
          </div>

          {/* Premium Bold Typography */}
          <span className="mt-5 block overflow-hidden">
            <span
              className="rise block text-[58px] leading-[0.9] tracking-[0.06em] md:text-[105px] text-gold-gradient font-semibold"
              style={{ 
                animationDelay: '250ms',
                fontFamily: "'Playfair Display', serif"
              }}
            >
              {HERO.title}
            </span>
          </span>

          {/* Elegant Italic Tagline */}
          <span className="block overflow-hidden mt-3">
            <span 
              className="rise block font-serif italic text-[20px] text-cream/90 md:text-[30px]" 
              style={{ animationDelay: '400ms' }}
            >
              {HERO.tagline}
            </span>
          </span>

          <div className="rise mt-6 md:mt-8" style={{ animationDelay: '480ms' }}>
            <Ornament />
          </div>

          {/* Buttons */}
          <div className="mt-8 flex w-full max-w-[400px] gap-3 md:mt-10">
            {/* Primary Button */}
            <a
              href={HERO.primary.href}
              onClick={() => pickCategory('All')}
              className="pop btn-shine group relative grid h-[50px] md:h-[54px] flex-1 place-items-center overflow-hidden rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-ink shadow-[0_14px_44px_-14px_#B08D57] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_54px_-16px_#B08D57] active:scale-[.97]"
              style={{
                animationDelay: '550ms',
                background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)',
              }}
            >
              <span className="relative z-10">{HERO.primary.label}</span>
            </a>

            {/* Secondary Button */}
            <a
              href={HERO.secondary.href}
              className="pop glass grid h-[50px] md:h-[54px] flex-1 place-items-center rounded-full border border-white/20 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold active:scale-[.97]"
              style={{ animationDelay: '650ms' }}
            >
              {HERO.secondary.label}
            </a>
          </div>
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          className="glass absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full text-cream transition-all hover:border-gold/60 md:right-6 md:top-6"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
            {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />}
          </svg>
        </button>
      </div>

      {/* Trust row (mobile) */}
      <div
        ref={trustRef}
        className="relative mx-5 mt-8 grid grid-cols-3 divide-x divide-gold/15 overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-white/[0.04] to-transparent py-5 backdrop-blur md:hidden"
      >
        {TRUST.map((x, i) => (
          <div
            key={x.t}
            className={`flex flex-col items-center gap-1.5 px-1 text-center transition-all duration-700 ease-luxe ${trustIn ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
            style={{ transitionDelay: trustIn ? `${i * 120}ms` : '0ms' }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={x.d} className="text-gold" /></svg>
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] leading-none text-cream">{x.t}</span>
            <span className="text-[10px] uppercase tracking-[0.15em] leading-none text-mist">{x.s}</span>
          </div>
        ))}
      </div>

      {/* ============ CATEGORY + COLLECTIONS ============ */}
      <div className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[80%] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, rgba(176,141,87,0.22), transparent 70%)' }} />

        <div ref={chipsRef} className="relative mx-auto max-w-[1100px] px-5 md:px-8">
          <span className={`mx-auto mb-4 block text-center eyebrow transition-all delay-100 duration-700 ${chipsIn ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            — Curated for you —
          </span>
          <h2 className="overflow-hidden text-center text-[32px] leading-[1.05] tracking-[0.02em] text-cream md:text-[48px]">
            <span className={`block pb-2 transition-transform duration-[900ms] ease-luxe ${chipsIn ? 'translate-y-0' : 'translate-y-full'}`}>
              Shop by <span className="italic font-light text-gold">category</span>
            </span>
          </h2>
          <p className={`mt-3 text-center text-[12px] uppercase tracking-[0.3em] text-mist transition-all delay-200 duration-700 md:text-[13px] ${chipsIn ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            Pick what suits you
          </p>
          <div className={`mt-6 transition-all delay-300 duration-1000 ${chipsIn ? 'scale-100 opacity-100' : 'scale-x-0 opacity-0'}`}>
            <Ornament />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-4 md:gap-4">
            {CATEGORIES.map((c, i) => (
              <a
                key={c.label}
                href="#shop"
                onClick={() => pickCategory(c.filter)}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-ink-line bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-all ease-luxe hover:border-gold/50 hover:from-white/[0.08] active:scale-[.98] md:flex-col md:gap-5 md:p-8 ${
                  chipsIn ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'
                }`}
                style={{ transitionDelay: chipsIn ? `${350 + i * 110}ms` : '0ms', transitionDuration: '800ms' }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/0 transition-all duration-500 group-hover:ring-gold/40" />
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/10 text-gold ring-1 ring-inset ring-gold/20 transition-all duration-500 group-hover:bg-gold group-hover:text-ink group-hover:ring-transparent md:h-[68px] md:w-[68px]">
                  <GenderIcon type={c.icon} />
                </span>
                <span className="flex flex-col items-start gap-1 md:items-center">
                  <span className="text-[15px] font-medium tracking-[0.08em] text-cream transition-colors group-hover:text-gold-light md:text-[17px]">{c.label}</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-mist md:text-[10px]">Explore</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="relative mx-auto mt-16 max-w-[1500px] md:mt-24">
          <div className="mb-6 flex items-end justify-between px-5 md:hidden">
            <h3 className="text-2xl text-cream">Our <span className="italic text-gold">collections</span></h3>
            <a href="#shop" onClick={() => pickCategory('All')} className="pb-1 text-xs uppercase tracking-[0.2em] text-gold">View all</a>
          </div>
          <div
            ref={cardsRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {COLLECTIONS.map((c, i) => (
              <a
                key={c.title}
                href="#shop"
                onClick={() => pickCategory(c.filter)}
                className="card group relative block aspect-[4/5] w-[80%] shrink-0 snap-center overflow-hidden rounded-[26px] bg-ink-soft transition-[clip-path,transform] duration-[1300ms] ease-luxe hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.95)] md:aspect-[4/3.3] md:w-auto"
                style={{
                  clipPath: cardsIn ? 'inset(0% 0% 0% 0% round 26px)' : 'inset(50% 0% 50% 0% round 26px)',
                  transitionDelay: cardsIn ? `${i * 180}ms` : '0ms',
                }}
              >
                <SafeImg
                  src={c.img}
                  alt={c.title}
                  className={`h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-110 ${cardsIn ? 'scale-100' : 'scale-[1.4]'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-gold/50" />
                
                <span className="absolute left-5 top-5 z-10 text-[10px] uppercase tracking-[0.35em] text-white/50">
                  0{i + 1}
                </span>
                
                <div
                  className={`absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 transition-all duration-1000 ease-luxe ${cardsIn ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
                  style={{ transitionDelay: cardsIn ? `${700 + i * 180}ms` : '0ms' }}
                >
                  <div>
                    <h3 className="text-[24px] leading-none tracking-[0.01em] text-cream md:text-[28px]">{c.title}</h3>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gold-pale/85">{c.sub}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink shadow-[0_10px_30px_-8px_rgba(176,141,87,0.6)] transition-transform duration-500 group-hover:translate-x-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .banner-in { animation: bannerIn 1s cubic-bezier(.19,1,.22,1) both; }
        @keyframes bannerIn { from { opacity: 0; } to { opacity: 1; } }
        .rise { animation: rise .9s cubic-bezier(.19,1,.22,1) both; }
        @keyframes rise { from { transform: translateY(110%); } to { transform: none; } }
        .pop { animation: pop .7s cubic-bezier(.3,1.4,.5,1) both; }
        @keyframes pop { from { opacity: 0; transform: translateY(24px) scale(.94); } to { opacity: 1; transform: none; } }
        .btn-shine::after {
          content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.4), transparent);
          transform: skewX(-20deg); animation: shine 3.4s 1.2s ease-in-out infinite;
        }
        @keyframes shine { 0%, 65% { left: -60%; } 100% { left: 130%; } }
      `}</style>
    </section>
  );
}

