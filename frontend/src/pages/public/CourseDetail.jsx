import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, BookOpen, Lock, Play, ChevronDown, ChevronUp,
  ArrowLeft, Layers, FileText, ExternalLink, CheckCircle,
  GraduationCap, PlayCircle, BookMarked, Zap, Star, Users,
  Shield, Award, TrendingUp,
} from 'lucide-react';
import { coursesApi } from '../../api/courses.api.js';
import { paymentApi } from '../../api/dashboard.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './CourseDetail.css';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (p) => `₹${(p / 100).toLocaleString('en-IN')}`;

const COLORS = {
  'Quantitative Aptitude':            { a: '#6366f1', g: 'rgba(99,102,241,0.3)',  b: 'rgba(99,102,241,0.08)',  d: 'rgba(99,102,241,0.2)' },
  'Numerical Aptitude':               { a: '#6366f1', g: 'rgba(99,102,241,0.3)',  b: 'rgba(99,102,241,0.08)',  d: 'rgba(99,102,241,0.2)' },
  'English Language & Comprehension': { a: '#10b981', g: 'rgba(16,185,129,0.3)',  b: 'rgba(16,185,129,0.08)', d: 'rgba(16,185,129,0.2)' },
  'English Language':                 { a: '#10b981', g: 'rgba(16,185,129,0.3)',  b: 'rgba(16,185,129,0.08)', d: 'rgba(16,185,129,0.2)' },
  'General Awareness':                { a: '#f59e0b', g: 'rgba(245,158,11,0.3)',  b: 'rgba(245,158,11,0.08)', d: 'rgba(245,158,11,0.2)' },
  'General/Banking Awareness':        { a: '#f59e0b', g: 'rgba(245,158,11,0.3)',  b: 'rgba(245,158,11,0.08)', d: 'rgba(245,158,11,0.2)' },
  'General Intelligence & Reasoning': { a: '#ef4444', g: 'rgba(239,68,68,0.3)',   b: 'rgba(239,68,68,0.08)',  d: 'rgba(239,68,68,0.2)' },
  'Reasoning Ability':                { a: '#ef4444', g: 'rgba(239,68,68,0.3)',   b: 'rgba(239,68,68,0.08)',  d: 'rgba(239,68,68,0.2)' },
  'Computer Awareness':               { a: '#8b5cf6', g: 'rgba(139,92,246,0.3)',  b: 'rgba(139,92,246,0.08)', d: 'rgba(139,92,246,0.2)' },
  'Typing/Skill Test':                { a: '#06b6d4', g: 'rgba(6,182,212,0.3)',   b: 'rgba(6,182,212,0.08)',  d: 'rgba(6,182,212,0.2)' },
};
const DC = { a: '#64748b', g: 'rgba(100,116,139,0.3)', b: 'rgba(100,116,139,0.08)', d: 'rgba(100,116,139,0.2)' };
const getColor = (s) => COLORS[s] || DC;

function groupBySubject(list) {
  const map = {};
  for (const ch of list) {
    const key = ch.subjectName || ch.subject || 'General';
    if (!map[key]) map[key] = [];
    map[key].push(ch);
  }
  return map;
}


/* ════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS — Player View (Enrolled)
════════════════════════════════════════════════════════════════════════════ */



/** Top bar for enrolled player */
function PlayerBar({ title, index, total, onBack }) {
  return (
    <div className="cd-bar">
      <button className="cd-bar-btn" onClick={onBack}>
        <ArrowLeft size={14} /> Back
      </button>
      <div className="cd-bar-divider" />
      <p className="cd-bar-title">{title}</p>
      <div className="cd-bar-right">
        <span className="cd-enrolled-pill"><CheckCircle size={11} /> Enrolled</span>
        <span className="cd-bar-counter">
          {index} <span className="cd-bar-counter-sep">/</span> {total}
        </span>
      </div>
    </div>
  );
}

/** Video player or placeholder — handles both external URLs and R2 signed URLs */
function VideoArea({ chapter, onFetchSignedUrl }) {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [fetching,    setFetching]    = useState(false);

  useEffect(() => {
    setResolvedUrl(null);
    if (!chapter) return;
    // If chapter already has a direct URL (external/YouTube), use it immediately
    if (chapter.videoUrl) {
      setResolvedUrl(chapter.videoUrl);
      return;
    }
    // If chapter has an R2 key, fetch a signed URL from the backend
    if (chapter.hasVideoKey) {
      setFetching(true);
      onFetchSignedUrl(chapter.id)
        .then(url => setResolvedUrl(url))
        .catch(() => setResolvedUrl(null))
        .finally(() => setFetching(false));
    }
  }, [chapter?.id, chapter?.videoUrl, chapter?.hasVideoKey]);

  return (
    <div className="cd-video-shell">
      {fetching ? (
        <div className="cd-no-video">
          <div className="loader-spinner" style={{ width: 32, height: 32 }} />
          <p className="cd-no-video-text">Loading video...</p>
        </div>
      ) : resolvedUrl ? (
        <div className="cd-video-wrap">
          <div className="cd-video-ratio">
            <iframe
              key={chapter.id}
              src={resolvedUrl}
              title={chapter.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      ) : (
        <div className="cd-no-video">
          <div className="cd-no-video-icon">
            <PlayCircle size={30} color="var(--cd-primary)" style={{ opacity: 0.5 }} />
          </div>
          <p className="cd-no-video-text">No video available for this chapter</p>
        </div>
      )}
    </div>
  );
}

/** Chapter title + description + nav + materials */
function ChapterInfoPanel({ chapter, prev, next, onPrev, onNext, materials }) {
  return (
    <div className="cd-info cd-s">
      <div className="cd-info-inner">

        {/* Chapter header */}
        {chapter && (
          <div className="cd-ch-meta-row">
            <div className="cd-ch-meta-col">
              <p className="cd-ch-label">Chapter {chapter.orderIndex}</p>
              <h2 className="cd-ch-title">{chapter.title}</h2>
              {chapter.description && <p className="cd-ch-desc">{chapter.description}</p>}
            </div>
            {chapter.durationMin > 0 && (
              <div className="cd-dur-pill">
                <Clock size={13} color="var(--cd-primary)" />
                <span className="cd-dur-pill-text">{chapter.durationMin}m</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="cd-nav">
          <button className={`cd-nb${prev ? ' on' : ''}`} onClick={() => prev && onPrev()} disabled={!prev}>
            <ArrowLeft size={14} />
            <span className="cd-nb-label">{prev ? prev.title : 'Previous'}</span>
          </button>
          <button className={`cd-nb next${next ? ' on' : ''}`} onClick={() => next && onNext()} disabled={!next}>
            <span className="cd-nb-label">{next ? next.title : 'Next'}</span>
            {next && <Play size={13} style={{ flexShrink: 0 }} />}
          </button>
        </div>

        {/* Study materials */}
        {materials.length > 0 && (
          <div className="cd-mat-section">
            <h3 className="cd-mat-heading">
              <BookMarked size={15} color="var(--cd-primary)" /> Study Materials
            </h3>
            <div className="cd-mat-list">
              {materials.map(m => (
                <div key={m.id} className="cd-mat">
                  <div className={`cd-mat-icon cd-mat-icon--${m.type === 'pdf' ? 'pdf' : 'other'}`}>
                    <FileText size={16} color={m.type === 'pdf' ? 'var(--cd-error)' : 'var(--cd-primary)'} />
                  </div>
                  <div className="cd-mat-body">
                    <p className="cd-mat-name">{m.title}</p>
                    <p className="cd-mat-type">{m.type || 'PDF'}</p>
                  </div>
                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="cd-mat-link">
                    <ExternalLink size={11} /> Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Subject-grouped chapter sidebar */
function CourseSidebar({ grouped, chapters, activeId, onSelect }) {
  const allKeys = Object.keys(grouped);
  const [collapsed, setCollapsed] = useState({});
  const toggle = (k) => setCollapsed(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="cd-sidebar cd-s">
      <div className="cd-sb-header">
        <p className="cd-sb-title">Course Content</p>
        <p className="cd-sb-meta">{chapters.length} chapters · {allKeys.length} subjects</p>
      </div>

      {allKeys.map(subj => {
        const c = getColor(subj);
        const chaps = grouped[subj];
        const isOpen = !collapsed[subj];
        return (
          <div key={subj} className="cd-sb-subj">
            {/* Subject toggle */}
            <button className="cd-subj-btn" onClick={() => toggle(subj)}>
              <div className="cd-sb-subj-inner">
                <span className="cd-sb-subj-dot" style={{ background: c.a, boxShadow: `0 0 6px ${c.g}` }} />
                <span className="cd-sb-subj-name" style={{ color: c.a }}>{subj}</span>
                <span className="cd-sb-subj-count" style={{ color: c.a, background: c.b, border: `1px solid ${c.d}` }}>
                  {chaps.length}
                </span>
              </div>
              {isOpen
                ? <ChevronUp size={13} color="var(--cd-player-chevron)" />
                : <ChevronDown size={13} color="var(--cd-player-chevron)" />}
            </button>

            {/* Chapter list */}
            {isOpen && chaps.map(ch => {
              const active = ch.id === activeId;
              return (
                <button
                  key={ch.id}
                  className={`cd-ch-btn${active ? ' active' : ''}`}
                  style={{ borderLeftColor: active ? c.a : 'transparent' }}
                  onClick={() => onSelect(ch)}
                >
                  <div
                    className="cd-ch-btn-icon"
                    style={{
                      background: active ? c.b : 'var(--cd-player-surface)',
                      border:     `1px solid ${active ? c.d : 'var(--cd-player-border-md)'}`,
                      boxShadow:  active ? `0 0 8px ${c.g}` : 'none',
                    }}
                  >
                    {active
                      ? <Play size={11} color={c.a} style={{ fill: c.a }} />
                      : ch.videoUrl
                        ? <Play size={10} color="var(--cd-player-text-faint)" />
                        : <FileText size={10} color="var(--cd-player-text-faint)" />}
                  </div>
                  <div className="cd-ch-btn-text-wrap">
                    <p className="cd-ch-btn-title" style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--cd-player-text)' : 'var(--cd-player-text-muted)' }}>
                      {ch.title}
                    </p>
                    {ch.durationMin > 0 && (
                      <p className="cd-ch-btn-dur" style={{ color: active ? c.a : 'var(--cd-player-text-faint)' }}>
                        {ch.durationMin} min
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ENROLLED VIEW — assembles sub-components
════════════════════════════════════════════════════════════════════════════ */
function EnrolledView({ course, chapters, materials, navigate, fetchSignedUrl }) {
  const grouped = groupBySubject(chapters);
  const [active, setActive] = useState(chapters[0] || null);
  const idx  = chapters.findIndex(c => c.id === active?.id);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  return (
    <div className="cd-overlay">
      <PlayerBar
        title={course.title}
        index={idx + 1}
        total={chapters.length}
        onBack={() => navigate(-1)}
      />
      <div className="cd-body">
        <div className="cd-left">
          <VideoArea chapter={active} onFetchSignedUrl={fetchSignedUrl} />
          <ChapterInfoPanel
            chapter={active}
            prev={prev}
            next={next}
            onPrev={() => setActive(prev)}
            onNext={() => setActive(next)}
            materials={materials}
          />
        </div>
        <CourseSidebar
          grouped={grouped}
          chapters={chapters}
          activeId={active?.id}
          onSelect={setActive}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS — Detail Page (non-enrolled)
════════════════════════════════════════════════════════════════════════════ */

/** Course hero banner */
function CourseHero({ course, chapCount, subjectCount, onBack }) {
  return (
    <div className="cd-hero">
      <div className="cd-hero-inner">
        <button className="cd-back" onClick={onBack}><ArrowLeft size={14} /> Back to Courses</button>
        <div className="cd-cat"><Zap size={10} /> {course.category}</div>
        <h1 className="cd-h1">{course.title}</h1>
        {course.instructor && (
          <p className="cd-instructor">
            <Award size={14} color="rgba(165,180,252,.7)" />
            Instructor: <strong>{course.instructor}</strong>
          </p>
        )}
        <div className="cd-meta-row">
          {[[Clock, `${course.durationHours} hours`], [BookOpen, `${chapCount} chapters`], [Layers, `${subjectCount} subjects`], [Users, 'All levels']].map(([Icon, lbl]) => (
            <span key={lbl} className="cd-chip"><Icon size={13} /> {lbl}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** About card */
function AboutCard({ description }) {
  return (
    <div className="cd-card">
      <div className="cd-card-hd">
        <h2 className="cd-card-title"><BookMarked size={16} color="var(--cd-primary)" /> About this Course</h2>
      </div>
      <div className="cd-card-bd">
        <p className="cd-desc">{description}</p>
      </div>
    </div>
  );
}

/** Free chapter video preview in the detail page accordion.
 *  - If chapter.videoUrl is set (external/YouTube) → embed directly.
 *  - If chapter.hasVideoKey is true (R2 private) → call /api/courses/chapters/:id/video
 *    to get a signed URL, then embed.
 */
function FreeChapterPreview({ chapter }) {
  const [url, setUrl]         = useState(chapter.videoUrl || null);
  const [loading, setLoading] = useState(!chapter.videoUrl && chapter.hasVideoKey);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (chapter.videoUrl) { setUrl(chapter.videoUrl); return; }
    if (!chapter.hasVideoKey) return;
    setLoading(true);
    coursesApi.getChapterVideo(chapter.id)
      .then(res => setUrl(res.data.url))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, [chapter.id]);

  if (loading) return (
    <div className="cd-locked" style={{ gap: 8 }}>
      <div className="loader-spinner" style={{ width: 16, height: 16 }} />
      Loading preview...
    </div>
  );
  if (errored || !url) return (
    <div className="cd-locked"><Lock size={15} /> Enroll to unlock this chapter</div>
  );
  return <div className="cd-video-preview"><iframe src={url} title={chapter.title} allowFullScreen /></div>;
}

/** Subject accordion for detail page */
function ContentAccordion({ grouped, collapsedSubjects, setCollapsedSubjects, expandedChapterId, setExpandedChapterId }) {
  return (
    <div>
      {Object.entries(grouped).map(([subj, chaps]) => {
        const c = getColor(subj);
        const isOpen = !collapsedSubjects[subj];
        return (
          <div key={subj} className="cd-subj" style={{ border: `1px solid ${c.d}` }}>
            {/* Subject toggle */}
            <button className="cd-subj-hd" style={{ background: c.b }} onClick={() => setCollapsedSubjects(s => ({ ...s, [subj]: !s[subj] }))}>
              <div className="cd-subj-hd-inner">
                <span className="cd-subj-dot" style={{ background: c.a, boxShadow: `0 0 6px ${c.g}` }} />
                <span className="cd-subj-name" style={{ color: c.a }}>{subj}</span>
                <span className="cd-subj-count" style={{ color: c.a, background: `${c.a}1a`, border: `1px solid ${c.d}` }}>
                  {chaps.length} {chaps.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
              {isOpen ? <ChevronUp size={16} color={c.a} /> : <ChevronDown size={16} color={c.a} />}
            </button>

            {/* Chapter rows */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${c.d}` }}>
                {chaps.map((ch, i) => {
                  const expanded = expandedChapterId === ch.id;
                  return (
                    <div key={ch.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--cd-border)' }}>
                      <button className="cd-ch-row" onClick={() => setExpandedChapterId(p => p === ch.id ? null : ch.id)}>
                        <div className="cd-ch-row-left">
                          <span className="cd-ch-index" style={{ background: c.b, border: `1px solid ${c.d}`, color: c.a }}>
                            {ch.orderIndex}
                          </span>
                          <span className="cd-ch-row-title">{ch.title}</span>
                          {ch.isFree && <span className="cd-free"><Star size={9} className="cd-free-icon" />Free</span>}
                        </div>
                        <div className="cd-ch-row-right">
                          {ch.durationMin > 0 && (
                            <span className="cd-ch-dur"><Clock size={11} /> {ch.durationMin}m</span>
                          )}
                          {!ch.isFree && <Lock size={13} color="var(--cd-text-light)" />}
                          {expanded ? <ChevronUp size={14} color="var(--cd-text-muted)" /> : <ChevronDown size={14} color="var(--cd-text-muted)" />}
                        </div>
                      </button>
                      {expanded && (
                        <div className="cd-ch-preview">
                          {ch.description && <p className="cd-ch-preview-desc">{ch.description}</p>}
                          {ch.isFree && (ch.videoUrl || ch.hasVideoKey)
                            ? <FreeChapterPreview chapter={ch} />
                            : <div className="cd-locked"><Lock size={15} /> Enroll to unlock this chapter</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Materials list (locked) */
function MaterialsCard({ materials }) {
  if (!materials.length) return null;
  return (
    <div className="cd-card">
      <div className="cd-card-hd">
        <h2 className="cd-card-title"><FileText size={16} color="var(--cd-primary)" /> Study Materials</h2>
        <p className="cd-card-sub">Enroll to access all download links</p>
      </div>
      <div className="cd-card-bd">
        {materials.map(m => (
          <div key={m.id} className="cd-mat-row">
            <div className={`cd-mat-row-icon cd-mat-row-icon--${m.type === 'pdf' ? 'pdf' : 'other'}`}>
              <FileText size={17} color={m.type === 'pdf' ? 'var(--cd-error)' : 'var(--cd-primary)'} />
            </div>
            <div className="cd-mat-row-body">
              <div className="cd-mat-row-name">{m.title}</div>
              <div className="cd-mat-row-type">{m.type || 'PDF'}</div>
            </div>
            <div className="cd-mat-row-lock">
              <Lock size={12} /> Enroll to access
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Inline video player card — unused in current render flow but kept for future */
function InlinePlayerCard({ chapters }) {
  const grouped = groupBySubject(chapters);
  const [active, setActive] = useState(chapters[0] || null);
  const idx  = chapters.findIndex(c => c.id === active?.id);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  return (
    <div className="cd-ipc">
      {/* Header badge */}
      <div className="cd-ipc-header">
        <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>Your Course</span>
        <span className="cd-ipc-pill"><CheckCircle size={10} /> Enrolled</span>
      </div>

      {/* Video */}
      {active?.videoUrl ? (
        <div className="cd-ipc-video">
          <iframe key={active.id} src={active.videoUrl} title={active.title}
            allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      ) : (
        <div className="cd-ipc-novideo">
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <PlayCircle size={22} color="rgba(99,102,241,.55)" />
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.28)', fontSize: '.8rem', fontWeight: 500, position: 'relative', zIndex: 1 }}>No video for this chapter</p>
        </div>
      )}

      {/* Active chapter info */}
      {active && (
        <div className="cd-ipc-info">
          <p className="cd-ipc-label">Chapter {active.orderIndex}</p>
          <p className="cd-ipc-title">{active.title}</p>
        </div>
      )}

      {/* Prev / Next nav */}
      <div className="cd-ipc-nav">
        <button className={`cd-ipc-btn${prev ? ' on' : ''}`} disabled={!prev} onClick={() => prev && setActive(prev)}>
          <ArrowLeft size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prev ? prev.title : 'Previous'}</span>
        </button>
        <button className={`cd-ipc-btn on next${next ? ' on' : ''}`} disabled={!next} onClick={() => next && setActive(next)}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next ? next.title : 'Next'}</span>
          {next && <Play size={12} style={{ flexShrink: 0 }} />}
        </button>
      </div>

      {/* Chapter list */}
      <div className="cd-ipc-list cd-s">
        {Object.entries(grouped).map(([subj, chaps]) => {
          const c = getColor(subj);
          return (
            <div key={subj}>
              {/* Subject label */}
              <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.a, boxShadow: `0 0 5px ${c.g}`, flexShrink: 0 }} />
                <span style={{ fontSize: '.67rem', fontWeight: 700, color: c.a, textTransform: 'uppercase', letterSpacing: '.07em' }}>{subj}</span>
              </div>
              {chaps.map(ch => {
                const isActive = ch.id === active?.id;
                return (
                  <button key={ch.id} className={`cd-ipc-ch${isActive ? ' active' : ''}`}
                    style={{ borderLeftColor: isActive ? c.a : 'transparent' }}
                    onClick={() => setActive(ch)}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: isActive ? c.b : 'rgba(255,255,255,.04)', border: `1px solid ${isActive ? c.d : 'rgba(255,255,255,.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                      {isActive ? <Play size={9} color={c.a} style={{ fill: c.a }} /> : <Play size={9} color="rgba(255,255,255,.25)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '.76rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</p>
                      {ch.durationMin > 0 && <p style={{ margin: '1px 0 0', fontSize: '.64rem', color: isActive ? c.a : 'rgba(255,255,255,.2)' }}>{ch.durationMin} min</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/** Sticky enroll card */
function EnrollCard({ course, chapCount, subjectCount, enrolling, error, onEnroll }) {
  const discount = course.originalPrice ? Math.round((1 - course.price / course.originalPrice) * 100) : 0;
  const features = [
    [Clock,         `${course.durationHours}+ hours of content`],
    [BookOpen,      `${chapCount} video chapters`],
    [Layers,        `${subjectCount} subject areas`],
    [GraduationCap, 'Lifetime access'],
    [Shield,        'Certificate of completion'],
    [TrendingUp,    'Progress tracking'],
  ];
  return (
    <div className="cd-enroll">
      <div className="cd-enroll-top">
        <p className="cd-price">{fmt(course.price)}</p>
        {course.originalPrice ? (
          <div className="cd-price-row">
            <span className="cd-orig">{fmt(course.originalPrice)}</span>
            <span className="cd-off">{discount}% OFF</span>
          </div>
        ) : (
          <div className="cd-price-spacer" />
        )}
        {error && <div className="cd-err">⚠ {error}</div>}
        <button id="enroll-now-btn" className="cd-enroll-btn" onClick={onEnroll} disabled={enrolling}>
          {enrolling
            ? <><div className="cd-btn-spinner cd-spin" />Processing...</>
            : <><Zap size={17} />Enroll Now</>}
        </button>
        <p className="cd-guarantee">30-day money-back guarantee</p>
      </div>
      <div className="cd-enroll-body">
        <p className="cd-includes-label">This course includes</p>
        {features.map(([Icon, lbl]) => (
          <div key={lbl} className="cd-feat">
            <div className="cd-feat-icon"><Icon size={14} color="var(--cd-primary)" /></div>
            {lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════════════════════════ */
export default function CourseDetail() {
  const { id: rawId }  = useParams();
  const courseId       = parseInt(rawId, 10);  // single source of truth — always a number
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();

  const [course,    setCourse]    = useState(null);
  const [chapters,  setChapters]  = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [enrolled,  setEnrolled]  = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error,     setError]     = useState('');
  const [expandedChapterId,  setExpandedChapterId]  = useState(null);
  const [collapsedSubjects, setCollapsedSubjects] = useState({});

  /* ── data fetch ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isNaN(courseId)) { navigate('/courses'); return; }
    Promise.all([
      coursesApi.getById(courseId),
      isLoggedIn
        ? paymentApi.checkEnrollment(courseId).catch(() => ({ data: { isEnrolled: false } }))
        : Promise.resolve({ data: { isEnrolled: false } }),
    ])
      .then(([courseRes, enrollRes]) => {
        setCourse(courseRes.data.course);
        const sorted = (courseRes.data.chapters || []).sort((a, b) => a.orderIndex - b.orderIndex);
        setChapters(sorted);
        setMaterials(courseRes.data.materials || []);
        const grp = groupBySubject(sorted);
        const init = {};
        Object.keys(grp).slice(1).forEach(k => { init[k] = true; });
        setCollapsedSubjects(init);
        setEnrolled(enrollRes.data.isEnrolled);
      })
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [courseId, isLoggedIn]);

  /* ── fetch signed video URL for R2 chapters ─────────────────────────────── */
  // Called by VideoArea and FreeChapterPreview when a chapter has hasVideoKey=true.
  // Returns the presigned URL string or throws.
  const fetchSignedUrl = useCallback(async (chapterId) => {
    const { data } = await coursesApi.getChapterVideo(chapterId);
    return data.url;
  }, []);

  /* ── enroll handler ─────────────────────────────────────────────────────── */
  const handleEnroll = async () => {
    if (!isLoggedIn) return navigate('/login');
    setEnrolling(true); setError('');
    try {
      const { data } = await paymentApi.initiate(courseId);
      await new Promise(r => setTimeout(r, 1500));
      await paymentApi.verify(data.paymentId);
      setEnrolled(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Enrollment failed. Please try again.';
      if (msg.includes('already enrolled')) setEnrolled(true);
      else setError(msg);
    } finally { setEnrolling(false); }
  };

  /* ── loading ────────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="loader" style={{ minHeight: '60vh' }}>
      <div className="loader-spinner" />
      <p className="loader-text">Loading...</p>
    </div>
  );

  if (!course) return null;

  /* ── enrolled → full-screen player ─────────────────────────────────────── */
  if (enrolled) {
    return (
      <EnrolledView
        course={course}
        chapters={chapters}
        materials={materials}
        navigate={navigate}
        fetchSignedUrl={fetchSignedUrl}
      />
    );
  }

  /* ── not enrolled → detail page ─────────────────────────────────────────── */
  const grouped      = groupBySubject(chapters);
  const subjectCount = Object.keys(grouped).length;

  return (
    <div className="cd-page">
      <CourseHero
        course={course}
        chapCount={chapters.length}
        subjectCount={subjectCount}
        onBack={() => navigate(-1)}
      />

      <div className="cd-grid">
        {/* Left column */}
        <div>
          <AboutCard description={course.description} />

          <div className="cd-card">
            <div className="cd-card-hd">
              <h2 className="cd-card-title"><Layers size={16} color="var(--cd-primary)" /> Course Content</h2>
              <p className="cd-card-sub">{chapters.length} chapters across {subjectCount} subjects</p>
            </div>
            <div className="cd-card-bd">
              <ContentAccordion
                grouped={grouped}
                collapsedSubjects={collapsedSubjects}
                setCollapsedSubjects={setCollapsedSubjects}
                expandedChapterId={expandedChapterId}
                setExpandedChapterId={setExpandedChapterId}
              />
            </div>
          </div>

          <MaterialsCard materials={materials} />
        </div>

        {/* Right column — sticky enroll card */}
        <div>
          <EnrollCard
            course={course}
            chapCount={chapters.length}
            subjectCount={subjectCount}
            enrolling={enrolling}
            error={error}
            onEnroll={handleEnroll}
          />
        </div>
      </div>
    </div>
  );
}