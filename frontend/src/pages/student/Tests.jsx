import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Target, ChevronRight, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { testsApi } from '../../api/tests.api.js';

const DIFF_COLOR = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };

export default function Tests() {

  const [tests, setTests]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeCourse, setActiveCourse]   = useState('All');
  const [activeSubject, setActiveSubject] = useState('All');
  const [filterOpen, setFilterOpen]       = useState(true);

  useEffect(() => {
    testsApi.getAll()
      .then(res => setTests(res.data.tests || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  const courses = useMemo(() => {
    const unique = [...new Set(tests.map(t => t.category).filter(Boolean))];
    return ['All', ...unique.sort()];
  }, [tests]);

  const subjects = useMemo(() => {
    const source = activeCourse === 'All' ? tests : tests.filter(t => t.category === activeCourse);
    const unique  = [...new Set(source.map(t => t.subject).filter(Boolean))];
    return ['All', ...unique.sort()];
  }, [tests, activeCourse]);

  const handleCourseChange = (course) => {
    setActiveCourse(course);
    setActiveSubject('All');
  };

  const filtered = useMemo(() => {
    return tests.filter(t => {
      if (activeCourse !== 'All' && t.category !== activeCourse) return false;
      if (activeSubject !== 'All' && t.subject   !== activeSubject) return false;
      return true;
    });
  }, [tests, activeCourse, activeSubject]);

  const hasActiveFilter   = activeCourse !== 'All' || activeSubject !== 'All';
  const activeFilterCount = (activeCourse !== 'All' ? 1 : 0) + (activeSubject !== 'All' ? 1 : 0);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1d3a8a 100%)', padding: '48px 0 72px' }}>
        <div className="container">
          <h1 className="heading-lg" style={{ color: 'white', marginBottom: 8 }}>Mock Tests</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem' }}>Practice with our comprehensive test series</p>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px 60px', marginTop: -32 }}>

        {/* ── Collapsible Filter Panel ─────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 28,
          overflow: 'hidden',
        }}>
          {/* Header — always visible, click to collapse */}
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: '14px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: filterOpen ? '1px solid var(--color-border)' : 'none',
              color: 'var(--color-text)',
            }}
          >
            <Filter size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filters</span>

            {activeFilterCount > 0 && (
              <span style={{
                background: 'var(--color-primary)', color: 'white',
                borderRadius: 99, fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px',
              }}>
                {activeFilterCount} active
              </span>
            )}

            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {!loading && `${filtered.length} / ${tests.length} tests`}
              {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {/* Collapsible body */}
          {filterOpen && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Course row */}
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Course
                </p>
                <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: 8 }}>
                  {loading
                    ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: 90, height: 34, borderRadius: 20 }} />)
                    : courses.map(course => (
                      <button
                        key={course}
                        className={`filter-tab ${activeCourse === course ? 'active' : ''}`}
                        onClick={() => handleCourseChange(course)}
                      >
                        {course}
                      </button>
                    ))
                  }
                </div>
              </div>

              {/* Subject row */}
              {!loading && subjects.length > 1 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Subject
                  </p>
                  <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        className={`filter-tab ${activeSubject === subject ? 'active' : ''}`}
                        onClick={() => setActiveSubject(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear button */}
              {hasActiveFilter && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => { setActiveCourse('All'); setActiveSubject('All'); }}
                  >
                    <X size={12} /> Clear filters
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Test Cards ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <FileText size={48} color="var(--color-text-light)" style={{ margin: '0 auto 16px' }} />
            <h3 className="text-muted">No tests found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
              Try adjusting the filters above.
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(test => (
              <div key={test.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="badge badge-primary">{test.category}</span>
                    {test.subject && (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.72rem' }}>
                        {test.subject}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: DIFF_COLOR[test.difficulty] || '#666', textTransform: 'capitalize', flexShrink: 0 }}>
                    ● {test.difficulty}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>{test.title}</h3>
                <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    <Target size={14} /> {test.totalQuestions} Questions
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    <Clock size={14} /> {test.durationMinutes} Minutes
                  </span>
                </div>
                <Link to={`/tests/${test.id}/session`} className="btn btn-primary btn-full">
                  Start Test <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
