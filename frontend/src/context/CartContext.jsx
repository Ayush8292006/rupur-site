import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProducts } from '../data/products';

// Cart browser me save rehta hai (bina login ke bhi). Price hamesha checkout pe server se dobara check hota hai.
const KEY = 'rupur-cart-v1';
const MAX_QTY = 10;
const CartContext = createContext(null);

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && typeof i.id === 'string' && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { products } = useProducts();
  const [items, setItems] = useState(load); // [{ id, qty }]
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage band */ }
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((id, qty = 1, name) => {
    setItems((list) => {
      const found = list.find((i) => i.id === id);
      if (found) return list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      return [...list, { id, qty: Math.min(MAX_QTY, qty) }];
    });
    if (name) setToast(`${name} added to your cart`);
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((list) => (qty <= 0 ? list.filter((i) => i.id !== id) : list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))));
  }, []);

  const remove = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  // Product ki details ke saath lines (jo product ab list me nahi, woh hata do)
  const lines = useMemo(
    () => items.map((i) => ({ ...i, product: products.find((p) => p.id === i.id) })).filter((l) => l.product),
    [items, products]
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0);

  return (
    <CartContext.Provider value={{ items, lines, count, subtotal, add, setQty, remove, clear, toast }}>
      {children}
      {toast && (
        <div role="status" className="toast-in fixed bottom-6 left-1/2 z-[500] -translate-x-1/2 rounded-full border border-gold/30 bg-ink/95 px-5 py-3 text-sm text-cream shadow-2xl backdrop-blur">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);

/** Shipping: ₹999 ya zyada free, warna 1 piece ₹80, 2+ piece ₹100 (server pe bhi yahi rule hai) */
// eslint-disable-next-line react-refresh/only-export-components
export const shippingFor = (subtotal, count) => (count === 0 || subtotal >= 999 ? 0 : count <= 1 ? 80 : 100);
