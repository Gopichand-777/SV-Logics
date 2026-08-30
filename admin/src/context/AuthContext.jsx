import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/admin.api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('svlogics-admin-token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const user = res.data.user;
          if (user.tableSource === 'admin' && (user.role === 'super_admin' || user.role === 'content_manager')) {
            setAdmin(user);
          } else {
            localStorage.removeItem('svlogics-admin-token');
          }
        })
        .catch(() => localStorage.removeItem('svlogics-admin-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('svlogics-admin-token', token);
    setAdmin(userData);
  };

  // Calls backend to clear sessionToken in DB — JWT is immediately dead
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local cleanup even if backend call fails
    } finally {
      localStorage.removeItem('svlogics-admin-token');
      setAdmin(null);
    }
  };

  // Handle SESSION_INVALIDATED (called from axios interceptor)
  const forceLogout = (message) => {
    localStorage.removeItem('svlogics-admin-token');
    setAdmin(null);
    if (message) alert(`⚠️ ${message}`);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, forceLogout, isSuperAdmin: admin?.role === 'super_admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

