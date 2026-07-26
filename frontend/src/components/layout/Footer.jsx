import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLang();
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
            <p className="footer-desc">{t('footer.tagline')}</p>
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
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>{t('footer.quickLinks')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Home'], ['/courses', t('nav.courses')], ['/login', t('nav.login')], ['/register', t('nav.signup')]].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#f59e0b'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>{t('footer.categories')}</h4>
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
          <span>{t('footer.copyright')}</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
