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

  const logout = () => {
    localStorage.removeItem('svlogics-token');
    setUser(null);
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'content_manager';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isSuperAdmin, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
