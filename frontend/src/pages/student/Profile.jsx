import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Profile() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const [profile, setProfile] = useState({ name: '', phone: '', avatarUrl: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    authApi.getMe().then(res => {
      const u = res.data.user;
      setProfile({ name: u.name || '', phone: u.phone || '', avatarUrl: u.avatarUrl || '' });
    });
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });
    try {
      const { data } = await authApi.updateMe(profile);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      // Update token name
      const token = localStorage.getItem('svlogics-token');
      login(token, { ...user, ...data.user });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) { setPwdMsg({ text: 'Both fields required.', type: 'error' }); return; }
    if (pwdForm.newPassword.length < 6) { setPwdMsg({ text: 'Password must be at least 6 characters.', type: 'error' }); return; }
    setPwdLoading(true);
    setPwdMsg({ text: '', type: '' });
    try {
      await authApi.changePassword(pwdForm);
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.error || 'Failed to change password.', type: 'error' });
    } finally {
      setPwdLoading(false);
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 28 }}>{t('profile.title')}</h1>

        {/* Avatar */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0,
              overflow: 'hidden', position: 'relative',
            }}>
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : AVATAR_INITIALS}
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
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{t('profile.editProfile')}</h3>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="p-name"><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Full Name</label>
              <input id="p-name" type="text" className="form-input" value={profile.name} onChange={e => setProfile(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-phone"><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Phone <span className="optional">(optional)</span></label>
              <input id="p-phone" type="tel" className="form-input" value={profile.phone} onChange={e => setProfile(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-avatar"><Camera size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Avatar URL <span className="optional">(optional)</span></label>
              <input id="p-avatar" type="url" className="form-input" value={profile.avatarUrl} onChange={e => setProfile(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <MsgBox msg={profileMsg} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                <Save size={16} /> {profileLoading ? 'Saving...' : t('profile.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{t('profile.changePassword')}</h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cur-pwd"><Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('profile.currentPassword')}</label>
              <input id="cur-pwd" type="password" className="form-input" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pwd"><Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('profile.newPassword')}</label>
              <input id="new-pwd" type="password" className="form-input" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 6 characters" required />
            </div>
            <MsgBox msg={pwdMsg} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                <Lock size={16} /> {pwdLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
