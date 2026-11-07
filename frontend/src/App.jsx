import { useEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Story from './components/Story';
import Shop from './components/Shop';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { PageShell } from './components/ui';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { OrdersPage, OrderDetailPage } from './pages/OrdersPages';
import PolicyPage from './pages/PolicyPage';
import WelcomePopup from './components/WelcomePopup';

gsap.registerPlugin(ScrollTrigger);

const NAV_OFFSET = -90;

function Home() {
  return (
    <>
      <Hero />
      <Shop />
      <Story />
      <Reviews />
      <Contact />
    </>
  );
}

function NotFound() {
  return (
    <PageShell title="Page" accent="not found" sub="This link may be old or typed wrongly.">
      <Link to="/" className="text-gold-light underline">Go to home</Link>
    </PageShell>
  );
}

export default function App() {
  const lenisRef = useRef(null);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  const scrollToHash = (h, smooth = true) => {
    if (h === '#home') {
      lenisRef.current ? lenisRef.current.scrollTo(0, { duration: smooth ? 1.5 : 0, immediate: !smooth }) : window.scrollTo(0, 0);
      return true;
    }
    const target = document.querySelector(h);
    if (!target) return false;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: NAV_OFFSET, duration: smooth ? 1.5 : 0, immediate: !smooth });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + NAV_OFFSET, behavior: smooth ? 'smooth' : 'auto' });
    return true;
  };

  // Page badalne par: #shop jaisa ho toh wahan jao, warna upar
  useEffect(() => {
    if (pathname === '/' && hash) {
      const t = setTimeout(() => scrollToHash(hash, true), 150);
      return () => clearTimeout(t);
    }
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  // #shop, #story jaise links: home pe ho toh scroll, kisi aur page pe ho toh pehle home pe jao
  useEffect(() => {
    const onClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const h = link.getAttribute('href');
      if (!h || h === '#') return;
      e.preventDefault();
      if (window.location.pathname !== '/') {
        navigate('/' + h);
        return;
      }
      setTimeout(() => scrollToHash(h, true), 100);
      window.history.replaceState(null, '', h);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderNo" element={<OrderDetailPage />} />
          <Route path="/:slug" element={<PolicyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WelcomePopup />
    </div>
  );
}
