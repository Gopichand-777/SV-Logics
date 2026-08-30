import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, X, Save, Upload, Edit2, CheckCircle, MinusCircle } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const initQ = {
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'a', explanation: '', marks: 2, negativeMarks: 0.5, subject: '', topic: '',
};

const OPT_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };

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

export default function AdminQuestions() {
  const [searchParams] = useSearchParams();

  const [tests, setTests]               = useState([]);
  const [selectedTest, setSelectedTest] = useState(searchParams.get('testId') || '');
  const [questions, setQuestions]       = useState([]);
  const [loadingQ, setLoadingQ]         = useState(false);

  // Add modal
  const [addModal, setAddModal]   = useState(false);
  const [form, setForm]           = useState(initQ);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [bulkMode, setBulkMode]   = useState(false);
  const [bulkJson, setBulkJson]   = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const closeConfirm = () => setConfirmState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });

  // Edit modal
  const [editModal, setEditModal]     = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editForm, setEditForm]       = useState(initQ);
  const [editSaving, setEditSaving]   = useState(false);

  useEffect(() => { adminApi.getTests().then(r => setTests(r.data.tests)); }, []);

  useEffect(() => {
    if (!selectedTest) return;
    setLoadingQ(true);
    adminApi.getQuestions(selectedTest)
      .then(r => setQuestions(r.data.questions))
      .finally(() => setLoadingQ(false));
  }, [selectedTest]);

  const reloadQuestions = () =>
    adminApi.getQuestions(selectedTest).then(r => setQuestions(r.data.questions));

  // ── ADD ──────────────────────────────────────────────────────────────────────
  // Derive subject dropdown options dynamically from tests in the same category
  // (no hardcoded values — subjects come from the DB via the tests list)
  const selectedTestObj = tests.find(t => String(t.id) === String(selectedTest));
  const subjectOptions = selectedTestObj
    ? [...new Set(
        tests
          .filter(t => t.category === selectedTestObj.category && t.subject)
          .map(t => t.subject)
      )]
    : [];

  const openAddModal = () => {
    // Pre-fill marks AND subject from the selected test's defaults
    const test = tests.find(t => String(t.id) === String(selectedTest));
    setForm({
      ...initQ,
      marks:         test?.defaultMarks         ?? 2,
      negativeMarks: test?.defaultNegativeMarks  ?? 0.5,
      subject:       test?.subject               || '',
    });
    setAddModal(true);
    setBulkMode(false);
  };

  const saveAdd = async () => {
    setSaving(true); setMsg('');
    try {
      if (bulkMode) {
        const qs = JSON.parse(bulkJson);
        await adminApi.bulkImport(selectedTest, qs);
        setMsg(`✅ ${qs.length} questions imported!`);
      } else {
        await adminApi.createQuestion(selectedTest, form);
        setMsg('✅ Question added!');
      }
      setAddModal(false);
      reloadQuestions();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving')); }
    finally { setSaving(false); }
  };

  // ── EDIT ─────────────────────────────────────────────────────────────────────
  const openEditModal = (q) => {
    setEditQuestion(q);
    setEditForm({
      questionText:  q.questionText  || '',
      optionA:       q.optionA       || '',
      optionB:       q.optionB       || '',
      optionC:       q.optionC       || '',
      optionD:       q.optionD       || '',
      correctOption: q.correctOption || 'a',
      explanation:   q.explanation   || '',
      marks:         q.marks         ?? 2,
      negativeMarks: q.negativeMarks ?? 0.5,
      subject:       q.subject       || '',
      topic:         q.topic         || '',
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    setEditSaving(true); setMsg('');
    try {
      await adminApi.updateQuestion(editQuestion.id, editForm);
      setMsg('✅ Question updated!');
      setEditModal(false);
      reloadQuestions();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error updating')); }
    finally { setEditSaving(false); }
  };

  // ── DELETE ───────────────────────────────────────────────────────────────────
  const deleteQ = (id) => {
    askConfirm(
      'Delete Question?',
      'This will permanently delete the question. This cannot be undone.',
      async () => {
        closeConfirm();
        await adminApi.deleteQuestion(id);
        setQuestions(qs => qs.filter(q => q.id !== id));
      }
    );
  };

  // ── Shared Question Form Fields ───────────────────────────────────────────────
  const QuestionForm = ({ values, onChange, subjectOptions = [] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Question Text *</label>
        <textarea className="form-input" rows={3} value={values.questionText}
          onChange={e => onChange(f => ({ ...f, questionText: e.target.value }))}
          style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {['A', 'B', 'C', 'D'].map(opt => (
          <div className="form-group" key={opt}>
            <label className="form-label">Option {opt} *</label>
            <input className="form-input" value={values[`option${opt}`]}
              onChange={e => onChange(f => ({ ...f, [`option${opt}`]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Correct Option *</label>
          <select className="form-select" value={values.correctOption}
            onChange={e => onChange(f => ({ ...f, correctOption: e.target.value }))}>
            {['a','b','c','d'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">✅ Marks</label>
          <input type="number" step="0.5" min="0" className="form-input"
            value={values.marks}
            onChange={e => onChange(f => ({ ...f, marks: +e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">❌ Neg. Marks</label>
          <input type="number" step="0.25" min="0" className="form-input"
            value={values.negativeMarks}
            onChange={e => onChange(f => ({ ...f, negativeMarks: +e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          {subjectOptions.length > 0 ? (
            <select
              className="form-select"
              value={values.subject}
              onChange={e => onChange(f => ({ ...f, subject: e.target.value }))}
            >
              <option value="">— Select Subject —</option>
              {subjectOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <input className="form-input" value={values.subject}
              onChange={e => onChange(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Maths" />
          )}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Explanation</label>
        <textarea className="form-input" rows={2} value={values.explanation}
          onChange={e => onChange(f => ({ ...f, explanation: e.target.value }))}
          style={{ resize: 'vertical' }} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Questions Bank</h1>
          <p className="page-subtitle">Manage MCQ questions — set marks &amp; negative marks per question</p>
        </div>
        {selectedTest && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => { setBulkMode(true); setAddModal(true); }}>
              <Upload size={15} /> Bulk Import
            </button>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Add Question
            </button>
          </div>
        )}
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Test Selector */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Select Test:</label>
          <select className="form-select" style={{ maxWidth: 400 }} value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}>
            <option value="">— Choose a test —</option>
            {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
          </select>
          {questions.length > 0 && <span className="badge badge-info">{questions.length} Questions</span>}
        </div>
      </div>

      {/* Questions List */}
      {selectedTest && (
        loadingQ
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          : questions.length === 0
            ? <div className="empty-state card"><Plus size={40} /><h3>No questions yet</h3><p>Add questions manually or use bulk import.</p></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, i) => (
                  <div key={q.id} className="card" style={{ padding: 20 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Q{i + 1}{q.subject ? ` · ${q.subject}` : ''}
                        </span>
                        {/* Marks badges */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                          background: 'rgba(16,185,129,0.1)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                        }}>
                          <CheckCircle size={11} /> +{q.marks ?? 2}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.25)',
                        }}>
                          <MinusCircle size={11} /> −{q.negativeMarks ?? 0.5}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(q)} title="Edit question">
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => deleteQ(q.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontWeight: 500, lineHeight: 1.7, marginBottom: 12 }}>{q.questionText}</p>

                    {/* Options grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} style={{
                          padding: '8px 12px', borderRadius: 8, border: '1.5px solid',
                          borderColor: q.correctOption === opt ? 'var(--success)' : 'var(--border)',
                          background: q.correctOption === opt ? 'rgba(16,185,129,0.06)' : 'transparent',
                          fontSize: '0.875rem',
                        }}>
                          <span style={{ fontWeight: 700, marginRight: 6, color: q.correctOption === opt ? 'var(--success)' : 'var(--text-muted)' }}>
                            {OPT_LABELS[opt]}.
                          </span>
                          {q[`option${OPT_LABELS[opt]}`]}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--info)' }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
      )}

      {/* ── Add / Bulk Modal ─────────────────────────────────────────────────── */}
      {addModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{bulkMode ? '📥 Bulk Import Questions' : '➕ Add Question'}</h3>
              <button onClick={() => setAddModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            {bulkMode ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Paste a JSON array. Each question must have: <code>questionText</code>, <code>optionA–D</code>, <code>correctOption</code> (a/b/c/d), and optionally: <code>marks</code>, <code>negativeMarks</code>, <code>explanation</code>, <code>subject</code>.
                </p>
                <textarea className="form-input" rows={10}
                  style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }}
                  value={bulkJson} onChange={e => setBulkJson(e.target.value)}
                  placeholder='[{"questionText":"Q?","optionA":"A","optionB":"B","optionC":"C","optionD":"D","correctOption":"a","marks":2,"negativeMarks":0.5}]' />
              </div>
            ) : (
              <QuestionForm values={form} onChange={setForm} subjectOptions={subjectOptions} />
            )}
            <div className="modal-footer">
              <button onClick={() => setAddModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={saveAdd} disabled={saving || !selectedTest} className="btn btn-primary">
                <Save size={15} /> {saving ? 'Saving...' : bulkMode ? 'Import All' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editModal && editQuestion && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>✏️ Edit Question</h3>
              <button onClick={() => setEditModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <QuestionForm values={editForm} onChange={setEditForm} subjectOptions={subjectOptions} />
            <div className="modal-footer">
              <button onClick={() => setEditModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} className="btn btn-primary">
                <Save size={15} /> {editSaving ? 'Saving...' : 'Update Question'}
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
