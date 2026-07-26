import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, FileText,
  HelpCircle, CreditCard, ClipboardList, LogOut, Sun, Moon, Megaphone, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/courses', icon: <GraduationCap size={17} />, label: 'Courses & Chapters' },
      { to: '/tests', icon: <FileText size={17} />, label: 'Mock Tests' },
      { to: '/questions', icon: <HelpCircle size={17} />, label: 'Questions' },
      { to: '/materials', icon: <BookOpen size={17} />, label: 'Study Materials' },
    ],
  },
  {
    label: 'Students',
    links: [
      { to: '/users', icon: <Users size={17} />, label: 'Users', superOnly: true },
      { to: '/enrollments', icon: <ClipboardList size={17} />, label: 'Enrollments', superOnly: true },
      { to: '/payments', icon: <CreditCard size={17} />, label: 'Payments', superOnly: true },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/announcements', icon: <Megaphone size={17} />, label: 'Announcements' },
    ],
  },
];

export default function Sidebar() {
  const { admin, logout, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/logo.png" alt="SV Logics" style={{ height: 34, width: 34, objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }} />
        <div>
          <div style={{ lineHeight: 1 }}>SV Logics</div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginTop: 2 }}>Admin Panel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="sidebar-section">{section.label}</div>
            {section.links.map(link => {
              if (link.superOnly && !isSuperAdmin) return null;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
            {admin?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{admin?.role?.replace('_', ' ')}</div>
          </div>
          <button className="theme-btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }} onClick={toggleTheme}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <button className="sidebar-link" onClick={handleLogout} style={{ color: '#fca5a5' }}>
          <LogOut size={17} /> Log Out
        </button>
      </div>
    </aside>
  );
}
