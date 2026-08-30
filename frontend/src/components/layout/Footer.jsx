import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';


export default function Footer() {

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          {/* Brand */}
          <div>
            <div className="footer-logo flex" style={{ gap: 10, marginBottom: 12 }}>
              <BookOpen size={22} color="#f59e0b" />
              <span>SV Logics</span>
            </div>
            <p className="footer-desc">India's most trusted platform for SSC & Banking exam preparation.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                <Mail size={14} /> support@svlogics.com
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                <Phone size={14} /> +91 98765 43210
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Home'], ['/courses', 'Courses'], ['/login', 'Log In'], ['/register', 'Sign Up']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#f59e0b'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)'].map(cat => (
                <Link key={cat} to={`/courses?category=${encodeURIComponent(cat)}`}
                  style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#f59e0b'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>{cat}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2024 SV Logics. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
