import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const CATEGORIES = ['SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const initTest = { title: '', description: '', category: 'SSC CGL', difficulty: 'medium', durationMinutes: 60, totalQuestions: 10, marksPerQuestion: 2, negativeMarks: 0.5, isPublished: false };

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [form, setForm] = useState(initTest);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => adminApi.getTests().then(r => setTests(r.data.tests)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openModal = (test = null) => { setEditTest(test); setForm(test || initTest); setModal(true); };
  const closeModal = () => { setModal(false); setEditTest(null); };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      if (editTest) await adminApi.updateTest(editTest.id, form);
      else await adminApi.createTest(form);
      setMsg('✅ Test saved!'); load(); closeModal();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    finally { setSaving(false); }
  };

  const deleteTest = async (id) => {
    if (!confirm('Delete this test? Questions will also be deleted.')) return;
    await adminApi.deleteTest(id); load();
  };

  const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Mock Tests</h1><p className="page-subtitle">Create and manage exam test series</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> Add Test</button>
      </div>
      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Questions</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loader" style={{ padding: 40 }}><div className="spinner" /></div></td></tr>
            ) : tests.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td><span className="badge badge-primary">{t.category}</span></td>
                <td><span style={{ fontWeight: 700, fontSize: '0.8rem', color: DIFF_COLOR[t.difficulty], textTransform: 'capitalize' }}>● {t.difficulty}</span></td>
                <td>{t.totalQuestions}</td>
                <td>{t.durationMinutes}m</td>
                <td><span className={`badge ${t.isPublished ? 'badge-success' : 'badge-warning'}`}>{t.isPublished ? 'Live' : 'Draft'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => openModal(t)}><Edit2 size={13} /></button>
                    <button className="btn btn-sm btn-error" onClick={() => deleteTest(t.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editTest ? 'Edit Test' : 'Create Test'}</h3>
              <button onClick={closeModal} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Test Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="SSC CGL Full Mock Test 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (min)</label>
                <input type="number" className="form-input" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Questions</label>
                <input type="number" className="form-input" value={form.totalQuestions} onChange={e => setForm(f => ({ ...f, totalQuestions: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Marks per Question</label>
                <input type="number" step="0.5" className="form-input" value={form.marksPerQuestion} onChange={e => setForm(f => ({ ...f, marksPerQuestion: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Negative Marks</label>
                <input type="number" step="0.25" className="form-input" value={form.negativeMarks} onChange={e => setForm(f => ({ ...f, negativeMarks: +e.target.value }))} />
              </div>
              <label className="form-check" style={{ gridColumn: '1/-1' }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} /> Published (visible to students)
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-outline">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Test'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
