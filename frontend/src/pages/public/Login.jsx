import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Mail, Lock } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Login() {
  const { t } = useLang();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      login(data.token, data.user);
      // BUG-005: Both branches previously pointed to '/dashboard' — admins were silently
      // let into the student portal. Now block them with a clear error.
      if (['super_admin', 'content_manager'].includes(data.user.role)) {
        logout();
        setError('Admin accounts must log in via the Admin Panel (port 5174).');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
            <BookOpen size={24} color="#f59e0b" /> SV Logics
          </Link>
        </div>
        <div>
          <p className="auth-quote">"{t('auth.quote').replace(/"/g, '')}"</p>
          <p className="auth-quote-author">— {t('auth.quoteAuthor')}</p>
        </div>
        <p className="auth-trusted">{t('auth.trusted')}</p>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Home
            </Link>
          </div>
          <h1>{t('auth.welcomeBack')}</h1>
          <p className="subtitle">{t('auth.loginSubtitle')}</p>

          {/* Google OAuth Button (UI only — credentials added later) */}
          <button
            type="button"
            onClick={() => alert('Google OAuth: Add GOOGLE_CLIENT_ID to .env to enable')}
            style={{
              width: '100%', padding: '12px 20px', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.95rem', fontWeight: 600,
              color: 'var(--color-text)', transition: 'var(--transition)', marginBottom: 20,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            {t('auth.googleLogin')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t('auth.orDivider')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {t('auth.email')}
              </label>
              <input id="email" name="email" type="email" className="form-input"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com" required autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {t('auth.password')}
              </label>
              <div className="form-input-wrap">
                <input id="password" name="password" type={showPwd ? 'text' : 'password'} className="form-input"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required />
                <button type="button" className="form-input-icon" onClick={() => setShowPwd(s => !s)} title={t('auth.showPassword')}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Logging in...</>
              ) : t('auth.loginBtn')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              {t('auth.signupFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
