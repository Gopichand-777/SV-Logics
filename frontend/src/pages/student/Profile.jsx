import { useState, useEffect } from 'react';
import { User, Phone, Save, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';


export default function Profile() {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    authApi.getMe().then(res => {
      const u = res.data.user;
      setProfile({ name: u.name || '', phone: u.phone || '' });
    });
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });
    try {
      const { data } = await authApi.updateMe(profile);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      const token = localStorage.getItem('svlogics-token');
      login(token, { ...user, ...data.user });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const AVATAR_INITIALS = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SV';

  const MsgBox = ({ msg }) => msg.text ? (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginTop: 8,
      background: msg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
      border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>{msg.text}</div>
  ) : null;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 28 }}>My Profile</h1>

        {/* Avatar + Info */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0,
            }}>
              {AVATAR_INITIALS}
            </div>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{user?.name}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
              <span className="badge badge-primary" style={{ marginTop: 6 }}>
                {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Edit Profile</h3>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="p-name"><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Full Name</label>
              <input id="p-name" type="text" className="form-input" value={profile.name} onChange={e => setProfile(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-phone"><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Phone <span className="optional">(optional)</span></label>
              <input id="p-phone" type="tel" className="form-input" value={profile.phone} onChange={e => setProfile(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>

            <MsgBox msg={profileMsg} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                <Save size={16} /> {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password info notice */}
        <div className="card" style={{
          padding: 24,
          display: 'flex', alignItems: 'center', gap: 16,
          border: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(245,158,11,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={20} color="#f59e0b" />
          </div>
          <div>
            <p style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Password managed by Administrator</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              For security reasons, only the super admin can change passwords. If you have forgotten your credentials or need a password reset, please contact your administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
