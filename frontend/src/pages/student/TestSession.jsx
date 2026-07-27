import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, X } from 'lucide-react';
import { testsApi } from '../../api/tests.api.js';
import { useLang } from '../../context/LanguageContext.jsx';

export default function TestSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});        // { questionId: 'a'|'b'|'c'|'d' }
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);
  // BUG-007: Keep a ref that always holds the latest answers so the timer
  // callback (which captures a stale closure) can still read current answers
  const answersRef = useRef({});

  useEffect(() => {
    testsApi.getById(id)
      .then(res => {
        setTest(res.data.test);
        setQuestions(res.data.questions);
        setTimeLeft(res.data.test.durationMinutes * 60);
      })
      .catch(() => navigate('/tests'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!test) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test]);

  // BUG-007: Wrapper that updates both state and the ref together so the
  // stale handleSubmit inside setInterval always reads current answers
  const updateAnswers = (updater) => {
    setAnswers(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      answersRef.current = next;
      return next;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !showConfirm) { setShowConfirm(true); return; }
    setShowConfirm(false);
    setSubmitting(true);
    clearInterval(timerRef.current);
    // BUG-007: Use answersRef.current — not the stale `answers` from closure
    const currentAnswers = answersRef.current;
    const answerList = Object.entries(currentAnswers).map(([questionId, selectedOption]) => ({ questionId: parseInt(questionId), selectedOption }));
    const timeTakenSec = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      const { data } = await testsApi.submit(id, { answers: answerList, timeTakenSec });
      navigate(`/tests/result/${data.attempt.id}`);
    } catch (err) {
      alert('Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const isWarning = timeLeft <= 300;
  const q = questions[currentQ];
  const OPTIONS = ['a', 'b', 'c', 'd'];
  const OPT_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };
  const OPT_TEXT = (q, o) => ({ a: q?.optionA, b: q?.optionB, c: q?.optionC, d: q?.optionD }[o]);

  if (loading) return <div className="loader" style={{ minHeight: '100vh' }}><div className="loader-spinner" /></div>;
  if (!test) return null;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="test-header">
        <div className="container flex-between">
          <div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Test in progress</span>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{test.title}</h2>
          </div>
          <div className="flex" style={{ gap: 20, alignItems: 'center' }}>
            <div className={`test-timer ${isWarning ? 'warning' : ''}`} style={{ color: isWarning ? '#ef4444' : 'white' }}>
              <Clock size={18} /> {fmtTime(timeLeft)}
            </div>
            <button onClick={() => setShowConfirm(true)} className="btn btn-sm" disabled={submitting}
              style={{ background: submitting ? '#6b7280' : '#ef4444', color: 'white', borderColor: 'transparent' }}>
              {submitting ? 'Submitting...' : t('tests.submit')}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Question Area */}
        {q && (
          <div>
            <div className="question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {q.marks}m · -{parseFloat(q.negativeMarks || 0).toFixed(2)}m
                </span>
              </div>
              <p className="question-text">{q.questionText}</p>
              <div className="options-grid">
                {OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                    onClick={() => {
                      // BUG-009: Previously set key to `undefined` instead of deleting it,
                      // breaking the answered-count display and palette coloring.
                      updateAnswers(a => {
                        const next = { ...a };
                        if (next[q.id] === opt) delete next[q.id];
                        else next[q.id] = opt;
                        return next;
                      });
                    }}
                  >
                    <span className="option-letter">{OPT_LABELS[opt]}</span>
                    <span>{OPT_TEXT(q, opt)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="btn btn-outline"
              >← Previous</button>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {Object.keys(answers).length} / {questions.length} answered
              </span>
              {currentQ < questions.length - 1
                ? <button onClick={() => setCurrentQ(q => q + 1)} className="btn btn-primary">Next →</button>
                : <button onClick={() => handleSubmit(false)} className="btn btn-primary" disabled={submitting}>{t('tests.submit')}</button>
              }
            </div>
          </div>
        )}

        {/* Question Palette */}
        <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>Question Palette</h4>
          <div className="q-palette">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`q-palette-btn ${i === currentQ ? 'current' : answers[q.id] ? 'answered' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { cls: 'answered', label: 'Answered' },
              { cls: 'current', label: 'Current' },
              { cls: '', label: 'Not Visited' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <div className={`q-palette-btn ${s.cls}`} style={{ width: 20, height: 20, pointerEvents: 'none' }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Submit Test?</h3>
              <button onClick={() => setShowConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                You have <strong style={{ color: 'var(--color-text)' }}>
                  {questions.length - Object.keys(answers).length}
                </strong> {t('tests.unanswered')}. Are you sure you want to submit?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-outline btn-full">Review Answers</button>
              <button onClick={() => handleSubmit(true)} className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
