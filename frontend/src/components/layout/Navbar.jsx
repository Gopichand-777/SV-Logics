import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, User, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container flex-between" style={{ height: '100%' }}>
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
          <img src="/logo.png" alt="SV Logics" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: '50%' }} />
          <span>SV Logics</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/courses" className="nav-link">{t('nav.courses')}</Link>
          {isLoggedIn && <Link to="/tests" className="nav-link">{t('nav.tests')}</Link>}
        </div>

        {/* Actions */}
        <div className="nav-actions" style={{ gap: '10px' }}>
          {/* Lang Toggle */}
          <button className="lang-toggle" onClick={toggleLang} title="Switch language">
            {lang === 'en' ? 'తె' : 'EN'}
          </button>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="btn btn-outline btn-sm"
                style={{ gap: 8, display: 'flex', alignItems: 'center' }}
              >
                <User size={16} />
                {user?.name?.split(' ')[0]}
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 180, zIndex: 200, overflow: 'hidden',
                }}>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                    <LayoutDashboard size={16} />{t('nav.dashboard')}
                  </Link>
                  <Link to="/tests" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                    <FileText size={16} />{t('nav.tests')}
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                    <User size={16} />{t('nav.profile')}
                  </Link>
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-error)', fontSize: '0.9rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    <LogOut size={16} />{t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link" style={{ fontWeight: 600 }}>{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.signup')}</Link>
            </>
          )}

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={22} color="var(--color-text)" /> : <Menu size={22} color="var(--color-text)" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <Link to="/courses" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
          {t('nav.courses')}
        </Link>
        {isLoggedIn && (
          <>
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              {t('nav.dashboard')}
            </Link>
            <Link to="/tests" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              {t('nav.tests')}
            </Link>
            <Link to="/profile" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              {t('nav.profile')}
            </Link>
            <button onClick={handleLogout} style={{ padding: '12px 8px', color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.95rem', textAlign: 'left' }}>
              {t('nav.logout')}
            </button>
          </>
        )}
        {!isLoggedIn && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <Link to="/login" className="btn btn-outline btn-full" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
            <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMobileOpen(false)}>{t('nav.signup')}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
