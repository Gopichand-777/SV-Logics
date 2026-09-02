import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('svlogics-token');
    if (token) {
      authApi.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('svlogics-token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('svlogics-token', token);
    setUser(userData);
  };

  // Calls backend to clear sessionToken in DB — JWT is immediately dead on all devices
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local cleanup even if backend call fails
    } finally {
      localStorage.removeItem('svlogics-token');
      setUser(null);
    }
  };

  // Called by axios interceptor when SESSION_INVALIDATED received
  const forceLogout = (message) => {
    localStorage.removeItem('svlogics-token');
    setUser(null);
    if (message) {
      import('../components/ui/toast.js').then(({ toast }) => {
        toast.warning(message);
      });
    }
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'content_manager';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forceLogout, isAdmin, isSuperAdmin, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
