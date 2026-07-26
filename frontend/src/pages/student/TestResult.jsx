import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, MinusCircle, LayoutDashboard, RefreshCw } from 'lucide-react';
import { testsApi } from '../../api/tests.api.js';
import { useLang } from '../../context/LanguageContext.jsx';

const OPT_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };
const OPT_TEXT = (ans, o) => ({ a: ans.optionA, b: ans.optionB, c: ans.optionC, d: ans.optionD }[o]);

function ScoreRing({ percentage }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1.5s ease' }} />
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--color-text)">{percentage}%</text>
      <text x="70" y="84" textAnchor="middle" fontSize="12" fill="var(--color-text-muted)">Score</text>
    </svg>
  );
}

export default function TestResult() {
  const { attemptId } = useParams();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    testsApi.getResult(attemptId)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="loader-spinner" /></div>;
  if (!data) return null;

  const { attempt, answers } = data;
  const pct = attempt.percentage;

  const resultColor = pct >= 70 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-error)';
  const resultMsg = pct >= 70 ? '🎉 Excellent!' : pct >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!';

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Score Card */}
        <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{t('tests.result')}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
            {data?.attempt?.testTitle || 'Mock Test'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <ScoreRing percentage={pct} />
          </div>

          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: resultColor, marginBottom: 8 }}>{resultMsg}</p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
            You scored <strong>{attempt.score}</strong> out of <strong>{attempt.totalMarks}</strong> marks
          </p>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: <CheckCircle size={22} color="var(--color-success)" />, val: attempt.correctCount, label: t('tests.correct'), bg: 'rgba(16,185,129,0.08)' },
              { icon: <XCircle size={22} color="var(--color-error)" />, val: attempt.wrongCount, label: t('tests.wrong'), bg: 'rgba(239,68,68,0.08)' },
              { icon: <MinusCircle size={22} color="var(--color-text-muted)" />, val: attempt.unattempted, label: t('tests.skipped'), bg: 'rgba(107,114,128,0.08)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 16px', background: s.bg, borderRadius: 'var(--radius-md)' }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowReview(r => !r)} className="btn btn-outline">
              <RefreshCw size={16} /> {showReview ? 'Hide Review' : t('tests.viewReview')}
            </button>
            <Link to="/dashboard" className="btn btn-primary">
              <LayoutDashboard size={16} /> {t('tests.backToDash')}
            </Link>
            <Link to="/tests" className="btn btn-outline">More Tests</Link>
          </div>
        </div>

        {/* Answer Review */}
        {showReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Answer Review</h3>
            {answers.map((ans, i) => {
              const opts = ['a', 'b', 'c', 'd'];
              return (
                <div key={ans.questionId} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Q{i + 1}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700,
                      color: ans.isCorrect === true ? 'var(--color-success)' : ans.isCorrect === false ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                      {ans.isCorrect === true ? '✓ Correct' : ans.isCorrect === false ? '✗ Wrong' : '— Skipped'}
                    </span>
                  </div>
                  <p style={{ fontWeight: 500, lineHeight: 1.7, marginBottom: 16 }}>{ans.questionText}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {opts.map(opt => {
                      const isCorrect = opt === ans.correctOption;
                      const isSelected = opt === ans.selectedOption;
                      const bg = isCorrect ? 'rgba(16,185,129,0.08)' : isSelected && !isCorrect ? 'rgba(239,68,68,0.08)' : 'transparent';
                      const border = isCorrect ? 'var(--color-success)' : isSelected && !isCorrect ? 'var(--color-error)' : 'var(--color-border)';
                      return (
                        <div key={opt} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)', border: `1.5px solid ${border}`, background: bg,
                        }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isCorrect ? 'var(--color-success)' : isSelected && !isCorrect ? 'var(--color-error)' : 'var(--color-text-muted)', width: 20 }}>
                            {OPT_LABELS[opt]}
                          </span>
                          <span style={{ fontSize: '0.9rem' }}>{OPT_TEXT(ans, opt)}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ Correct</span>}
                          {isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}>Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  {ans.explanation && (
                    <div style={{ padding: '12px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-primary)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>Explanation</span>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{ans.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
