import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, X, Save, Upload, Edit2,
  CheckCircle, MinusCircle, Eye, AlertTriangle,
  AlertCircle, ArrowLeft, Check,
} from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const initQ = {
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'a', explanation: '', marks: 2, negativeMarks: 0.5, subject: '', topic: '',
};

const OPT_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };
const VALID_OPTIONS = new Set(['a', 'b', 'c', 'd']);

// ── Client-side validation (mirrors backend logic) ───────────────────────────
function validateAndPreview(qList) {
  // Normalise
  const rows = qList.map((q, i) => ({
    _index: i,
    questionText:  (q.questionText  || q.question_text  || '').trim(),
    optionA:       (q.optionA       || q.option_a       || '').trim(),
    optionB:       (q.optionB       || q.option_b       || '').trim(),
    optionC:       (q.optionC       || q.option_c       || '').trim(),
    optionD:       (q.optionD       || q.option_d       || '').trim(),
    correctOption: (q.correctOption || q.correct_option || '').trim().toLowerCase(),
    explanation:   q.explanation    || '',
    // Keep raw value (null/undefined if missing) so required validation can catch it
    marks:         (q.marks !== undefined && q.marks !== null) ? q.marks : null,
    negativeMarks: (q.negativeMarks !== undefined && q.negativeMarks !== null)
                     ? q.negativeMarks
                     : (q.negative_marks !== undefined && q.negative_marks !== null ? q.negative_marks : null),
    subject:       q.subject        || '',
  }));

  // Per-row errors
  rows.forEach(row => {
    const errs = [];
    if (!row.questionText)    errs.push('questionText is required');
    if (!row.optionA)         errs.push('optionA is required');
    if (!row.optionB)         errs.push('optionB is required');
    if (!row.optionC)         errs.push('optionC is required');
    if (!row.optionD)         errs.push('optionD is required');
    if (!row.correctOption)   errs.push('correctOption is required');
    else if (!VALID_OPTIONS.has(row.correctOption))
      errs.push(`correctOption must be a/b/c/d (got "${row.correctOption}")`);
    if (row.marks === null || row.marks === undefined || row.marks === '')
      errs.push('marks is required');
    if (row.negativeMarks === null || row.negativeMarks === undefined || row.negativeMarks === '')
      errs.push('negativeMarks is required');
    if (!row.explanation)    errs.push('explanation is required');
    if (!row.subject)        errs.push('subject is required');
    row.errors = errs;
    row.isDuplicate = false;
    row.duplicateOf = null;
  });

  // Duplicate detection
  const seen = new Map(); // normalised key → first index
  rows.forEach((row, i) => {
    if (!row.questionText) return;
    const key = row.questionText.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) {
      row.isDuplicate = true;
      row.duplicateOf = seen.get(key) + 1; // 1-based
    } else {
      seen.set(key, i);
    }
  });

  return rows;
}

// ── QuestionForm (must live at module level to avoid remount on each render) ──
function QuestionForm({ values, onChange, subjectOptions = [] }) {
  return (
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
            <select className="form-select" value={values.subject}
              onChange={e => onChange(f => ({ ...f, subject: e.target.value }))}>
              <option value="">— Select Subject —</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 18, width: '100%', maxWidth: 400, boxShadow: '0 25px 70px rgba(0,0,0,0.55)', overflow: 'hidden' }}>
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

// ── Bulk Import Modal (two-step: Input → Preview → Import) ───────────────────
function BulkImportModal({ onClose, onImport }) {
  const [step, setStep]           = useState('input'); // 'input' | 'preview'
  const [bulkJson, setBulkJson]   = useState('');
  const [parseError, setParseError] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const errorCount     = previewRows.filter(r => r.errors.length > 0).length;
  const duplicateCount = previewRows.filter(r => r.isDuplicate).length;
  const hasIssues      = errorCount > 0 || duplicateCount > 0;

  const handlePreview = () => {
    setParseError('');
    let parsed;
    try {
      parsed = JSON.parse(bulkJson.trim());
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array [ ... ]');
      if (parsed.length === 0)   throw new Error('Array is empty — paste at least one question.');
    } catch (e) {
      setParseError('Invalid JSON: ' + e.message);
      return;
    }
    setPreviewRows(validateAndPreview(parsed));
    setStep('preview');
    setImportError('');
  };

  const handleImport = async () => {
    if (hasIssues) return;
    setImporting(true);
    setImportError('');
    try {
      await onImport(previewRows);
      onClose();
    } catch (err) {
      setImportError(err.response?.data?.error || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  /* ── Styles (inline to avoid polluting global CSS) ── */
  const statusBadge = (row) => {
    if (row.errors.length > 0)  return { label: '❌ Error',     bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
    if (row.isDuplicate)        return { label: '⚠️ Duplicate', bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.35)' };
    return                             { label: '✅ OK',         bg: 'rgba(16,185,129,0.10)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' };
  };

  const rowBg = (row) => {
    if (row.errors.length > 0) return 'rgba(239,68,68,0.04)';
    if (row.isDuplicate)       return 'rgba(245,158,11,0.05)';
    return 'transparent';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: step === 'preview' ? 1100 : 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {step === 'preview' && (
              <button onClick={() => { setStep('input'); setImportError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>
                {step === 'input' ? '📥 Bulk Import Questions' : '🔍 Preview & Validate'}
              </h3>
              {step === 'preview' && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {previewRows.length} questions parsed ·{' '}
                  {errorCount > 0 && <span style={{ color: '#ef4444' }}>{errorCount} error{errorCount > 1 ? 's' : ''} · </span>}
                  {duplicateCount > 0 && <span style={{ color: '#f59e0b' }}>{duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} · </span>}
                  {!hasIssues && <span style={{ color: '#10b981' }}>All good — ready to import!</span>}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Step 1: Input ── */}
        {step === 'input' && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', background: 'rgba(29,58,138,0.06)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Paste a <strong style={{ color: 'var(--text)' }}>JSON array</strong>. All fields are required:{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>questionText</code>,{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>optionA</code>–
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>optionD</code>,{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>correctOption</code>{' '}(a/b/c/d),{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>marks</code>,{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>negativeMarks</code>,{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>explanation</code>,{' '}
              <code style={{ background: 'var(--surface-2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>subject</code>.
            </div>

            <textarea
              value={bulkJson}
              onChange={e => { setBulkJson(e.target.value); setParseError(''); }}
              placeholder={'[\n  {\n    "questionText": "2 + 2 = ?",\n    "optionA": "3",\n    "optionB": "4",\n    "optionC": "5",\n    "optionD": "6",\n    "correctOption": "b",\n    "marks": 2,\n    "negativeMarks": 0.5,\n    "explanation": "2+2=4",\n    "subject": "Maths"\n  }\n]'}
              style={{
                flex: 1,
                minHeight: 360,
                fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                fontSize: '0.82rem',
                lineHeight: 1.6,
                resize: 'vertical',
                padding: '14px',
                borderRadius: 10,
                border: parseError ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                outline: 'none',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)',
              }}
            />

            {parseError && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem', fontWeight: 600 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {parseError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={onClose} className="btn btn-outline">Cancel</button>
              <button onClick={handlePreview} disabled={!bulkJson.trim()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={15} /> Preview & Validate
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview Table ── */}
        {step === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* Summary bar */}
            {hasIssues && (
              <div style={{ display: 'flex', gap: 12, padding: '10px 24px', background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
                {errorCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                    <AlertCircle size={14} /> {errorCount} row{errorCount > 1 ? 's have' : ' has'} missing/invalid fields — fix them and re-paste
                  </div>
                )}
                {duplicateCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                    <AlertTriangle size={14} /> {duplicateCount} duplicate question{duplicateCount > 1 ? 's' : ''} detected within the batch
                  </div>
                )}
              </div>
            )}

            {/* Scrollable table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 4px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', position: 'sticky', top: 0, zIndex: 2 }}>
                    {['#', 'Status', 'Question', 'A', 'B', 'C', 'D', '✓', 'Marks', 'Neg', 'Subject'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const badge  = statusBadge(row);
                    const hasErr = row.errors.length > 0 || row.isDuplicate;
                    return (
                      <>
                        <tr key={`row-${i}`} style={{ background: rowBg(row), borderBottom: hasErr ? 'none' : '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', maxWidth: 280, lineHeight: 1.5 }}>
                            {row.questionText
                              ? <span style={{ fontWeight: 500 }}>{row.questionText.length > 100 ? row.questionText.slice(0, 100) + '…' : row.questionText}</span>
                              : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>missing</span>}
                          </td>
                          {['optionA','optionB','optionC','optionD'].map(k => (
                            <td key={k} style={{ padding: '10px 12px', maxWidth: 120 }}>
                              {row[k]
                                ? <span style={{ color: row.correctOption === k.slice(-1).toLowerCase() ? '#10b981' : 'inherit' }}>{row[k].length > 40 ? row[k].slice(0,40)+'…' : row[k]}</span>
                                : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>missing</span>}
                            </td>
                          ))}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {VALID_OPTIONS.has(row.correctOption)
                              ? <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{row.correctOption.toUpperCase()}</span>
                              : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>??</span>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#10b981' }}>+{row.marks}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}>−{row.negativeMarks}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{row.subject || '—'}</td>
                        </tr>
                        {/* Error / Duplicate detail row */}
                        {hasErr && (
                          <tr key={`err-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={11} style={{ padding: '6px 12px 10px 44px', background: rowBg(row) }}>
                              {row.errors.length > 0 && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {row.errors.map((e, ei) => (
                                    <span key={ei} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                                      <AlertCircle size={10} /> {e}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {row.isDuplicate && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', marginTop: row.errors.length > 0 ? 4 : 0 }}>
                                  <AlertTriangle size={10} /> Duplicate of Row {row.duplicateOf}
                                </span>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
              <div>
                {importError && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                    <AlertCircle size={14} /> {importError}
                  </div>
                )}
                {hasIssues && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Fix the errors above, then click ← Back to re-paste your JSON.
                  </div>
                )}
                {!hasIssues && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                    <Check size={14} /> {previewRows.length} questions validated — ready to insert
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} className="btn btn-outline">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={hasIssues || importing}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: hasIssues ? 0.45 : 1, cursor: hasIssues ? 'not-allowed' : 'pointer' }}
                >
                  {importing ? (
                    <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Importing…</>
                  ) : (
                    <><Upload size={15} /> Import {previewRows.length} Questions</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminQuestions() {
  const [searchParams] = useSearchParams();

  const [tests, setTests]               = useState([]);
  const [selectedTest, setSelectedTest] = useState(searchParams.get('testId') || '');
  const [questions, setQuestions]       = useState([]);
  const [loadingQ, setLoadingQ]         = useState(false);

  // Add modal
  const [addModal, setAddModal]     = useState(false);
  const [form, setForm]             = useState(initQ);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [modalError, setModalError] = useState('');

  // Bulk import modal
  const [bulkModal, setBulkModal]   = useState(false);

  // Confirm modal
  const [confirmState, setConfirmState] = useState(null);
  const closeConfirm = () => setConfirmState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });

  // Edit modal
  const [editModal, setEditModal]       = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editForm, setEditForm]         = useState(initQ);
  const [editSaving, setEditSaving]     = useState(false);

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

  // ── Derive subject options ──────────────────────────────────────────────────
  const selectedTestObj = tests.find(t => String(t.id) === String(selectedTest));
  const subjectOptions = selectedTestObj
    ? [...new Set(
        tests
          .filter(t => t.category === selectedTestObj.category && t.subject)
          .map(t => t.subject)
      )]
    : [];

  // ── ADD ────────────────────────────────────────────────────────────────────
  const openAddModal = () => {
    const test = tests.find(t => String(t.id) === String(selectedTest));
    setForm({
      ...initQ,
      marks:         test?.defaultMarks         ?? 2,
      negativeMarks: test?.defaultNegativeMarks  ?? 0.5,
      subject:       test?.subject               || '',
    });
    setModalError('');
    setAddModal(true);
  };

  const saveAdd = async () => {
    const { questionText, optionA, optionB, optionC, optionD } = form;
    if (!questionText?.trim() || !optionA?.trim() || !optionB?.trim() || !optionC?.trim() || !optionD?.trim()) {
      setModalError('Question text and all 4 options (A, B, C, D) are required.');
      return;
    }
    setSaving(true); setModalError('');
    try {
      await adminApi.createQuestion(selectedTest, form);
      setMsg('✅ Question added!');
      setAddModal(false);
      reloadQuestions();
    } catch (err) { setModalError(err.response?.data?.error || 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  // ── BULK IMPORT ────────────────────────────────────────────────────────────
  const handleBulkImport = async (previewRows) => {
    // Send the already-normalised rows directly
    await adminApi.bulkImport(selectedTest, previewRows);
    setMsg(`✅ ${previewRows.length} questions imported successfully!`);
    reloadQuestions();
  };

  // ── EDIT ───────────────────────────────────────────────────────────────────
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
    setModalError('');
    setEditModal(true);
  };

  const saveEdit = async () => {
    const { questionText, optionA, optionB, optionC, optionD } = editForm;
    if (!questionText?.trim() || !optionA?.trim() || !optionB?.trim() || !optionC?.trim() || !optionD?.trim()) {
      setModalError('Question text and all 4 options (A, B, C, D) are required.');
      return;
    }
    setEditSaving(true); setModalError('');
    try {
      await adminApi.updateQuestion(editQuestion.id, editForm);
      setMsg('✅ Question updated!');
      setEditModal(false);
      reloadQuestions();
    } catch (err) { setModalError(err.response?.data?.error || 'Failed to update. Please try again.'); }
    finally { setEditSaving(false); }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const deleteQ = (id) => {
    askConfirm(
      'Delete Question?',
      'This will permanently delete the question. This cannot be undone.',
      async () => {
        closeConfirm();
        try {
          await adminApi.deleteQuestion(id);
          setQuestions(qs => qs.filter(q => q.id !== id));
          setMsg('✅ Question deleted successfully.');
        } catch (err) {
          setMsg('❌ ' + (err.response?.data?.error || 'Failed to delete question. Please try again.'));
        }
      }
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Questions Bank</h1>
          <p className="page-subtitle">Manage MCQ questions — set marks &amp; negative marks per question</p>
        </div>
        {selectedTest && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setBulkModal(true)}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Q{i + 1}{q.subject ? ` · ${q.subject}` : ''}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <CheckCircle size={11} /> +{q.marks ?? 2}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid', borderColor: q.correctOption === opt ? 'var(--success)' : 'var(--border)', background: q.correctOption === opt ? 'rgba(16,185,129,0.06)' : 'transparent', fontSize: '0.875rem' }}>
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

      {/* ── Bulk Import Modal ─────────────────────────────────────────────────── */}
      {bulkModal && (
        <BulkImportModal
          onClose={() => setBulkModal(false)}
          onImport={handleBulkImport}
        />
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {addModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>➕ Add Question</h3>
              <button onClick={() => setAddModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <QuestionForm values={form} onChange={setForm} subjectOptions={subjectOptions} />
            <div className="modal-footer" style={{ flexDirection: 'column', gap: 10 }}>
              {modalError && (
                <div style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
                  ❌ {modalError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
                <button onClick={() => setAddModal(false)} className="btn btn-outline">Cancel</button>
                <button onClick={saveAdd} disabled={saving || !selectedTest} className="btn btn-primary">
                  <Save size={15} /> {saving ? 'Saving...' : 'Add Question'}
                </button>
              </div>
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
            <div className="modal-footer" style={{ flexDirection: 'column', gap: 10 }}>
              {modalError && (
                <div style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
                  ❌ {modalError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditModal(false)} className="btn btn-outline">Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="btn btn-primary">
                  <Save size={15} /> {editSaving ? 'Saving...' : 'Update Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ─────────────────────────────────────────────────────── */}
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
