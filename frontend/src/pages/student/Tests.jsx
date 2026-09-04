import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Target, ChevronRight, Filter, X, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { testsApi } from '../../api/tests.api.js';

const DIFF_COLOR = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };
const TESTS_PER_PAGE = 9;

/* ── Pagination Component ──────────────────────────────────────────────────── */
function Pagination({ currentPage, totalPages, onPageChange, loading }) {
  if (totalPages <= 1) return null;

  // Build the page numbers to display with ellipsis
  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const result = [];
    const addPage = (n) => result.push(n);
    const addEllipsis = () => result.push('...');

    addPage(1);
    if (currentPage > 3) addEllipsis();

    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) addPage(i);

    if (currentPage < totalPages - 2) addEllipsis();
    addPage(totalPages);

    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="pagination" aria-label="Pagination">
      {/* Previous */}
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        aria-label="Previous page"
        id="pagination-prev"
      >
        <ChevronLeft size={16} />
        <span>Prev</span>
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={p}
            id={`pagination-page-${p}`}
            className={`pagination-btn${p === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(p)}
            disabled={p === currentPage || loading}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        aria-label="Next page"
        id="pagination-next"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Main Tests Page ───────────────────────────────────────────────────────── */
export default function Tests() {
  const [tests, setTests]             = useState([]);
  const [pagination, setPagination]   = useState(null);   // { total, page, limit, totalPages }
  const [loading, setLoading]         = useState(true);
  const [pageLoading, setPageLoading] = useState(false);  // subtle loading for page changes

  const [activeCourse, setActiveCourse]   = useState('All');
  const [activeSubject, setActiveSubject] = useState('All');
  const [filterOpen, setFilterOpen]       = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);

  // All unique courses/subjects derived from the CURRENT page's tests
  // (kept client-side for fast filter UI rendering)
  const [allCourses, setAllCourses]   = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const cardsRef = useRef(null);

  /* ── Fetch ── */
  const fetchTests = useCallback(async (page, course, subject, isPageChange = false) => {
    isPageChange ? setPageLoading(true) : setLoading(true);

    const params = { page, limit: TESTS_PER_PAGE };
    if (course  !== 'All') params.category = course;
    if (subject !== 'All') params.subject  = subject;

    try {
      const res = await testsApi.getAll(params);
      setTests(res.data.tests || []);
      setPagination(res.data.pagination || null);
    } catch {
      setTests([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, []);

  // Initial load — also build the full course/subject lists from a single all-fetch
  useEffect(() => {
    // Fetch all tests once to populate sidebar filter options (no limit trick needed
    // since we only need category/subject metadata — a lightweight all-fetch)
    testsApi.getAll({ limit: 50 }).then(res => {
      const all = res.data.tests || [];
      const uniqueCourses  = [...new Set(all.map(t => t.category).filter(Boolean))].sort();
      const uniqueSubjects = [...new Set(all.map(t => t.subject).filter(Boolean))].sort();
      setAllCourses(['All', ...uniqueCourses]);
      setAllSubjects(['All', ...uniqueSubjects]);
    }).catch(() => {});
  }, []);

  // Re-fetch whenever page / filters change
  useEffect(() => {
    fetchTests(currentPage, activeCourse, activeSubject, currentPage > 1);
  }, [currentPage, activeCourse, activeSubject, fetchTests]);

  /* ── Filter handlers ── */
  const handleCourseChange = (course) => {
    setActiveCourse(course);
    setActiveSubject('All');
    setCurrentPage(1);
  };

  const handleSubjectChange = (subject) => {
    setActiveSubject(subject);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveCourse('All');
    setActiveSubject('All');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to the cards grid
    cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Derived values ── */
  // Subject options contextual to the chosen course (from full pre-fetched lists)
  const visibleSubjects = useMemo(() => {
    if (activeCourse === 'All') return allSubjects;
    // Filter the pre-fetched subjects by course — fetch a quick lookup
    return allSubjects; // fallback: show all; server will filter correctly
  }, [activeCourse, allSubjects]);

  const hasActiveFilter   = activeCourse !== 'All' || activeSubject !== 'All';
  const activeFilterCount = (activeCourse !== 'All' ? 1 : 0) + (activeSubject !== 'All' ? 1 : 0);
  const totalTests        = pagination?.total ?? tests.length;
  const totalPages        = pagination?.totalPages ?? 1;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1f3d 0%, #1d3a8a 50%, #1e1b4b 100%)',
        padding: '56px 0 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <h1 className="heading-lg" style={{ color: 'white', marginBottom: 8 }}>Mock Tests</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem' }}>Practice with our comprehensive test series</p>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 24px 60px' }}>

        {/* ── Collapsible Filter Panel ─────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(99,102,241,0.1)',
          marginBottom: 28,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <button
            onClick={() => setFilterOpen(o => !o)}
            id="filter-toggle-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: '15px 20px',
              background: filterOpen
                ? 'rgba(99,102,241,0.06)'
                : 'linear-gradient(90deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
              border: 'none', cursor: 'pointer',
              borderBottom: filterOpen ? '1px solid rgba(99,102,241,0.2)' : 'none',
              color: 'var(--color-text)',
              transition: 'background 0.2s',
            }}
          >
            <Filter size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Filters</span>

            {activeFilterCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white',
                borderRadius: 99, fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px',
              }}>
                {activeFilterCount} active
              </span>
            )}

            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {!loading && pagination && `${totalTests} tests`}
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
                  {allCourses.length === 0
                    ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: 90, height: 34, borderRadius: 20 }} />)
                    : allCourses.map(course => (
                      <button
                        key={course}
                        id={`filter-course-${course.replace(/\s+/g, '-').toLowerCase()}`}
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
              {visibleSubjects.length > 1 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Subject
                  </p>
                  <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {visibleSubjects.map(subject => (
                      <button
                        key={subject}
                        id={`filter-subject-${subject.replace(/\s+/g, '-').toLowerCase()}`}
                        className={`filter-tab ${activeSubject === subject ? 'active' : ''}`}
                        onClick={() => handleSubjectChange(subject)}
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
                    id="filter-clear-btn"
                    className="btn btn-sm btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleClearFilters}
                  >
                    <X size={12} /> Clear filters
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Test Cards ──────────────────────────────────────────────────── */}
        <div ref={cardsRef} style={{ position: 'relative' }}>
          {/* Page-change loading overlay */}
          {pageLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(var(--color-bg-rgb, 243,244,246), 0.6)',
              backdropFilter: 'blur(2px)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="spinner" />
            </div>
          )}

          {loading ? (
            <div className="grid-3">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
            </div>
          ) : tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <FileText size={48} color="var(--color-text-light)" style={{ margin: '0 auto 16px' }} />
              <h3 className="text-muted">No tests found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
                Try adjusting the filters above.
              </p>
            </div>
          ) : (
            <div className="grid-3">
              {tests.map(test => (
                <div key={test.id} className="card" style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: pageLoading ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}>
                  {/* Top row — category + difficulty */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span className="badge badge-primary">{test.category}</span>
                      {test.subject && (
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.72rem' }}>
                          {test.subject}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: DIFF_COLOR[test.difficulty] || '#666', textTransform: 'capitalize', flexShrink: 0, marginTop: 2 }}>
                      ● {test.difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '0.98rem', fontWeight: 700, lineHeight: 1.45,
                    marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    minHeight: '2.9em',
                  }}>
                    {test.title}
                  </h3>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      <Target size={13} /> {test.totalQuestions} Questions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      <Clock size={13} /> {test.durationMinutes} Minutes
                    </span>
                  </div>

                  {/* Button always at bottom */}
                  <Link to={`/tests/${test.id}/session`} className="btn btn-primary btn-full" style={{ marginTop: 'auto' }}>
                    Start Test <ChevronRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination Bar ───────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: 36 }}>
            {/* Result info */}
            <p style={{
              textAlign: 'center', fontSize: '0.8rem',
              color: 'var(--color-text-muted)', marginBottom: 14,
            }}>
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              {' '}({totalTests} total tests)
            </p>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={pageLoading}
            />
          </div>
        )}

      </div>
    </div>
  );
}
