import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMG_BASE = 'https://idyllic-tarsier-20717f.netlify.app';

const GOLD = '#B08D57';
const INK = '#1A1A1A';

const PHOTOS = [
  {
    src: '/img/romantic-poster.webp',
    name: 'Romantic Dance',
    line: 'Candle-lit, rose-warm evenings',
    className: 'left-0 top-[6%] h-[72%] w-[62%] z-10',
    depth: 20,
    speed: -40,
  },
  {
    src: '/img/ira.webp',
    name: 'ईरा · Ira',
    line: 'A garden of soft florals',
    className: 'right-0 top-0 h-[46%] w-[48%] z-20',
    depth: 70,
    speed: -90,
  },
  {
    src: '/img/seafaze.webp',
    name: 'Sea Faze',
    line: 'Salt air and a cool breeze',
    className: 'bottom-[2%] right-[6%] h-[44%] w-[52%] z-30',
    depth: 120,
    speed: 30,
  },
];

const PILLARS = [
  { title: 'Slow-steeped', text: 'Botanicals rested until the blend settles' },
  { title: 'Traditional Attars', text: 'The heritage of Indian perfumery' },
  { title: 'Aged Sandalwood', text: 'A warm base that evolves on pulse points' },
];

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function PhotoView({ index, originEl, onClose, onChange }) {
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const closing = useRef(false);
  const firstRun = useRef(true);
  const p = PHOTOS[index];

  useLayoutEffect(() => {
    const r = originEl.getBoundingClientRect();
    const ctx = gsap.context(() => {
      if (reduceMotion()) return;
      gsap.set('.pv-in', { opacity: 0, y: 30 });
      gsap.timeline({ defaults: { ease: 'expo.inOut' } })
        .fromTo('.pv-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(panelRef.current, { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 16 }, { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0, duration: 1 }, 0)
        .to('.pv-in', { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.65);
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (reduceMotion()) return;
    gsap.fromTo(wrapRef.current.querySelectorAll('.pv-swap'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
  }, [index]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion()) return onClose();
    const target = document.querySelectorAll('.story-photo')[index] || originEl;
    const r = target.getBoundingClientRect();
    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: onClose })
      .to(wrapRef.current.querySelectorAll('.pv-in, .pv-swap:not(img)'), { opacity: 0, y: 16, duration: 0.3, ease: 'power2.in' }, 0)
      .to(panelRef.current, { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 16, duration: 0.9 }, 0.1)
      .to(wrapRef.current.querySelector('.pv-backdrop'), { opacity: 0, duration: 0.5 }, 0.5);
  }, [index, onClose, originEl]);

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

  return createPortal(
    <div ref={wrapRef} className="fixed inset-0 z-[200]" role="dialog" data-lenis-prevent>
      <div className="pv-backdrop absolute inset-0 bg-[#0A0A0A]/70 backdrop-blur-sm" onClick={close} />
      <div ref={panelRef} className="absolute inset-0 overflow-hidden bg-[#0A0A0A]">
        <img key={p.src} src={IMG_BASE + p.src} alt={p.name} className="pv-swap absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 lg:p-10">
          <span className="pv-in flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[#E8D3A8]"><span className="h-px w-8 bg-[#E8D3A8]" />Our Story · {index + 1}/{PHOTOS.length}</span>
          <button type="button" onClick={close} className="pv-in group flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur-md transition-colors duration-500 hover:bg-white hover:text-black">
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-8 p-6 lg:p-10">
          <div>
            <h2 className="pv-swap font-serif text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.95] text-white">{p.name}</h2>
            <p className="pv-swap mt-4 font-serif text-xl italic text-[#E8D3A8] md:text-2xl">{p.line}.</p>
          </div>
          <div className="pv-in flex gap-3">
            {[-1, 1].map((d) => (
              <button key={d} type="button" onClick={() => onChange(d)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur-md transition-colors duration-500 hover:bg-white hover:text-black">
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${d < 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Story() {
  const sectionRef = useRef(null);
  const tiltRef = useRef(null);
  const countRef = useRef(null);
  const [open, setOpen] = useState(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduceMotion()) return;
      gsap.utils.toArray('[data-depth]').forEach((el) => gsap.set(el, { z: Number(el.dataset.depth) }));

      gsap.set('.st-frame', { opacity: 0, scale: 0.92 });
      gsap.set('.st-photo-wrap', { opacity: 0 });
      gsap.set('.st-photo-inner', { clipPath: 'inset(100% 0% 0% 0% round 16px)' });
      gsap.set('.st-photo-img', { scale: 1.3 });
      gsap.set('.st-stat', { opacity: 0, y: 40 });
      gsap.set('.st-eyebrow, .st-fade', { opacity: 0, y: 28 });
      gsap.set('.st-line', { yPercent: 110 });
      gsap.set('.st-pillar-bar', { scaleX: 0 });

      const counter = { v: 0 };
      if (countRef.current) countRef.current.textContent = '0+';

      gsap.timeline({ defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true } })
        .to('.st-frame', { opacity: 1, scale: 1, duration: 1.6 }, 0)
        .to('.st-photo-wrap', { opacity: 1, duration: 0.3, stagger: 0.15 }, 0)
        .to('.st-photo-inner', { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.4, stagger: 0.15 }, 0)
        .to('.st-photo-img', { scale: 1, duration: 1.9, stagger: 0.15 }, 0)
        .to('.st-stat', { opacity: 1, y: 0, duration: 1.1 }, 0.6)
        .to(counter, { v: 1000, duration: 2, ease: 'power3.out', onUpdate: () => countRef.current && (countRef.current.textContent = `${Math.round(counter.v)}+`) }, 0.6)
        .to('.st-eyebrow', { opacity: 1, y: 0, duration: 1 }, 0.1)
        .to('.st-line', { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.15)
        .to('.st-fade', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.45)
        .to('.st-pillar-bar', { scaleX: 1, duration: 1.2, stagger: 0.12, ease: 'power3.inOut' }, 0.9);

      gsap.utils.toArray('[data-speed]').forEach((el) => {
        gsap.to(el, { y: Number(el.dataset.speed), ease: 'none', scrollTrigger: { trigger: tiltRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = tiltRef.current;
    if (!window.matchMedia('(pointer: fine)').matches || reduceMotion()) return;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 12);
      rx((0.5 - y) * 9);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  const change = useCallback((d) => setOpen((o) => o && { ...o, index: (o.index + d + PHOTOS.length) % PHOTOS.length }), []);

  return (
    <section id="story" ref={sectionRef} className="relative z-20 min-h-screen overflow-hidden bg-[#F8F5EE] py-24 text-[#1A1A1A] shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.4)] lg:py-32">
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full blur-[120px]" style={{ backgroundColor: GOLD, opacity: 0.1 }} />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-20">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2 lg:gap-24">
          
          <div className="[perspective:1400px]">
            <div ref={tiltRef} className="group/tilt relative mx-auto h-[480px] w-full max-w-[600px] [transform-style:preserve-3d] md:h-[580px]">
              <div data-depth="-40" className="st-frame absolute left-[4%] top-[2%] h-[82%] w-[66%] rounded-[28px] border border-[#B08D57]/40" />

              {PHOTOS.map((p, i) => (
                <div key={p.src} data-depth={p.depth} data-speed={p.speed} className={`st-photo-wrap absolute ${p.className}`}>
                  <button type="button" onClick={(e) => setOpen({ index: i, el: e.currentTarget })} className="story-photo st-photo-inner group relative block h-full w-full overflow-hidden rounded-2xl shadow-[0_35px_70px_-30px_rgba(60,40,15,0.6)]">
                    <img src={IMG_BASE + p.src} alt={p.name} loading="lazy" className="st-photo-img h-full w-full object-cover transition-[filter] duration-700 group-hover:brightness-110" />
                    <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/tilt:opacity-100" style={{ background: 'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.25), transparent 55%)' }} />
                    <span className="absolute inset-x-3 bottom-3 flex translate-y-[140%] items-center justify-between rounded-full bg-black/55 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md transition-transform duration-500 group-hover:translate-y-0">
                      {p.name}
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    </span>
                  </button>
                </div>
              ))}

              <div data-depth="170" className="st-stat absolute -bottom-4 left-4 z-40 min-w-[200px] rounded-2xl border border-black/5 bg-white p-6 shadow-[0_25px_60px_-20px_rgba(60,40,15,0.35)]">
                <p ref={countRef} className="font-serif text-4xl text-[#B08D57]">1000+</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">Customers tested</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="st-eyebrow mb-6 flex items-center gap-4">
              <span className="h-px w-8" style={{ backgroundColor: GOLD }} />
              <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: GOLD }}>Our Story</span>
            </div>

            <h2 className="mb-8 font-serif text-5xl leading-[1.05] md:text-6xl" style={{ color: INK }}>
              {['More than', 'a scent.'].map((t) => (
                <span key={t} className="block overflow-hidden pb-[0.06em]"><span className="st-line block">{t}</span></span>
              ))}
              <span className="block overflow-hidden pb-[0.06em]"><span className="st-line block italic" style={{ color: GOLD }}>An identity.</span></span>
            </h2>

            <p className="st-fade mb-6 text-lg leading-relaxed text-[#1A1A1A]/75">
              At RUPUR Fragrances, we believe your fragrance should be more than something you wear. It should be something <span className="italic" style={{ color: GOLD }}>you feel</span>.
            </p>

            <blockquote lang="hi" className="st-fade mb-10 border-l-2 py-2 pl-6" style={{ borderColor: GOLD }}>
              <p className="font-serif text-lg italic leading-relaxed text-[#1A1A1A]/65">
                "RUPUR Fragrances में हमारा मानना है कि आपकी fragrance सिर्फ एक खुशबू नहीं होनी चाहिए — वह आपकी पहचान होनी चाहिए।"
              </p>
            </blockquote>

            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              {PILLARS.map((p, i) => (
                <li key={p.title} className="st-fade group cursor-default">
                  <div className="relative h-px w-full bg-[#1A1A1A]/10">
                    <span className="st-pillar-bar absolute inset-y-0 left-0 w-8 origin-left transition-[width] duration-700 group-hover:w-full" style={{ backgroundColor: GOLD }} />
                  </div>
                  <span className="mt-5 block text-[10px] tracking-[0.3em]" style={{ color: GOLD }}>0{i + 1}</span>
                  <h4 className="mt-2 text-xs uppercase tracking-[0.15em] text-[#1A1A1A] transition-colors duration-500 group-hover:text-[#B08D57]">{p.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#1A1A1A]/50">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {open && <PhotoView index={open.index} originEl={open.el} onClose={() => setOpen(null)} onChange={change} />}
    </section>
  );
}