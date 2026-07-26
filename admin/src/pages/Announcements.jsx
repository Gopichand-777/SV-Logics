import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Megaphone } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => adminApi.getAnnouncements().then(r => setItems(r.data.announcements || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try { await adminApi.createAnnouncement(form); setMsg('✅ Announcement posted!'); load(); setModal(false); setForm({ title: '', content: '', isActive: true }); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    finally { setSaving(false); }
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Announcements</h1><p className="page-subtitle">Post notifications to all students</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> New Announcement</button>
      </div>
      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        : items.length === 0 ? (
          <div className="empty-state card"><Megaphone size={40} /><h3>No announcements</h3><p>Post updates for your students.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(a => (
              <div key={a.id} className="card" style={{ padding: 20 }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700 }}>{a.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${a.isActive ? 'badge-success' : 'badge-error'}`}>{a.isActive ? 'Active' : 'Inactive'}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(a.createdAt)}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.content}</p>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>New Announcement</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Important Update" />
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-input" rows={4} style={{ resize: 'vertical' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Your announcement…" />
              </div>
              <label className="form-check"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Publish immediately</label>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Posting...' : 'Post Announcement'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
