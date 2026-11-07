import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../data/products';
import { useCart } from '../context/CartContext';

gsap.registerPlugin(ScrollTrigger);

// Products ab backend se aate hain: backend/data/products.json (naya product wahan jodo)

const FILTERS = ['All', 'Men', 'Women', 'Unisex', 'Attar'];
// Men / Women / Unisex me sirf perfumes, attars apne 'Attar' tab me
const match = (p, f) => (f === 'All' ? true : f === 'Attar' ? p.type === 'Attar' : p.type !== 'Attar' && p.gender === f);
const isAttar = (p) => p.type === 'Attar';
const COUNT_WORDS = ['Our', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const HEADINGS = {
  All: ['Our', 'Signatures'],
  Men: ['For', 'him'],
  Women: ['For', 'her'],
  Unisex: ['For', 'everyone'],
  Attar: ['Roll-on', 'attars'],
};

const WHATSAPP = '919713620850'; // sirf sawaal-jawab ke liye, order website se hota hai
const GOLD = '#B08D57';
const INK = '#1A1A1A';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ======================= Card Component ======================= */
function Card({ p, index, onOpen, isLarge }) {
  const cardRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!window.matchMedia('(pointer: fine)').matches || reduceMotion()) return;

    gsap.set(card, { transformPerspective: 1000 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const ix = gsap.quickTo(imgRef.current, 'x', { duration: 0.8, ease: 'power3.out' });
    const iy = gsap.quickTo(imgRef.current, 'y', { duration: 0.8, ease: 'power3.out' });

    const move = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      ry(x * 10);
      rx(-y * 8);
      ix(-x * 15); 
      iy(-y * 15);
      card.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
      card.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    };
    const leave = () => { rx(0); ry(0); ix(0); iy(0); };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    return () => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onOpen(index, cardRef.current)}
      className={`shop-card group relative flex flex-col w-full rounded-3xl border border-[#1A1A1A]/5 bg-white p-4 text-left shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-shadow duration-500 [transform-style:preserve-3d] hover:shadow-[0_35px_70px_-20px_rgba(176,141,87,0.35)] ${isLarge ? 'h-full' : ''}`}
    >
      <div className={`relative mb-6 overflow-hidden rounded-2xl ${isLarge ? 'aspect-[4/3] flex-grow' : 'aspect-[4/3]'}`} style={{ backgroundColor: `${p.accent}14` }}>
        <img
          ref={imgRef}
          src={p.img}
          alt={p.name}
          loading="lazy"
          className="h-full w-full scale-[1.12] object-cover transition-[filter] duration-700 group-hover:brightness-105"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.75), transparent 55%)' }}
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/85 px-4 py-1.5 text-[10px] font-medium tracking-[0.15em] text-[#1A1A1A]/70 backdrop-blur-md">
          {p.size.replace(' ', '')} · {isAttar(p) ? 'Attar' : 'EDP'}
        </span>
        {p.soldOut ? (
          <span className="absolute right-4 top-4 rounded-full bg-[#1A1A1A] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">Sold out</span>
        ) : (
          <span className="absolute right-4 top-4 rounded-full bg-[#E8562A] px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-white">
            {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
          </span>
        )}
        <span className="absolute inset-x-4 bottom-4 flex translate-y-[140%] items-center justify-between rounded-full bg-[#1A1A1A]/85 px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-white backdrop-blur-md transition-transform duration-500 group-hover:translate-y-0">
          Discover
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
        </span>
      </div>

      <div className="px-2 pb-2 [transform:translateZ(30px)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full transition-transform duration-500 group-hover:scale-150" style={{ backgroundColor: p.accent }} />
            <h3 className={`font-serif text-[#1A1A1A] ${isLarge ? 'text-2xl' : 'text-xl'}`}>{p.name}</h3>
          </div>
          <span className="rounded-full border border-[#1A1A1A]/10 px-3 py-1 text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">{isAttar(p) ? 'Roll-on' : p.gender}</span>
        </div>
        <p className="ml-5 text-sm text-[#1A1A1A]/55">{p.desc}</p>
        <p className="ml-5 mt-3">
          <span className="text-lg font-semibold text-[#1A1A1A]">₹{p.price}</span>
          <span className="ml-2 text-sm text-[#1A1A1A]/40 line-through">₹{p.mrp}</span>
        </p>
      </div>
    </button>
  );
}

/* ======================= Full View (Modal) ======================= */
function FullView({ items, index, originEl, onClose, onChange }) {
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const p = items[index];
  const closing = useRef(false);
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0); // kaunsi photo dikh rahi hai
  useEffect(() => { setQty(1); setShot(0); }, [index]);
  const imgs = p.images && p.images.length ? p.images : [p.img];
  const src = imgs[Math.min(shot, imgs.length - 1)];
  const firstRun = useRef(true);

  useLayoutEffect(() => {
    const r = originEl.getBoundingClientRect();
    const ctx = gsap.context(() => {
      if (reduceMotion()) return;
      gsap.set('.fv-in', { opacity: 0, y: 40 });
      gsap.set('.fv-img', { scale: 1.25 });
      gsap.timeline({ defaults: { ease: 'expo.inOut' } })
        .fromTo('.fv-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(panelRef.current, { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 24 }, { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0, duration: 1 }, 0)
        .to('.fv-img', { scale: 1, duration: 1.4, ease: 'expo.out' }, 0.3)
        .to('.fv-in', { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0.6);
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (reduceMotion()) return;
    gsap.fromTo(wrapRef.current.querySelectorAll('.fv-swap'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
  }, [index]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion()) return onClose();
    const target = document.querySelectorAll('.shop-card')[index] || originEl;
    const r = target.getBoundingClientRect();
    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: onClose })
      .to(wrapRef.current.querySelectorAll('.fv-in, .fv-swap'), { opacity: 0, y: 20, duration: 0.35, ease: 'power2.in' }, 0)
      .to(panelRef.current, { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 24, duration: 0.9 }, 0.15)
      .to(wrapRef.current.querySelector('.fv-backdrop'), { opacity: 0, duration: 0.5 }, 0.5);
  }, [onClose, originEl, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') onChange(1);
      if (e.key === 'ArrowLeft') onChange(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [close, onChange]);

  const addToCart = () => add(p.id, qty, `${qty} × ${p.name}`);
  const buyNow = () => { add(p.id, qty); navigate('/cart'); };

  return createPortal(
    <div ref={wrapRef} className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" data-lenis-prevent>
      <div className="fv-backdrop absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-sm" onClick={close} />
      <div ref={panelRef} className="absolute inset-0 overflow-y-auto transition-[background-color] duration-700" style={{ backgroundColor: CREAM_FOR(p.accent) }}>
        <div className="grid min-h-full lg:grid-cols-2">
          <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:min-h-full" style={{ backgroundColor: `${p.accent}22` }}>
            <img key={src} src={src} alt={p.name} className="fv-img fv-swap absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            <span className="fv-in absolute bottom-6 left-6 font-serif text-[18vw] leading-none text-white/15 lg:text-[10vw]">{String(index + 1).padStart(2, '0')}</span>
            {imgs.length > 1 && (
              <div className="fv-in absolute bottom-5 right-5 flex gap-2">
                {imgs.map((im, i) => (
                  <button key={im} type="button" onClick={() => setShot(i)} aria-label={`Photo ${i + 1}`}
                    className={`h-14 w-11 overflow-hidden rounded-lg border-2 transition ${i === shot ? 'border-white' : 'border-white/30 opacity-70 hover:opacity-100'}`}>
                    <img src={im} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-16 lg:py-14">
            <div className="flex items-center justify-between">
              <span className="fv-in flex items-center gap-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                <span className="h-px w-8" style={{ backgroundColor: GOLD }} />
                {isAttar(p) ? 'Attar' : p.gender} · {index + 1}/{items.length}
              </span>
              <button onClick={close} className="fv-in group flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A1A]/15 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors duration-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="my-14">
              <div className="fv-swap flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.accent }} /><span className="text-xs uppercase tracking-[0.25em] text-[#1A1A1A]/50">{isAttar(p) ? `Attar roll-on · ${p.size} · Alcohol free` : `Eau de Parfum · ${p.size}`}</span></div>
              <h2 className="fv-swap mt-5 font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] text-[#1A1A1A]">{p.name}</h2>
              <p className="fv-swap mt-6 max-w-md font-serif text-2xl italic" style={{ color: p.accent }}>{p.desc}.</p>
              <p className="fv-swap mt-6 max-w-md text-[15px] leading-relaxed text-[#1A1A1A]/65">{p.story || (isAttar(p) ? 'Pure perfume oil in a roll-on, free from alcohol. A little goes a long way on pulse points.' : 'Slow-steeped with botanicals, traditional attars and aged sandalwood oil — built to evolve on pulse points.')}</p>
              {p.notes && p.notes.length > 0 && (
                <div className="fv-swap mt-5 flex max-w-md flex-wrap gap-2">
                  {p.notes.map((n) => (
                    <span key={n} className="rounded-full border border-[#1A1A1A]/12 bg-white/60 px-3.5 py-1.5 text-xs text-[#1A1A1A]/70">{n}</span>
                  ))}
                </div>
              )}
              <p className="fv-swap mt-6 flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-[#1A1A1A]">₹{p.price}</span>
                <span className="text-lg text-[#1A1A1A]/40 line-through">₹{p.mrp}</span>
                {!p.soldOut && <span className="rounded-full bg-[#E8562A] px-3 py-1 text-sm font-semibold text-white">{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</span>}
              </p>
              <p className="fv-swap mt-2 text-sm text-[#1A1A1A]/50">Free shipping above ₹999 · No taxes added · Secure online payment</p>
              {p.soldOut ? (
                <div className="fv-swap mt-10 inline-flex items-center gap-3 rounded-full bg-[#1A1A1A]/10 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]/60">
                  Sold out right now
                </div>
              ) : (
                <div className="fv-swap mt-10 flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-12 items-center rounded-full border border-[#1A1A1A]/15 bg-white/60">
                    <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Decrease quantity" className="h-12 w-11 text-lg text-[#1A1A1A]">−</button>
                    <span className="w-6 text-center text-sm tabular-nums text-[#1A1A1A]" aria-live="polite">{qty}</span>
                    <button type="button" onClick={() => setQty((n) => Math.min(10, n + 1))} aria-label="Increase quantity" className="h-12 w-11 text-lg text-[#1A1A1A]">+</button>
                  </div>
                  <button type="button" onClick={addToCart} className="h-12 rounded-full bg-[#1A1A1A] px-7 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-500 hover:bg-[#B08D57]">
                    Add to cart
                  </button>
                  <button type="button" onClick={buyNow} className="group inline-flex h-12 items-center gap-3 rounded-full py-1.5 pl-7 pr-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#1A1A1A] transition hover:brightness-105" style={{ background: 'linear-gradient(135deg, #E8D3A8 0%, #B08D57 100%)' }}>
                    Buy now
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-white"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CREAM_FOR(hex) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c * 0.08 + 248 * 0.92);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

/* ======================= Main Shop Section ======================= */
export default function Shop() {
  const sectionRef = useRef(null);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('All');
  const [changed, setChanged] = useState(false); // pehli baar filter badla?
  const { products: PERFUMES } = useProducts();
  const list = PERFUMES.filter((p) => match(p, filter));

  // Home page ke Men / Women / Unisex / Attar buttons yahan ka filter badalte hain
  useEffect(() => {
    const onCat = (e) => {
      if (FILTERS.includes(e.detail)) { setFilter(e.detail); setChanged(true); setOpen(null); }
    };
    window.addEventListener('rupur:category', onCat);
    return () => window.removeEventListener('rupur:category', onCat);
  }, []);

  const pick = (f) => { setFilter(f); setChanged(true); setOpen(null); };

  useLayoutEffect(() => {
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set('.shop-eyebrow, .shop-sub', { opacity: 0, y: 24 });
      gsap.set('.shop-word', { yPercent: 110 });
      gsap.set('.shop-card-wrap', { opacity: 0, y: 90, rotationX: 25, transformPerspective: 1200, transformOrigin: '50% 100%' });

      gsap.timeline({ defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } })
        .to('.shop-eyebrow', { opacity: 1, y: 0, duration: 1 })
        .to('.shop-word', { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.1)
        .to('.shop-sub', { opacity: 1, y: 0, duration: 1 }, 0.4)
        .to('.shop-card-wrap', { opacity: 1, y: 0, rotationX: 0, duration: 1.4, stagger: 0.12, clearProps: 'transform' }, 0.35);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const openCard = (index, el) => setOpen({ index, el });
  const change = useCallback((d) => setOpen((o) => o && { ...o, index: (o.index + d + list.length) % list.length }), [list.length]);

  return (
    <section id="shop" ref={sectionRef} className="relative z-20 min-h-screen overflow-hidden bg-[#F8F5EE] py-24 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.5)] lg:py-32">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-[30rem] w-[30rem] rounded-full blur-[120px]" style={{ backgroundColor: GOLD, opacity: 0.1 }} />

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-20">
        
        {/* Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="shop-eyebrow mb-4 flex items-center gap-4">
              <span className="h-px w-8" style={{ backgroundColor: GOLD }} />
              <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: GOLD }}>The Collection</span>
            </div>
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl" style={{ color: INK }}>
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span className="shop-word inline-block">{filter === 'All' ? COUNT_WORDS[PERFUMES.length] || HEADINGS.All[0] : HEADINGS[filter][0]}</span>
              </span>{' '}
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span className="shop-word inline-block italic" style={{ color: GOLD }}>{HEADINGS[filter][1]}</span>
              </span>
            </h2>
          </div>
          <p className="shop-sub max-w-sm text-sm leading-relaxed text-[#1A1A1A]/55 lg:text-right">
            Every scent has its own world. Tap a bottle to see the details and add it to your cart.
          </p>
        </div>

        {/* Filter tabs */}
        <div role="tablist" aria-label="Filter perfumes" className="-mx-6 mb-10 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={f === filter}
              onClick={() => pick(f)}
              className={`shrink-0 rounded-full px-6 py-2.5 text-sm transition-all duration-300 ${
                f === filter
                  ? 'bg-[#1A1A1A] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,.5)]'
                  : 'border border-[#1A1A1A]/15 text-[#1A1A1A]/70 hover:border-[#B08D57] hover:text-[#1A1A1A]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid: "All" me 2 upar + 3 neeche, baaki filters me simple grid */}
        <div key={filter} className="grid grid-cols-6 gap-6 lg:gap-8">
          {list.map((p, i) => {
            const big = filter === 'All' ? i < 2 : list.length <= 2;
            return (
              <div
                key={p.id}
                className={`shop-card-wrap col-span-6 ${changed ? 'filter-in' : ''} ${big ? 'md:col-span-3' : 'md:col-span-2'}`}
                style={changed ? { animationDelay: `${i * 110}ms` } : undefined}
              >
                <Card p={p} index={i} onOpen={openCard} isLarge={big} />
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <div className="filter-in mx-auto max-w-md rounded-3xl border border-[#1A1A1A]/10 bg-white p-10 text-center">
            <p className="font-serif text-3xl text-[#1A1A1A]">Coming soon</p>
            <p className="mt-3 text-sm text-[#1A1A1A]/60">Our roll-on attars are on their way. Ask us on WhatsApp to know first.</p>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Rupur, I want to know about your roll-on attars.')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-full bg-[#1A1A1A] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B08D57]"
            >
              Ask on WhatsApp
            </a>
          </div>
        )}

      </div>

      {open && (
        <FullView items={list} index={open.index} originEl={open.el} onClose={() => setOpen(null)} onChange={change} />
      )}
      <style>{`
        .filter-in { animation: filterIn .7s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes filterIn { from { opacity: 0; transform: translateY(30px) scale(.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .filter-in { animation: none; } }
      `}</style>
    </section>
  );
}