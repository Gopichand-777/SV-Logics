import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Save, Filter, BookOpen, Info } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

const initTest = {
  title: '', description: '', category: '', subject: '',
  difficulty: 'medium', durationMinutes: 60,
  defaultMarks: 2, defaultNegativeMarks: 0.5,
  isPublished: false,
};

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 18, width: '100%', maxWidth: 400, boxShadow: '0 25px 70px rgba(0,0,0,0.55)', overflow: 'hidden' }}>
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

export default function AdminTests() {
  const navigate = useNavigate();
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [form, setForm]         = useState(initTest);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const closeConfirm = () => setConfirmState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });

  // Filter state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubject, setFilterSubject]   = useState('');
  const [filterStatus, setFilterStatus]     = useState('');

  const load = () => adminApi.getTests().then(r => setTests(r.data.tests)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // ── Derive categories dynamically from fetched tests ──────────────────────
  const allCategories = useMemo(() => {
    return [...new Set(tests.map(t => t.category).filter(Boolean))].sort();
  }, [tests]);

  // ── Derive subjects for the currently selected filter category ────────────
  const filterSubjectOptions = useMemo(() => {
    if (!filterCategory) return [];
    return [...new Set(tests.filter(t => t.category === filterCategory).map(t => t.subject).filter(Boolean))].sort();
  }, [tests, filterCategory]);

  // ── Derive subjects for the form's selected category ─────────────────────
  const formSubjectOptions = useMemo(() => {
    if (!form.category) return [];
    return [...new Set(tests.filter(t => t.category === form.category).map(t => t.subject).filter(Boolean))].sort();
  }, [tests, form.category]);

  const openModal = (test = null) => {
    setEditTest(test);
    setForm(test ? { ...test } : initTest);
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditTest(null); };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      if (editTest) await adminApi.updateTest(editTest.id, form);
      else          await adminApi.createTest(form);
      setMsg('✅ Test saved!'); load(); closeModal();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    finally { setSaving(false); }
  };

  const deleteTest = (id) => {
    askConfirm(
      'Delete Test?',
      'This will permanently delete the test and ALL its questions. This cannot be undone.',
      async () => { closeConfirm(); await adminApi.deleteTest(id); load(); }
    );
  };


  // Apply filters client-side
  const displayed = tests.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterSubject  && t.subject  !== filterSubject)  return false;
    if (filterStatus === 'published' && !t.isPublished)  return false;
    if (filterStatus === 'draft'     &&  t.isPublished)  return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mock Tests</h1>
          <p className="page-subtitle">Create and manage exam test series — tagged by subject</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> Add Test</button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 150 }}
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setFilterSubject(''); }}
        >
          <option value="">All Categories</option>
          {allCategories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 200 }}
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          disabled={!filterCategory}
        >
          <option value="">All Subjects</option>
          {filterSubjectOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 120 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {(filterCategory || filterSubject || filterStatus) && (
          <button className="btn btn-sm btn-outline" onClick={() => { setFilterCategory(''); setFilterSubject(''); setFilterStatus(''); }}>
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {displayed.length} of {tests.length} tests
        </span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loader" style={{ padding: 40 }}><div className="spinner" /></div></td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No tests match the current filters.</td></tr>
            ) : displayed.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td><span className="badge badge-primary">{t.category}</span></td>
                <td>
                  {t.subject
                    ? <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.72rem' }}>{t.subject}</span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                  }
                </td>
                <td><span style={{ fontWeight: 700, fontSize: '0.8rem', color: DIFF_COLOR[t.difficulty], textTransform: 'capitalize' }}>● {t.difficulty}</span></td>
                <td>{t.totalQuestions}</td>
                <td>{t.durationMinutes}m</td>
                <td><span className={`badge ${t.isPublished ? 'badge-success' : 'badge-warning'}`}>{t.isPublished ? 'Live' : 'Draft'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(`/questions?testId=${t.id}`)}
                      title="Manage questions for this test"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <BookOpen size={12} /> Questions
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => openModal(t)}><Edit2 size={13} /></button>
                    <button className="btn btn-sm btn-error"   onClick={() => deleteTest(t.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Test Modal ── */}
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
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value, subject: '' }))}
                  list="category-options"
                  placeholder="e.g. SSC CGL"
                />
                <datalist id="category-options">
                  {allCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  list="subject-options"
                  placeholder="e.g. Quantitative Aptitude"
                />
                <datalist id="subject-options">
                  {formSubjectOptions.map(s => <option key={s} value={s} />)}
                </datalist>
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

              {/* ── Marking Scheme ── */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)', border: '1.5px solid #10b981',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#10b981', fontWeight: 900,
                  }}>✓</span>
                  Marks / Correct Answer
                </label>
                <input
                  type="number" step="0.5" min="0"
                  className="form-input"
                  value={form.defaultMarks}
                  onChange={e => setForm(f => ({ ...f, defaultMarks: +e.target.value }))}
                  placeholder="e.g. 2"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.1)', border: '1.5px solid #ef4444',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#ef4444', fontWeight: 900,
                  }}>−</span>
                  Negative Marks / Wrong Answer
                </label>
                <input
                  type="number" step="0.25" min="0"
                  className="form-input"
                  value={form.defaultNegativeMarks}
                  onChange={e => setForm(f => ({ ...f, defaultNegativeMarks: +e.target.value }))}
                  placeholder="e.g. 0.5"
                />
              </div>

              <label className="form-check" style={{ gridColumn: '1/-1' }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} /> Published (visible to students)
              </label>
              {/* Info hint */}
              <div style={{
                gridColumn: '1/-1', display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <Info size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  These are <strong style={{ color: 'var(--text)' }}>default values</strong> — they pre-fill the marks when you add questions in the{' '}
                  <button
                    type="button"
                    onClick={() => { closeModal(); navigate(`/questions${editTest ? '?testId=' + editTest.id : ''}`); }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: '0.82rem' }}
                  >
                    Questions Bank →
                  </button>
                  {' '}You can still override marks per individual question.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-outline">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Test'}</button>
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
