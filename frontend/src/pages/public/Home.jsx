import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Award, ChevronRight, Star, Zap, Target, Clock, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { useLang } from '../../context/LanguageContext.jsx';
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
  { icon: <Star size={24} />, title: 'Bilingual Content', desc: 'All content available in English and Telugu — learn in the language you are most comfortable with.' },
];

const STATS = [
  { icon: <Users size={28} />, number: '50,000+', label: 'Active Students' },
  { icon: <Video size={28} />, number: '500+', label: 'Video Lectures' },
  { icon: <Award size={28} />, number: '200+', label: 'Mock Tests' },
  { icon: <TrendingUp size={28} />, number: '92%', label: 'Success Rate' },
];

export default function Home() {
  const { t } = useLang();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll({ featured: 'true' })
      .then(res => setFeaturedCourses(res.data.courses.slice(0, 3)))
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
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
              {t('hero.badge')}
            </div>
            <h1 className="heading-xl hero-title">
              {t('hero.title1')} {t('hero.title2')}<br />
              <span className="highlight">{t('hero.highlight')}</span>
            </h1>
            <p className="hero-subtitle">{t('hero.subtitle')}</p>
            <div className="hero-actions">
              <Link to="/courses" className="btn btn-accent btn-lg">
                {t('hero.cta1')} <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-ghost btn-lg">
                {t('hero.cta2')}
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
            <h2 className="heading-lg">{t('home.examTitle')}</h2>
            <p>{t('home.examSubtitle')}</p>
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
                      {t('home.viewCourses')} <ChevronRight size={14} />
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
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>{t('home.trendingTitle')}</h2>
              <p className="text-muted">{t('home.trendingSubtitle')}</p>
            </div>
            <Link to="/courses" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
              {t('home.viewAll')} <ChevronRight size={16} />
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
            <h2 className="heading-lg">{t('home.advantageTitle')}</h2>
            <p>{t('home.advantageSubtitle')}</p>
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
            <Link to="/register" className="btn btn-accent btn-lg">Get Started Free</Link>
            <Link to="/courses" className="btn btn-ghost btn-lg">Browse Courses</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
