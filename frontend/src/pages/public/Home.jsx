import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Award, ChevronRight, Zap, Target, Clock, Shield, TrendingUp, ArrowRight, Bell, X } from 'lucide-react';

import { coursesApi } from '../../api/courses.api.js';
import CourseCard from '../../components/ui/CourseCard.jsx';

const EXAM_CATEGORIES = [
  {
    title: 'SSC Exams', sub: 'CGL, CHSL, MTS & more',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
    color: '#1d3a8a', category: 'SSC CGL',
  },
  {
    title: 'Banking Exams', sub: 'SBI PO, IBPS, RBI & more',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    color: '#0f766e', category: 'Banking (IBPS/SBI)',
  },
];

const ADVANTAGES = [
  { icon: <Video size={24} />, title: 'Expert Video Lectures', desc: '500+ hours of HD video content from top faculty with years of government exam experience.' },
  { icon: <Target size={24} />, title: 'Topic-wise Mock Tests', desc: 'Practice with 10,000+ questions designed to match the latest exam pattern and difficulty.' },
  { icon: <Shield size={24} />, title: 'Previous Year Papers', desc: 'Comprehensive PYQ analysis with detailed solutions and trend analysis for all exams.' },
  { icon: <TrendingUp size={24} />, title: 'Performance Analytics', desc: 'Track your progress, identify weak areas, and improve systematically with data-driven insights.' },
  { icon: <Clock size={24} />, title: 'Learn at Your Pace', desc: 'Lifetime access to all enrolled courses. Study whenever, wherever on any device.' },
];

const STATS = [
  { icon: <Users size={28} />, number: '50,000+', label: 'Active Students' },
  { icon: <Video size={28} />, number: '500+', label: 'Video Lectures' },
  { icon: <Award size={28} />, number: '200+', label: 'Mock Tests' },
  { icon: <TrendingUp size={28} />, number: '92%', label: 'Success Rate' },
];

export default function Home() {

  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading]   = useState(true);

  // Announcements banner
  const [announcements, setAnnouncements]       = useState([]);
  const [currentAnnIdx, setCurrentAnnIdx]       = useState(0);
  const [dismissedIds, setDismissedIds]         = useState(
    () => JSON.parse(localStorage.getItem('sv-dismissed-announcements') || '[]')
  );

  useEffect(() => {
    coursesApi.getAll({ featured: 'true' })
      .then(res => setFeaturedCourses(res.data.courses.slice(0, 3)))
      .catch(() => {})
      .finally(() => setCoursesLoading(false));

    coursesApi.getAnnouncements()
      .then(res => setAnnouncements(res.data.announcements || []))
      .catch(() => {});
  }, []);

  const visibleAnn = announcements.filter(a => !dismissedIds.includes(a.id));

  const dismissAnnouncement = (id) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('sv-dismissed-announcements', JSON.stringify(next));
    // Move to next visible banner
    setCurrentAnnIdx(i => Math.max(0, i - 1));
  };

  const activeAnn = visibleAnn[currentAnnIdx] || visibleAnn[0] || null;

  return (
    <div>
      {/* ── Announcements Banner ──────────────────────────────────────── */}
      {activeAnn && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: 'linear-gradient(90deg, #1d3a8a 0%, #2563eb 50%, #1d3a8a 100%)',
          color: '#fff', padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          {/* Bell icon */}
          <Bell size={16} style={{ flexShrink: 0, opacity: 0.9 }} />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700, marginRight: 8 }}>{activeAnn.title}</span>
            {activeAnn.body && (
              <span style={{ opacity: 0.88, fontSize: '0.875rem' }}>{activeAnn.body}</span>
            )}
          </div>

          {/* Navigation (if multiple banners) */}
          {visibleAnn.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: '0.78rem', opacity: 0.8 }}>
              <button
                onClick={() => setCurrentAnnIdx(i => Math.max(0, i - 1))}
                disabled={currentAnnIdx === 0}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px', opacity: currentAnnIdx === 0 ? 0.4 : 1 }}
              >&#8592;</button>
              <span>{currentAnnIdx + 1} / {visibleAnn.length}</span>
              <button
                onClick={() => setCurrentAnnIdx(i => Math.min(visibleAnn.length - 1, i + 1))}
                disabled={currentAnnIdx === visibleAnn.length - 1}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px', opacity: currentAnnIdx === visibleAnn.length - 1 ? 0.4 : 1 }}
              >&#8594;</button>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={() => dismissAnnouncement(activeAnn.id)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
              color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex',
              alignItems: 'center', flexShrink: 0,
            }}
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-image" />
        <div className="hero-particles">
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
        </div>
        <div className="container" style={{ width: '100%' }}>
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} />
              India's Most Trusted Prep Platform
            </div>
            <h1 className="heading-xl hero-title">
              Crack SSC & Banking Exams with<br />
              <span className="highlight">Certainty</span>
            </h1>
            <p className="hero-subtitle">Expert-led courses, rigorous mock tests, and comprehensive study material designed for ambitious students targeting top government jobs.</p>
            <div className="hero-actions">
              <Link to="/courses" className="btn btn-accent btn-lg">
                Explore Courses <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Student Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="section-sm">
        <div className="container">
          <div className="stats-bar" style={{ display: 'grid', gridTemplateColumns: `repeat(${STATS.length}, 1fr)` }}>
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exam Categories ─────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">Choose Your Target Exam</h2>
             <p>Specialized batches tailored exactly to the latest syllabus and patterns.</p>
          </div>
          <div className="grid-2">
            {EXAM_CATEGORIES.map((exam) => (
              <Link key={exam.title} to={`/courses?category=${encodeURIComponent(exam.category)}`}>
                <div className="exam-card">
                  <div className="exam-card-bg" style={{ backgroundImage: `url(${exam.img})` }} />
                  <div className="exam-card-overlay" />
                  <div className="exam-card-content">
                    <div className="exam-card-title">{exam.title}</div>
                    <div className="exam-card-subtitle">{exam.sub}</div>
                    <span className="exam-card-link">
                      View Courses <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Courses ────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 40 }}>
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Trending Courses</h2>
               <p className="text-muted">Join our most popular batches right now.</p>
            </div>
            <Link to="/courses" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>
          {coursesLoading ? (
            <div className="grid-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: 380 }}>
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="skeleton" style={{ height: 20, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '100%', borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-3">
              {featuredCourses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Advantages ──────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">The SV Logics Advantage</h2>
             <p>Everything you need to crack government exams in one place.</p>
          </div>
          <div className="advantage-grid">
            {ADVANTAGES.map((adv, i) => (
              <div key={i} className="advantage-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="advantage-icon">{adv.icon}</div>
                <h3 className="advantage-title">{adv.title}</h3>
                <p className="advantage-desc">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        padding: '64px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <BookOpen size={48} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 16px' }} />
          <h2 className="heading-lg" style={{ color: 'white', marginBottom: 16 }}>
            Ready to Start Your Journey?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Join thousands of students who are cracking government exams with SV Logics.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-accent btn-lg">Student Login</Link>
            <Link to="/courses" className="btn btn-ghost btn-lg">Browse Courses</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
