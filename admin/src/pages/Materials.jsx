import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, FileText, BookOpen } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const TYPES = ['pdf', 'video', 'link', 'doc'];

export default function AdminMaterials() {
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', type: 'pdf', fileUrl: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { adminApi.getCourses().then(r => setCourses(r.data.courses)); }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try { await adminApi.addMaterial(form); setMsg('✅ Material added!'); setModal(false); setForm({ courseId: '', title: '', type: 'pdf', fileUrl: '', description: '' }); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Study Materials</h1><p className="page-subtitle">Attach PDFs, notes & resources to courses</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Add Material</button>
      </div>
      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="card" style={{ padding: 28 }}>
        <div className="flex-center" style={{ flexDirection: 'column', gap: 12, padding: 24 }}>
          <FileText size={40} color="var(--text-light)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Use the "Add Material" button to attach PDFs, notes, or external links to your courses.</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
            Students can access materials after enrollment. Support Amazon S3 URLs, Google Drive links, and external PDFs.
          </p>
        </div>
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
