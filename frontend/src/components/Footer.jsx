import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const EXPLORE = [
  { label: 'Home', href: '#home' },
  { label: 'Shop Collection', href: '#shop' },
  { label: 'Our Story', href: '#story' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'My Orders', to: '/orders' },
];

const POLICIES = [
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Refund & Cancellation', to: '/refund-policy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
];

const SOCIALS = [
  { name: 'Instagram', href: 'https://www.instagram.com/rupurfragnance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
  { name: 'Facebook', href: 'https://www.facebook.com/share/1CCxn5wUML/', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> },
  { name: 'WhatsApp', href: 'https://wa.me/919713620850', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 20.5l1.4-4.2A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1l-4.5 1z"></path><path d="M9 9.5c.3 1.6 1.9 3.4 3.6 4.1.6.2 1.2-.2 1.6-.7l.3-.4 1.6.8c-.2 1-1 1.7-2 1.7-3 0-6-3-6-6 0-1 .7-1.8 1.7-2l.8 1.6-.4.3c-.5.4-.9 1-.7 1.6z"></path></svg> },
];

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.footer-reveal', {
        scrollTrigger: { trigger: footerRef.current, start: 'top 85%' },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power4.out',
      });

      gsap.from('.text-reveal', {
        scrollTrigger: { trigger: footerRef.current, start: 'top 85%' },
        yPercent: 120,
        duration: 1.2,
        stagger: 0.1,
        ease: 'expo.out',
      });

      // Marquee: text 2 baar hai, isliye -50% pe seamless loop banta hai
      gsap.to('.footer-marquee', {
        xPercent: -50,
        repeat: -1,
        duration: 25,
        ease: 'linear',
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] pt-14 text-white md:pt-24"
    >
      {/* Background marquee */}
      <div className="pointer-events-none absolute left-0 top-0 w-full select-none overflow-hidden opacity-[0.04]">
        <div className="footer-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((k) => (
            <span key={k} className="font-serif text-[28vw] leading-none tracking-widest text-white md:text-[20vw]">
              RUPUR • FRAGRANCE •&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Top glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[220px] w-[520px] max-w-full -translate-x-1/2 rounded-full bg-[#B08D57]/10 blur-[100px] md:h-[300px] md:w-[800px]" />

      <div className="relative z-10 mx-auto max-w-[1600px] px-5 md:px-10 lg:px-20">
        {/* ===== CTA ===== */}
        <div className="mb-12 flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 md:mb-24 md:pb-24 lg:flex-row lg:items-end lg:gap-12">
          <div>
            <p className="footer-reveal mb-4 text-xs tracking-[0.3em] text-[#B08D57] md:mb-6 md:tracking-[0.4em]">The Experience</p>
            <h2 className="font-serif text-[40px] leading-[1.1] md:text-7xl lg:text-8xl lg:leading-[1.05]">
              <span className="block overflow-hidden pb-1 md:pb-2">
                <span className="text-reveal block">Ready to find</span>
              </span>
              <span className="block overflow-hidden pb-1 md:pb-2">
                <span className="text-reveal block italic text-[#B08D57]">your signature?</span>
              </span>
            </h2>
          </div>
          <a
            href="#shop"
            className="footer-reveal group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-medium tracking-widest text-black active:scale-[.98] md:inline-flex md:w-auto md:px-10 md:py-5"
          >
            <span className="absolute inset-0 translate-y-full bg-[#B08D57] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0"></span>
            <span className="relative z-10 flex items-center gap-3 transition-colors duration-500 group-hover:text-white">
              Explore Collection
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </a>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="mb-12 grid grid-cols-2 gap-x-6 gap-y-10 md:mb-20 md:grid-cols-12 md:gap-12">
          {/* Brand: mobile pe full width */}
          <div className="footer-reveal col-span-2 md:col-span-5">
            <a href="#home" className="group mb-5 inline-flex flex-col items-start md:mb-8">
              <span className="text-3xl tracking-[0.2em] text-white transition-transform duration-500 group-hover:-translate-y-1 md:text-4xl" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                RUPUR
              </span>
              <span className="mt-2 text-[10px] tracking-[0.35em] text-[#B08D57]">FRAGRANCE YOU FEEL</span>
            </a>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400 md:mb-10">
              Slow-steeped with botanicals, traditional attars, and aged sandalwood. Experience the essence of India in every bottle.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111] text-gray-300 transition-all duration-500 active:scale-95 md:h-12 md:w-12 md:hover:-translate-y-1 md:hover:text-black"
                >
                  <span className="absolute inset-0 scale-0 rounded-full bg-[#B08D57] transition-transform duration-500 ease-out group-hover:scale-100"></span>
                  <span className="relative z-10">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:col-span-2 md:block"></div>

          {/* Explore: mobile pe aadhi width */}
          <div className="footer-reveal md:col-span-2">
            <h4 className="mb-5 text-xs font-semibold tracking-[0.2em] text-white md:mb-6">Explore</h4>
            <ul className="space-y-3 md:space-y-4">
              {EXPLORE.map((l) => {
                const cls = 'group relative inline-block py-1 text-sm text-gray-400 transition-colors hover:text-white';
                const line = <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-[#B08D57] transition-all duration-300 group-hover:w-full"></span>;
                return (
                  <li key={l.label}>
                    {l.to ? <Link to={l.to} className={cls}>{l.label}{line}</Link> : <a href={l.href} className={cls}>{l.label}{line}</a>}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact: mobile pe aadhi width, email wrap hota hai */}
          <div className="footer-reveal md:col-span-3">
            <h4 className="mb-5 text-xs font-semibold tracking-[0.2em] text-white md:mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-400 md:space-y-5">
              <li>
                <span className="mb-1 block text-[10px] tracking-widest text-[#B08D57]">Email</span>
                <a href="mailto:rupurperfumes@gmail.com" className="break-all font-serif text-sm transition-colors hover:text-white md:text-base">rupurperfumes@gmail.com</a>
              </li>
              <li>
                <span className="mb-1 block text-[10px] tracking-widest text-[#B08D57]">Call / WhatsApp</span>
                <a href="tel:+919713620850" className="font-serif text-sm transition-colors hover:text-white md:text-base">+91 97136 20850</a>
              </li>
            </ul>
          </div>

          {/* Address: mobile pe full width */}
          <div className="footer-reveal col-span-2 md:hidden">
            <span className="mb-1 block text-[10px] tracking-widest text-[#B08D57]">Visit</span>
            <p className="text-sm leading-relaxed text-gray-400">In front of Tehsil, Kalapipal Mandi<br />Dist. Shajapur, M.P.</p>
          </div>
        </div>

        {/* ===== BOTTOM BAR ===== */}
        <div className="footer-reveal flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-center md:flex-row md:gap-6 md:pb-8 md:pt-8 md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Rupur Enterprises.</span>
            <span className="hidden md:inline">|</span>
            <span>Made in India 🇮🇳</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            {POLICIES.map((l) => (
              <Link key={l.to} to={l.to} className="py-1 text-xs text-gray-500 transition-colors hover:text-[#B08D57]">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}