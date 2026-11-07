// Products backend se aate hain (backend/data/products.json).
// Server na mile toh yeh list dikhti hai, taaki site khaali na lage.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';


export const FALLBACK_PRODUCTS = [
  {"id": "iron-crown", "name": "Iron Crown", "desc": "Rule with strength", "story": "The essence of power and elegance. Juicy pineapple opens onto birch and jasmine, settling into a deep, mossy base built for evenings and big occasions.", "notes": ["Top: Pineapple", "Heart: Birch, Jasmine", "Base: Oakmoss"], "size": "50 ML", "img": "/products/iron-crown-card.webp", "images": ["/products/iron-crown-1.webp", "/products/iron-crown-2.webp", "/products/iron-crown-3.webp", "/products/iron-crown-4.webp"], "accent": "#8A6A3B", "gender": "Men", "type": "Perfume", "price": 649, "mrp": 1250, "soldOut": false},
  {"id": "romantic-dance", "name": "Romantic Dance", "desc": "Candle-lit, rose-warm evenings", "size": "30 ML", "img": "https://idyllic-tarsier-20717f.netlify.app/img/romantic.webp", "accent": "#7A1F2B", "gender": "Women", "type": "Perfume", "price": 228, "mrp": 285, "soldOut": false},
  {"id": "dhaval", "name": "Dhaval", "desc": "Clean, woody, daily office wear", "size": "30 ML", "img": "https://idyllic-tarsier-20717f.netlify.app/img/dhaval.webp", "accent": "#3A4250", "gender": "Men", "type": "Perfume", "price": 151, "mrp": 189, "soldOut": false},
  {"id": "ira", "name": "Ira", "desc": "A garden of soft florals", "size": "30 ML", "img": "https://idyllic-tarsier-20717f.netlify.app/img/ira.webp", "accent": "#B4586C", "gender": "Women", "type": "Perfume", "price": 212, "mrp": 265, "soldOut": false},
  {"id": "sea-faze", "name": "Sea Faze", "desc": "Salt air and a cool breeze", "size": "30 ML", "img": "https://idyllic-tarsier-20717f.netlify.app/img/seafaze.webp", "accent": "#1F5FA8", "gender": "Unisex", "type": "Perfume", "price": 151, "mrp": 189, "soldOut": false},
  {"id": "giraft", "name": "Giraft", "desc": "Dark, bold and unchained", "size": "50 ML", "img": "https://idyllic-tarsier-20717f.netlify.app/img/giraft.webp", "accent": "#2A2622", "gender": "Men", "type": "Perfume", "price": 559, "mrp": 699, "soldOut": true},
  {"id": "rose-elixir", "name": "Rose Elixir", "desc": "Blended with passion", "story": "Inspired by the timeless beauty of royal gardens, where every drop captures the rich, romantic essence of fresh blooming roses.", "notes": ["Pure rose (gulab)"], "size": "6 ML", "img": "/products/rose-elixir-card.webp", "images": ["/products/rose-elixir.webp"], "accent": "#C62828", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "mogra-majesty", "name": "Mogra Majesty", "desc": "The royal floral essence", "story": "Inspired by the rich, enchanting aroma of handpicked mogra blossoms, carrying the soothing breeze of Indian summers.", "notes": ["Desi mogra"], "size": "6 ML", "img": "/products/mogra-majesty-card.webp", "images": ["/products/mogra-majesty.webp"], "accent": "#1E7A3A", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "ujjaini", "name": "Ujjaini", "desc": "The divine sandalwood", "story": "Inspired by the sacred soil of Ujjain and the devotional essence of Mahakal, with the peaceful warmth of pure sandalwood.", "notes": ["Sandalwood"], "size": "6 ML", "img": "/products/ujjaini-card.webp", "images": ["/products/ujjaini.webp"], "accent": "#C99A16", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "vrindavan", "name": "Vrindavan", "desc": "Blessed by divinity", "story": "Inspired by the sacred land of Vrindavan, where every breeze echoes the eternal love of Radha and Krishna.", "notes": ["Chandan floral"], "size": "6 ML", "img": "/products/vrindavan-card.webp", "images": ["/products/vrindavan.webp"], "accent": "#D9531E", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "shanaya-noir", "name": "Shanaya Noir", "desc": "A mystical, deep blend", "story": "Inspired by dark, alluring Arabian nights, where velvet rose meets saffron, rich caramel and precious agarwood.", "notes": ["Rose, saffron, agarwood"], "size": "6 ML", "img": "/products/shanaya-noir-card.webp", "images": ["/products/shanaya-noir.webp"], "accent": "#6B1A24", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "romantic-dance-attar", "name": "Romantic Dance Attar", "desc": "A sensual amber & spice dance", "story": "A warm, sweet blend of rich dates, cosy cinnamon and vanilla, where every drop echoes the rhythm of passion.", "notes": ["Dates, cinnamon, vanilla"], "size": "6 ML", "img": "/products/romantic-dance-attar-card.webp", "images": ["/products/romantic-dance-attar.webp"], "accent": "#22307A", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "dubai-oudh", "name": "Dubai Oudh", "desc": "Essence of luxury", "story": "An expression of timeless elegance and a bold, sophisticated presence. Make your signature unforgettable.", "notes": ["Royal Arabic oudh"], "size": "6 ML", "img": "/products/dubai-oudh-card.webp", "images": ["/products/dubai-oudh.webp"], "accent": "#9C1F5C", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
  {"id": "choco-faze", "name": "Choco Faze", "desc": "A touch of sweet sophistication", "story": "A statement of effortless style and everyday luxury, sweet and smooth. Make every impression memorable.", "notes": ["Sweet chocolate"], "size": "6 ML", "img": "/products/choco-faze-card.webp", "images": ["/products/choco-faze.webp"], "accent": "#6B3E26", "gender": "Unisex", "type": "Attar", "price": 100, "mrp": 125, "soldOut": false},
];

let cache = null;
let inflight = null;
const listeners = new Set();

function fetchProducts() {
  if (!inflight) {
    inflight = api('/products')
      .then((d) => (Array.isArray(d.products) && d.products.length ? d.products : FALLBACK_PRODUCTS))
      .catch(() => FALLBACK_PRODUCTS)
      .then((list) => {
        cache = list;
        listeners.forEach((fn) => fn(list));
        return list;
      });
  }
  return inflight;
}

export function useProducts() {
  const [products, setProducts] = useState(cache || FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    const fn = (list) => { setProducts(list); setLoading(false); };
    listeners.add(fn);
    if (cache) fn(cache); else fetchProducts();
    return () => listeners.delete(fn);
  }, []);
  return { products, loading };
}
