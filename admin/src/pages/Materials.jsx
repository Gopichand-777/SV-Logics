import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, FileText, ExternalLink, Lock } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import FileUploader from '../components/FileUploader.jsx';

const TYPES = ['pdf', 'video', 'link', 'doc'];

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 25px 70px rgba(0,0,0,0.55)', overflow: 'hidden',
      }}>
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', padding: '20px 22px 18px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Trash2 size={22} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{title}</h3>
        </div>
        <div style={{ padding: '18px 22px 20px' }}>
          <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>{message}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 2, padding: '10px 16px', background: 'linear-gradient(135deg,#dc2626,#ef4444)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
              <Trash2 size={14} /> Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TYPE_COLORS = {
  pdf:   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  video: { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  link:  { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  doc:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
};

export default function AdminMaterials() {
  const [courses, setCourses]       = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [modal, setModal]           = useState(false);
  const [uploadMode, setUploadMode] = useState('upload'); // 'upload' | 'url'
  const [form, setForm]             = useState({
    courseId: '', title: '', type: 'pdf',
    fileKey: '',       // R2 key (e.g. "pdfs/uuid.pdf") OR external URL for 'link' type
    description: '',
  });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg]         = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const closeConfirm = () => setConfirmState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });

  const load = () => {
    adminApi.getCourses().then(r => setCourses(r.data.courses));
    adminApi.getMaterials().then(r => setMaterials(r.data.materials)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openModal = () => {
    setUploadMode('upload');
    setForm({ courseId: '', title: '', type: 'pdf', fileKey: '', description: '' });
    setMsg('');
    setModal(true);
  };

  const save = async () => {
    if (!form.courseId || !form.title || !form.fileKey) return;
    setSaving(true); setMsg('');
    try {
      await adminApi.addMaterial({
        courseId:    parseInt(form.courseId),
        title:       form.title,
        type:        form.type,
        fileKey:     form.fileKey,
        description: form.description,
      });
      setMsg('✅ Material added!');
      setModal(false);
      load();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (id) => {
    askConfirm(
      'Delete Material?',
      'This will permanently delete the study material. This cannot be undone.',
      async () => {
        closeConfirm();
        setDeleting(id);
        try {
          await adminApi.deleteMaterial(id);
          setMaterials(prev => prev.filter(m => m.id !== id));
        } catch (err) {
          setMsg('❌ ' + (err.response?.data?.error || 'Error deleting'));
        } finally { setDeleting(null); }
      }
    );
  };

  const getCourseTitle = (courseId) => courses.find(c => c.id === courseId)?.title || '—';
  const isR2Key        = (key) => key && !key.startsWith('http');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <p className="page-subtitle">Upload PDFs &amp; Videos to private secure storage</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}><Plus size={16} /> Add Material</button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {materials.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
            <FileText size={40} color="var(--text-light)" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No materials yet. Click "Add Material" to get started.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', textAlign: 'center' }}>
              Videos and PDFs are stored in private encrypted storage — students can only access them after enrollment.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Course</th>
                <th>Storage</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const tc = TYPE_COLORS[m.type] || TYPE_COLORS.link;
                const isPrivate = isR2Key(m.fileKey);
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
                      {isPrivate ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#10b981' }}>
                          <Lock size={11} /> Private
                        </span>
                      ) : (
                        <a href={m.fileKey} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ExternalLink size={12} /> External
                        </a>
                      )}
                    </td>
                    <td>
                      <button onClick={() => remove(m.id)} disabled={deleting === m.id}
                        className="btn btn-icon btn-danger" title="Delete">
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
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Add Study Material</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Course */}
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select className="form-select" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                  <option value="">— Select a course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Material Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Chapter 1 Notes PDF" />
              </div>

              {/* Type */}
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value, fileKey: '' }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* File — Upload or URL */}
              <div className="form-group">
                <label className="form-label">File *</label>

                {/* Mode tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[
                    { key: 'upload', label: '⬆ Upload to Private Storage' },
                    { key: 'url',    label: '🔗 External URL'              },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => { setUploadMode(key); setForm(f => ({ ...f, fileKey: '' })); }}
                      style={{
                        padding: '5px 14px', borderRadius: 6, fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${uploadMode === key ? 'var(--primary)' : 'var(--border)'}`,
                        background: uploadMode === key ? 'var(--primary)' : 'transparent',
                        color: uploadMode === key ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                {uploadMode === 'upload' ? (
                  <FileUploader
                    type={form.type === 'video' ? 'video' : 'pdf'}
                    onUploaded={(key) => setForm(f => ({ ...f, fileKey: key }))}
                    onClear={() => setForm(f => ({ ...f, fileKey: '' }))}
                  />
                ) : (
                  <input type="url" className="form-input" value={form.fileKey}
                    onChange={e => setForm(f => ({ ...f, fileKey: e.target.value }))}
                    placeholder="https://external-link.com/file.pdf" />
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..." />
              </div>

              {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
            </div>

            <div className="modal-footer">
              <button onClick={() => setModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={save}
                disabled={saving || !form.courseId || !form.title || !form.fileKey}
                className="btn btn-primary">
                <Save size={15} /> {saving ? 'Adding...' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
