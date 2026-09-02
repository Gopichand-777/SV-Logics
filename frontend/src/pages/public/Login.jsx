import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { useAuth } from '../../context/AuthContext.jsx';


export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
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
            <img src="/logo.png" alt="SV Logics" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '50%' }} /> SV Logics
          </Link>
        </div>
        <div>
          <p className="auth-quote">"Success is where preparation and opportunity meet."</p>
          <p className="auth-quote-author">— SV Logics</p>
        </div>
        <p className="auth-trusted">Trusted by 50,000+ students across India</p>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Home
            </Link>
          </div>
          <h1>Welcome back</h1>
          <p className="subtitle">Sign in with your username and password to continue.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="username">
                <User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Username
              </label>
              <input id="username" name="username" type="text" className="form-input"
                value={form.username} onChange={handleChange}
                placeholder="Enter your username" required autoFocus autoComplete="username" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Password
              </label>
              <div className="form-input-wrap">
                <input id="password" name="password" type={showPwd ? 'text' : 'password'} className="form-input"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" className="form-input-icon" onClick={() => setShowPwd(s => !s)} title="Show password">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Logging in...</>
              ) : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Contact your administrator if you don't have an account.
          </p>
        </div>
      </div>
    </div>
  );
}
