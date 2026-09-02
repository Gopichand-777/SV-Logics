import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, User, LogOut, LayoutDashboard, FileText, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { liveClassesApi } from '../../api/liveclasses.api.js';


export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasLiveNow, setHasLiveNow] = useState(false);
  const menuRef = useRef(null);

  // Detect if any class is currently live
  useEffect(() => {
    if (!isLoggedIn) return;
    const check = async () => {
      try {
        const res = await liveClassesApi.getAll();
        const classes = res.data.liveClasses || [];
        const now = new Date();
        const live = classes.some((cls) => {
          const start = new Date(cls.scheduledAt);
          const end = new Date(start.getTime() + cls.durationMinutes * 60 * 1000);
          return now >= start && now <= end;
        });
        setHasLiveNow(live);
      } catch {
        // silently fail — non-critical
      }
    };
    check();
    // Re-check every 2 minutes
    const interval = setInterval(check, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

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
          <Link to="/courses" className="nav-link">Courses</Link>
          {isLoggedIn && <Link to="/tests" className="nav-link">Mock Tests</Link>}
          {isLoggedIn && (
            <Link to="/live-classes" className="nav-link" id="nav-live-class-link"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {hasLiveNow && <span className="live-nav-dot" />}
              <Video size={15} style={{ opacity: 0.85 }} />
              Live Class
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="nav-actions" style={{ gap: '10px' }}>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
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
                    <LayoutDashboard size={16} />Dashboard
                  </Link>
                  <Link to="/tests" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                     <FileText size={16} />Mock Tests
                  </Link>
                  <Link to="/live-classes" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                     <Video size={16} />
                     Live Classes
                     {hasLiveNow && <span className="live-nav-dot" style={{ marginLeft: 'auto' }} />}
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-text)', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                     <User size={16} />Profile
                  </Link>
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--color-error)', fontSize: '0.9rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    <LogOut size={16} />Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-link" style={{ fontWeight: 600 }}>Log In</Link>
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
          Courses
        </Link>
        {isLoggedIn && (
          <>
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              Dashboard
            </Link>
            <Link to="/tests" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              Mock Tests
            </Link>
            <Link to="/live-classes" className="nav-link" onClick={() => setMobileOpen(false)}
              style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={15} />
              Live Class
              {hasLiveNow && <span className="live-nav-dot" />}
            </Link>
            <Link to="/profile" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '12px 8px', borderBottom: '1px solid var(--color-border)' }}>
              Profile
            </Link>
            <button onClick={handleLogout} style={{ padding: '12px 8px', color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.95rem', textAlign: 'left' }}>
              Logout
            </button>
          </>
        )}
        {!isLoggedIn && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <Link to="/login" className="btn btn-outline btn-full" onClick={() => setMobileOpen(false)}>Log In</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
