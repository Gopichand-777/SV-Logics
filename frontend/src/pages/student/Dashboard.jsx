import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Flame, TrendingUp, Clock, ChevronRight, Award } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../../context/LanguageContext.jsx';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const secToMin = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const recentAttempts = data?.recentAttempts || [];
  const enrolledCourses = data?.enrolledCourses || [];

  const STAT_CARDS = [
    { icon: <BookOpen size={22} />, value: stats.enrolledCourses ?? '—', label: t('dashboard.enrolled'), color: '#1d3a8a', bg: 'rgba(29,58,138,0.1)' },
    { icon: <FileText size={22} />, value: stats.testsAttempted ?? '—', label: t('dashboard.testsAttempted'), color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    { icon: <Flame size={22} />, value: stats.currentStreak ?? '—', label: t('dashboard.streak'), color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
    { icon: <TrendingUp size={22} />, value: stats.avgScore ? `${stats.avgScore}%` : '—', label: t('dashboard.avgScore'), color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="dashboard-header h1">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px 60px' }}>
        {/* Stats */}
        <div className="dashboard-stats" style={{ marginBottom: 40 }}>
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-card-info">
                <div className="stat-card-value">{loading ? '—' : s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          {/* Recent Tests */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>{t('dashboard.recentActivity')}</h3>
              <Link to="/tests" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                View All <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
              </Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
              </div>
            ) : recentAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <FileText size={36} color="var(--color-text-light)" style={{ margin: '0 auto 12px' }} />
                <p className="text-muted">{t('dashboard.noTests')}</p>
                <Link to="/tests" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  Take a Test
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentAttempts.map(a => {
                  const pct = Math.round((a.score / a.totalMarks) * 100);
                  return (
                    <Link key={a.id} to={`/tests/result/${a.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
                      background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', transition: 'var(--transition)',
                      textDecoration: 'none',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: pct >= 70 ? 'rgba(16,185,129,0.1)' : pct >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: pct >= 70 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-error)',
                        fontWeight: 800, fontSize: '0.95rem',
                      }}>
                        {pct}%
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.testTitle}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {a.correctCount}✓ {a.wrongCount}✗ · {a.timeTakenSec ? secToMin(a.timeTakenSec) : '—'} · {formatDate(a.attemptedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>{t('dashboard.enrolledCourses')}</h3>
              <Link to="/courses" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {t('dashboard.exploreCourses')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
              </Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 8 }} />)}
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <BookOpen size={36} color="var(--color-text-light)" style={{ margin: '0 auto 12px' }} />
                <p className="text-muted">{t('dashboard.noCourses')}</p>
                <Link to="/courses" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  {t('dashboard.exploreCourses')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enrolledCourses.map(c => (
                  <Link key={c.id} to={`/courses/${c.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
                    background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', transition: 'var(--transition)', textDecoration: 'none',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ width: 48, height: 48, background: 'rgba(29,58,138,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={22} color="var(--color-primary)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                        {c.courseTitle}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {c.courseCategory} · Enrolled {formatDate(c.enrolledAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: <BookOpen size={20} />, label: 'Browse Courses', to: '/courses', color: '#1d3a8a' },
            { icon: <FileText size={20} />, label: 'Take Mock Test', to: '/tests', color: '#0891b2' },
            { icon: <Award size={20} />, label: 'View Profile', to: '/profile', color: '#7c3aed' },
          ].map(action => (
            <Link key={action.label} to={action.to} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)',
              fontWeight: 600, fontSize: '0.9rem', transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ color: action.color }}>{action.icon}</div>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
