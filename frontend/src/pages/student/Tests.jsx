import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Target, ChevronRight } from 'lucide-react';
import { testsApi } from '../../api/tests.api.js';


const CATEGORIES = ['All', 'SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)'];
const DIFF_COLOR = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };

export default function Tests() {

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    testsApi.getAll()
      .then(res => setTests(res.data.tests))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'All'
    ? tests
    : tests.filter(t => t.category === activeCategory);

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
        {/* Filter */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 28, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="filter-tabs">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`filter-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <FileText size={48} color="var(--color-text-light)" style={{ margin: '0 auto 16px' }} />
            <h3 className="text-muted">No tests found</h3>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(test => (
              <div key={test.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="badge badge-primary">{test.category}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: DIFF_COLOR[test.difficulty] || '#666', textTransform: 'capitalize' }}>
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
