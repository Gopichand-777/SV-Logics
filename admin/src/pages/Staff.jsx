import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Eye, EyeOff, X, Shield, Users, Trash2 } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import { useAuth } from '../context/AuthContext.jsx';

// ────────────────────────────────────────────────────────────────────────────
// Confirm Delete Dialog
// ────────────────────────────────────────────────────────────────────────────
function ConfirmDelete({ member, onConfirm, onCancel, loading }) {
  // Build avatar initials from member name
  const initials = member.name
    ? member.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 20,
        width: '100%', maxWidth: 420,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        border: '1px solid rgba(239,68,68,0.2)',
      }}>

        {/* Red gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          padding: '24px 24px 20px',
          textAlign: 'center',
        }}>
          {/* Pulsing warning icon */}
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Trash2 size={26} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            Delete Staff Account?
          </h3>
          <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
            This action is permanent and cannot be reversed
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 22px' }}>

          {/* Member info card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 12, marginBottom: 16,
          }}>
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              border: '1.5px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 800, color: '#ef4444', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                {member.name}
              </div>
              <div style={{
                fontSize: '0.75rem', color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {member.email}
              </div>
            </div>
            <span style={{
              marginLeft: 'auto', flexShrink: 0,
              fontSize: '0.68rem', fontWeight: 700,
              padding: '3px 9px', borderRadius: 99,
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
            }}>
              {member.role === 'super_admin' ? 'Super Admin' : 'Content Manager'}
            </span>
          </div>

          {/* Consequence list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
            {[
              'All admin panel access will be revoked immediately',
              'Their login session will be invalidated',
              'This account cannot be recovered',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', color: '#ef4444', fontWeight: 800,
                }}>✕</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 2, padding: '11px 16px',
                background: loading ? '#475569' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(239,68,68,0.35)',
              }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} /> Deleting...</>
                : <><Trash2 size={14} /> Yes, Delete Account</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// Main Staff Page
// ────────────────────────────────────────────────────────────────────────────
export default function AdminStaff() {
  const { admin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'content_manager' });
  const [showPwd, setShowPwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000);
  };

  const load = () => adminApi.getStaff().then(r => setStaff(r.data.staff)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggleStatus = async (s) => {
    if (s.id === admin?.id && s.role === admin?.role) {
      showMsg('You cannot deactivate yourself.', 'error'); return;
    }
    try {
      await adminApi.updateStaffStatus(s.id, s.role, !s.isActive);
      setStaff(prev => prev.map(m => (m.id === s.id && m.role === s.role) ? { ...m, isActive: !m.isActive } : m));
      showMsg(`${s.name} ${s.isActive ? 'deactivated' : 'activated'}.`);
    } catch { showMsg('Failed to update status.', 'error'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const { data } = await adminApi.createStaff(form);
      setStaff(prev => [data.staff, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'content_manager' });
      showMsg('Staff account created.');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create staff account.');
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteStaff(deleteTarget.id, deleteTarget.role);
      setStaff(prev => prev.filter(s => !(s.id === deleteTarget.id && s.role === deleteTarget.role)));
      showMsg(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showMsg(err.response?.data?.error || 'Failed to delete staff account.', 'error');
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const roleBadge = (role) => role === 'super_admin'
    ? <span className="badge badge-primary">Super Admin</span>
    : <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>Content Manager</span>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const isSelf = (s) => s.id === admin?.id && s.role === 'super_admin';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Staff</h1>
          <p className="page-subtitle">Manage super admins and content managers</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); }}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Toast */}
      {msg.text && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 10, fontWeight: 500, fontSize: '0.875rem',
          background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
          color: msg.type === 'error' ? '#ef4444' : '#10b981' }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={20} color="#6366f1" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{staff.filter(s => s.role === 'super_admin').length}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Super Admins</p>
          </div>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={20} color="#f59e0b" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{staff.filter(s => s.role === 'content_manager').length}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Content Managers</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No staff accounts yet.</td></tr>
            ) : staff.map(s => (
              <tr key={`${s.role}-${s.id}`}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  {isSelf(s) && <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>You</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.email}</td>
                <td>{roleBadge(s.role)}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(s.createdAt)}</td>
                <td>
                  <span className={`badge ${s.isActive !== false ? 'badge-success' : 'badge-error'}`}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Activate / Deactivate */}
                    <button
                      className="btn btn-sm btn-outline"
                      title={s.isActive !== false ? 'Deactivate' : 'Activate'}
                      disabled={isSelf(s)}
                      onClick={() => toggleStatus(s)}
                      style={{ opacity: isSelf(s) ? 0.35 : 1, cursor: isSelf(s) ? 'not-allowed' : 'pointer' }}>
                      {s.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>

                    {/* Delete */}
                    <button
                      className="btn btn-sm"
                      title={isSelf(s) ? 'Cannot delete yourself' : 'Delete Staff Account'}
                      disabled={isSelf(s)}
                      onClick={() => !isSelf(s) && setDeleteTarget(s)}
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', opacity: isSelf(s) ? 0.3 : 1, cursor: isSelf(s) ? 'not-allowed' : 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create Staff Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            width: '100%', maxWidth: 520,
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>

            {/* Gradient header banner */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '22px 24px 20px',
              position: 'relative',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
              >
                <X size={14} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Live avatar preview */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {form.name.trim()
                    ? form.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    : <Shield size={22} color="rgba(255,255,255,0.7)" />}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    Add Staff Account
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' }}>
                    Add a Content Manager to your team
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <form onSubmit={handleCreate} style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Error banner */}
              {formError && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, fontSize: '0.84rem', color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  ⚠️ {formError}
                </div>
              )}

              {/* Name + Email side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Full Name *
                  </label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Priya Sharma"
                    required autoFocus
                    style={{ marginTop: 5 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="priya@svlogics.com"
                    required
                    style={{ marginTop: 5 }}
                  />
                </div>
              </div>

              {/* Role — locked to Content Manager only */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Role
                </label>
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  border: '2px solid rgba(245,158,11,0.4)',
                  background: 'rgba(245,158,11,0.08)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: '1.3rem' }}>📝</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b' }}>Content Manager</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Manage courses, tests &amp; study materials</div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                    padding: '2px 8px', borderRadius: 99,
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}>✓ Selected</span>
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password *
                </label>
                <div style={{ position: 'relative', marginTop: 5 }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    required minLength={6}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', padding: 4,
                    }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  The staff member can change this after first login.
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 2, padding: '10px 20px',
                    background: creating ? '#475569' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: 10,
                    color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {creating
                    ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} /> Creating account...</>
                    : <><Shield size={14} /> Create Staff Account</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <ConfirmDelete
          member={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
