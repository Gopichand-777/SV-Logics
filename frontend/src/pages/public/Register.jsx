import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { useAuth } from '../../context/AuthContext.jsx';


export default function Register() {

  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            Join 50,000+ students already preparing with SV Logics
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Start your preparation today with expert faculty, comprehensive mock tests, and proven study strategies.
          </p>
        </div>
        <p className="auth-trusted">Trusted by 50,000+ students across India</p>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div style={{ marginBottom: 8 }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>← Home</Link>
          </div>
          <h1>Create your account</h1>
          <p className="subtitle">It's free. No credit card required.</p>

          {/* Google Button */}
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
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="name"><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Full Name</label>
              <input id="name" name="name" type="text" className="form-input" value={form.name} onChange={handleChange} placeholder="Your full name" required autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email"><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Email Address</label>
              <input id="email" name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Phone Number <span className="optional">(optional)</span>
              </label>
              <input id="phone" name="phone" type="tel" className="form-input" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password"><Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Password</label>
              <div className="form-input-wrap">
                <input id="password" name="password" type={showPwd ? 'text' : 'password'} className="form-input" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
                <button type="button" className="form-input-icon" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account...</>
              ) : 'Create Account'}
            </button>

            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              By signing up, you agree to our{' '}
              <a href="#" style={{ color: 'var(--color-primary)' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
            </p>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
