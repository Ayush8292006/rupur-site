import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // pehli baar check ho gaya?

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(d.user);
    return d.user;
  }, []);

  const signup = useCallback(async (data) => {
    const d = await api('/auth/signup', { method: 'POST', body: data });
    setUser(d.user);
    return d.user;
  }, []);

  // Order ke baad offer khatam – user dobara lo
  const refresh = useCallback(() => api('/auth/me').then((d) => setUser(d.user)).catch(() => {}), []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } finally { setUser(null); }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const d = await api('/auth/reset', { method: 'POST', body: { token, password } });
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, resetPassword, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
