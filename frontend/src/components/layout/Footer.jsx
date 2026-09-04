import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { coursesApi } from '../../api/courses.api.js';

// ── Site config — edit once, reflects everywhere ──────────────────────────────
const SITE = {
  name: 'SV Logics',
  email: 'support@svlogics.com',
  phone: '+91 955360****',
  tagline: "India's most trusted platform for SSC & Banking exam preparation.",
};

const QUICK_LINKS = [
  ['/', 'Home'],
  ['/courses', 'Courses'],
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    coursesApi.getAll({})
      .then(res => {
        const courses = res.data.courses || [];
        // Extract unique, non-empty categories
        const unique = [...new Set(
          courses.map(c => c.category).filter(Boolean)
        )];
        setCategories(unique);
      })
      .catch(() => {
        // Fallback list if API fails
        setCategories(['SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)']);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>

          {/* Brand */}
          <div>
            <div className="footer-logo flex" style={{ gap: 10, marginBottom: 12 }}>
              <img src="/logo.png" alt="SV Logics" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: '50%' }} />
              <span>{SITE.name}</span>
            </div>
            <p className="footer-desc">{SITE.tagline}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                <Mail size={14} /> {SITE.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                <Phone size={14} /> {SITE.phone}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUICK_LINKS.map(([to, label]) => (
                <Link key={to} to={to}
                  style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#f59e0b'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories — fetched from API */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.length === 0 ? (
                // Skeleton placeholders while loading
                [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 14, width: `${60 + i * 10}%`, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
                ))
              ) : (
                categories.map(cat => (
                  <Link key={cat} to={`/courses?category=${encodeURIComponent(cat)}`}
                    style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#f59e0b'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>
                    {cat}
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <span>© {year} {SITE.name}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Privacy Policy</Link>
            <Link to="/terms-and-conditions" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
