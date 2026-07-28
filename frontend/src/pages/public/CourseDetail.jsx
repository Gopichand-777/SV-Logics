import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Lock, Play, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { coursesApi } from '../../api/courses.api.js';
import { paymentApi } from '../../api/dashboard.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../../context/LanguageContext.jsx';

const formatPrice = (p) => `₹${(p / 100).toLocaleString('en-IN')}`;

export default function CourseDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    coursesApi.getById(id)
      .then(res => {
        setCourse(res.data.course);
        setChapters((res.data.chapters || []).sort((a, b) => a.orderIndex - b.orderIndex));
        setMaterials(res.data.materials || []);
      })
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!isLoggedIn) return navigate('/login');
    setEnrolling(true);
    setError('');
    try {
      const { data } = await paymentApi.initiate(parseInt(id));
      // Mock payment — simulate success after 1.5s
      await new Promise(r => setTimeout(r, 1500));
      await paymentApi.verify(data.paymentId);
      setEnrolled(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Enrollment failed. Please try again.';
      if (msg.includes('already enrolled')) setEnrolled(true);
      else setError(msg);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="loader" style={{ minHeight: '60vh' }}>
      <div className="loader-spinner" />
      <p className="loader-text">{t('common.loading')}</p>
    </div>
  );

  if (!course) return null;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1d3a8a 100%)', padding: '48px 0' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span className="badge badge-accent" style={{ marginBottom: 16 }}>{course.category}</span>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
            {course.title}
          </h1>
          <div style={{ display: 'flex', gap: 24, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={15} /> {course.durationHours} hours</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} /> {course.chaptersCount} chapters</span>
            {course.instructor && <span>👨‍🏫 {course.instructor}</span>}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          {/* Left */}
          <div>
            {/* Description */}
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>About this Course</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{course.description}</p>
            </div>

            {/* Chapters */}
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
                Course Content — {chapters.length} Chapters
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chapters.map((ch, i) => (
                  <div key={ch.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedChapter(expandedChapter === i ? -1 : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text)', fontFamily: 'var(--font)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)', width: 24 }}>{i + 1}.</span>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ch.title}</span>
                        {ch.isFree && <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Free</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {ch.durationMin > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ch.durationMin} min</span>}
                        {!ch.isFree && !enrolled && <Lock size={14} color="var(--color-text-muted)" />}
                        {expandedChapter === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    {expandedChapter === i && (
                      <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                        {ch.description && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{ch.description}</p>}
                        {(ch.isFree || enrolled) && ch.videoUrl ? (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <iframe src={ch.videoUrl} title={ch.title} allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)' }}>
                            <Lock size={16} color="var(--color-text-muted)" />
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Enroll to unlock this chapter</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Enroll Card */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 28 }}>
              <div className="course-price" style={{ marginBottom: 20 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatPrice(course.price)}</span>
                {course.originalPrice && (
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-light)', textDecoration: 'line-through' }}>
                    {formatPrice(course.originalPrice)}
                  </span>
                )}
                {course.originalPrice && (
                  <span className="badge badge-success">
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {error && <div className="toast-error" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>{error}</div>}

              {enrolled ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Play size={24} color="var(--color-success)" />
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: 8 }}>You're Enrolled! 🎉</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>All chapters are now unlocked for you.</p>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary btn-full btn-lg"
                  style={{ marginBottom: 16 }}
                >
                  {enrolling ? (
                    <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                  ) : t('course.enrollNow')}
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <Clock size={15} /> {course.durationHours} hours of content
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <BookOpen size={15} /> {course.chaptersCount} chapters
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <Play size={15} /> Lifetime access
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
