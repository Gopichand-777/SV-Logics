import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, FileText, ExternalLink } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const TYPES = ['pdf', 'video', 'link', 'doc'];

const TYPE_COLORS = {
  pdf: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  video: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  link: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  doc: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
};

export default function AdminMaterials() {
  const [courses, setCourses] = useState([]);
  // BUG-006: Now loads the actual materials list from GET /admin/materials
  const [materials, setMaterials] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', type: 'pdf', fileUrl: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => {
    adminApi.getCourses().then(r => setCourses(r.data.courses));
    adminApi.getMaterials().then(r => setMaterials(r.data.materials)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await adminApi.addMaterial(form);
      setMsg('✅ Material added!');
      setModal(false);
      setForm({ courseId: '', title: '', type: 'pdf', fileUrl: '', description: '' });
      load(); // Refresh list
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    setDeleting(id);
    try {
      await adminApi.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error deleting'));
    } finally {
      setDeleting(null);
    }
  };

  const getCourseTitle = (courseId) => {
    const c = courses.find(c => c.id === courseId);
    return c?.title || '—';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Study Materials</h1><p className="page-subtitle">Attach PDFs, notes & resources to courses</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Add Material</button>
      </div>
      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {materials.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
            <FileText size={40} color="var(--text-light)" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No materials yet. Click "Add Material" to get started.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', textAlign: 'center' }}>
              Students can access materials after enrollment. Supports Amazon S3 URLs, Google Drive links, and external PDFs.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Course</th>
                <th>URL</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const tc = TYPE_COLORS[m.type] || TYPE_COLORS.link;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.title}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        background: tc.bg, color: tc.color,
                      }}>{m.type}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{getCourseTitle(m.courseId)}</td>
                    <td>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={12} /> View
                      </a>
                    </td>
                    <td>
                      <button
                        onClick={() => remove(m.id)}
                        disabled={deleting === m.id}
                        className="btn btn-icon btn-danger"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Study Material</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select className="form-select" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                  <option value="">— Select a course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Chapter 1 Notes PDF" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File URL / S3 Link *</label>
                <input type="url" className="form-input" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://bucket.s3.amazonaws.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={save} disabled={saving || !form.courseId || !form.title || !form.fileUrl} className="btn btn-primary">
                <Save size={15} /> {saving ? 'Adding...' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
