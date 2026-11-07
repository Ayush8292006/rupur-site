// Backend (/api) se baat karne ka ek hi tareeka.
// Login cookie se hota hai, isliye credentials: 'include'.

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.fields = data?.fields || {};
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your internet and try again.', 0);
  }
  let data = {};
  try { data = await res.json(); } catch { /* khaali jawab */ }
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data);
  return data;
}

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Razorpay ka checkout script zaroorat padne par hi load hota hai
let rzpPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!rzpPromise) {
    rzpPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay did not load')));
      s.onerror = () => { rzpPromise = null; reject(new Error('Could not load the payment window. Check your internet and try again.')); };
      document.body.appendChild(s);
    });
  }
  return rzpPromise;
}
