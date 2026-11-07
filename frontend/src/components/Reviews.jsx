import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REVIEWS = [
  { name: 'Aarav', scent: 'Romantic Dance', text: 'Lasted from evening till the next morning. Everyone asked what I was wearing.' },
  { name: 'Priya', scent: 'Sea Faze', text: 'Feels like the first breeze at the beach. Fresh, clean and perfect for summer days.' },
  { name: 'Rahul', scent: 'Giraft', text: 'Bold and dark. The bottle with the gold cap looks premium on my shelf.' },
  { name: 'Sneha', scent: 'Ira', text: 'Soft and floral without being too sweet. I wear it to every family function.' },
  { name: 'Vikram', scent: 'Dhaval', text: 'My daily office perfume. Clean, woody and it stays on the collar all day.' },
];

const CREAM = '#F8F5EE';
const INK = '#1A1A1A';
const GOLD = '#B08D57';

export default function Reviews() {
  const sectionRef = useRef(null);

  /* ================= 1. Entrance Animations (Header Only) ================= */
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;

      gsap.set('.rv-eyebrow', { opacity: 0, x: -20 });
      gsap.set('.rv-word', { yPercent: 110 });
      gsap.set('.rv-sub', { opacity: 0, y: 24 });
      gsap.set('.rv-line', { scaleX: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
      });

      tl.to('.rv-eyebrow', { opacity: 1, x: 0, duration: 1 })
        .to('.rv-word', { yPercent: 0, duration: 1.3, stagger: 0.08 }, 0.1)
        .to('.rv-sub', { opacity: 1, y: 0, duration: 1 }, 0.45)
        .to('.rv-line', { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0.4);

      // Background text parallax
      gsap.fromTo('.rv-bgword', { xPercent: 8 }, {
        xPercent: -18, ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="relative z-30 overflow-hidden py-28 lg:py-36"
      style={{ backgroundColor: CREAM }}
    >
      {/* CSS for Infinite Marquee */}
      <style>{`
        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: infinite-scroll 35s linear infinite;
        }
        /* Hover karne par animation pause */
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* Background Text & Glow */}
      <div
        aria-hidden
        className="rv-bgword pointer-events-none absolute left-0 top-10 select-none whitespace-nowrap font-serif text-[20vw] leading-none tracking-[0.05em]"
        style={{ color: 'transparent', WebkitTextStroke: `1px ${GOLD}22` }}
      >
        RUPUR · RUPUR
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full blur-[120px]"
        style={{ backgroundColor: GOLD, opacity: 0.15 }}
      />

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-20">
        
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="rv-eyebrow flex items-center gap-4">
              <span className="h-px w-10" style={{ backgroundColor: GOLD }} />
              <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                Testimonials
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl leading-[1.05] md:text-5xl lg:text-6xl" style={{ color: INK }}>
              <span className="mr-[0.25em] inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span className="rv-word inline-block">150+</span>
              </span>
              <span className="mr-[0.25em] inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span className="rv-word inline-block italic" style={{ color: GOLD }}>five-star</span>
              </span>
              <span className="mr-[0.25em] inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span className="rv-word inline-block">reviews</span>
              </span>
            </h2>
            <p className="rv-sub mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: `${INK}99` }}>
              Real words from people who wear Rupur every day. <span className="italic font-semibold text-[#B08D57]">(Hover to pause)</span>
            </p>
          </div>
        </div>

        {/* Line */}
        <div className="rv-line relative mt-12 h-px w-full origin-left" style={{ backgroundColor: `${INK}14` }} />
      </div>

      {/* Infinite Marquee Container */}
      <div className="relative mt-10 w-full overflow-hidden marquee-container">
        
        {/* Side Fade Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-48 bg-gradient-to-r from-[#F8F5EE] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-48 bg-gradient-to-l from-[#F8F5EE] to-transparent z-10 pointer-events-none" />

        {/* Marquee Track */}
        <div className="animate-marquee flex w-max gap-6 px-6 pb-12 pt-4">
          {/* List ko 2 baar render karna zaroori hai taaki loop bane */}
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <article
              key={i}
              className="group relative flex w-[300px] sm:w-[400px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#1A1A1A]/5 bg-white p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_24px_50px_-10px_rgba(176,141,87,0.25)] hover:border-[#B08D57]/30"
            >
              {/* Hover Gold Line top */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[#B08D57] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="font-serif text-6xl leading-none text-[#B08D57]/20 transition-colors duration-500 group-hover:text-[#B08D57]/40">“</span>
                  <span className="mt-2 flex gap-1 text-sm" style={{ color: GOLD }} aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((s) => <span key={s}>★</span>)}
                  </span>
                </div>
                <p className="mt-5 font-serif text-lg leading-relaxed md:text-xl" style={{ color: `${INK}CC` }}>
                  {r.text}
                </p>
              </div>

              <div className="relative mt-10 flex items-center gap-4 border-t border-[#1A1A1A]/10 pt-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B08D57]/25 bg-[#F8F5EE] text-[#B08D57] font-serif text-xl transition-colors duration-500 group-hover:bg-[#B08D57] group-hover:text-white">
                  {r.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: INK }}>{r.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>{r.scent}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}