import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatCurrency = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;

export default function AdminDashboard() {
  const { admin, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      adminApi.getOverview()
        .then(res => setStats(res.data.stats))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const CARDS = isSuperAdmin ? [
    { icon: <Users size={22} />, value: stats?.totalUsers, label: 'Total Users', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: <BookOpen size={22} />, value: stats?.totalCourses, label: 'Total Courses', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { icon: <FileText size={22} />, value: stats?.totalEnrollments, label: 'Enrollments', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <CreditCard size={22} />, value: formatCurrency(stats?.totalRevenue), label: 'Total Revenue', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ] : [
    { icon: <BookOpen size={22} />, value: '—', label: 'Courses', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { icon: <FileText size={22} />, value: '—', label: 'Tests', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Welcome, {admin?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ·{' '}
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {admin?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </p>
      </div>

      {/* Stats */}
      {isSuperAdmin && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {CARDS.map((c, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              <div>
                <div className="stat-value">{loading ? '—' : c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { icon: <BookOpen size={20} />, label: 'Manage Courses', desc: 'Add, edit, or delete courses and chapters.', href: '/courses', color: '#8b5cf6' },
          { icon: <FileText size={20} />, label: 'Manage Tests', desc: 'Create and manage mock test series.', href: '/tests', color: '#3b82f6' },
          { icon: <Activity size={20} />, label: 'View Analytics', desc: 'Check enrollments and payment data.', href: isSuperAdmin ? '/enrollments' : '/courses', color: '#10b981' },
        ].map((a, i) => (
          <a key={i} href={a.href} style={{ display: 'block', textDecoration: 'none' }}>
            <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = a.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}>
              <div style={{ width: 44, height: 44, background: `${a.color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 14 }}>
                {a.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>{a.label}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Role info card */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Your Access Level</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {isSuperAdmin
              ? '🔑 You have Super Admin access. You can manage all users, courses, tests, payments, and enrollments.'
              : '📝 You have Content Manager access. You can manage courses, chapters, tests, and questions. User and payment data is restricted to Super Admins.'}
          </p>
        </div>
      </div>
    </div>
  );
}
