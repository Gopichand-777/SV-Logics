import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Upload } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const initQ = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'a', explanation: '', marks: 2, negativeMarks: 0.5, subject: '', topic: '' };

export default function AdminQuestions() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initQ);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  useEffect(() => { adminApi.getTests().then(r => setTests(r.data.tests)); }, []);
  useEffect(() => {
    if (!selectedTest) return;
    setLoadingQ(true);
    adminApi.getQuestions(selectedTest).then(r => setQuestions(r.data.questions)).finally(() => setLoadingQ(false));
  }, [selectedTest]);

  const openModal = () => { setForm(initQ); setModal(true); setBulkMode(false); };

  const save = async () => {
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
      setModal(false);
      adminApi.getQuestions(selectedTest).then(r => setQuestions(r.data.questions));
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving')); }
    finally { setSaving(false); }
  };

  const deleteQ = async (id) => {
    if (!confirm('Delete this question?')) return;
    await adminApi.deleteQuestion(id);
    setQuestions(qs => qs.filter(q => q.id !== id));
  };

  const OPT_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Questions Bank</h1><p className="page-subtitle">Manage MCQ questions for each test</p></div>
        {selectedTest && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => { setBulkMode(true); setModal(true); }}><Upload size={15} /> Bulk Import</button>
            <button className="btn btn-primary" onClick={openModal}><Plus size={16} /> Add Question</button>
          </div>
        )}
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Test Selector */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Select Test:</label>
          <select className="form-select" style={{ maxWidth: 400 }} value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
            <option value="">— Choose a test —</option>
            {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
          </select>
          {questions.length > 0 && <span className="badge badge-info">{questions.length} Questions</span>}
        </div>
      </div>

      {/* Questions List */}
      {selectedTest && (
        loadingQ ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div> :
        questions.length === 0 ? (
          <div className="empty-state card"><Plus size={40} /><h3>No questions yet</h3><p>Add questions manually or use bulk import.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, i) => (
              <div key={q.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Q{i + 1} · {q.subject || 'General'}</span>
                  <button onClick={() => deleteQ(q.id)} className="btn btn-sm btn-error"><Trash2 size={13} /></button>
                </div>
                <p style={{ fontWeight: 500, lineHeight: 1.7, marginBottom: 12 }}>{q.questionText}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt} style={{
                      padding: '8px 12px', borderRadius: 8, border: '1.5px solid',
                      borderColor: q.correctOption === opt ? 'var(--success)' : 'var(--border)',
                      background: q.correctOption === opt ? 'rgba(16,185,129,0.06)' : 'transparent',
                      fontSize: '0.875rem',
                    }}>
                      <span style={{ fontWeight: 700, marginRight: 6, color: q.correctOption === opt ? 'var(--success)' : 'var(--text-muted)' }}>{OPT_LABELS[opt]}.</span>
                      {q[`option${OPT_LABELS[opt]}`]}
                    </div>
                  ))}
                </div>
                {q.explanation && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--info)' }}><strong>Explanation:</strong> {q.explanation}</div>}
              </div>
            ))}
          </div>
        )
      )}

      {/* Add/Bulk Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{bulkMode ? '📥 Bulk Import Questions' : '➕ Add Question'}</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            {bulkMode ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Paste a JSON array of questions. Each must have: questionText, optionA, optionB, optionC, optionD, correctOption (a/b/c/d), and optionally: explanation, marks, negativeMarks, subject, topic.
                </p>
                <textarea className="form-input" rows={10} style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }} value={bulkJson} onChange={e => setBulkJson(e.target.value)} placeholder='[{"questionText":"Q?","optionA":"A","optionB":"B","optionC":"C","optionD":"D","correctOption":"a"}]' />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Question Text *</label>
                  <textarea className="form-input" rows={3} value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div className="form-group" key={opt}>
                      <label className="form-label">Option {opt} *</label>
                      <input className="form-input" value={form[`option${opt}`]} onChange={e => setForm(f => ({ ...f, [`option${opt}`]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Correct Option *</label>
                    <select className="form-select" value={form.correctOption} onChange={e => setForm(f => ({ ...f, correctOption: e.target.value }))}>
                      {['a','b','c','d'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marks</label>
                    <input type="number" step="0.5" className="form-input" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: +e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Neg. Marks</label>
                    <input type="number" step="0.25" className="form-input" value={form.negativeMarks} onChange={e => setForm(f => ({ ...f, negativeMarks: +e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Maths" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Explanation</label>
                  <textarea className="form-input" rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button onClick={() => setModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={save} disabled={saving || !selectedTest} className="btn btn-primary">
                <Save size={15} /> {saving ? 'Saving...' : bulkMode ? 'Import All' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
