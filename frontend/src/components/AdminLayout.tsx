import { useNavigate, useLocation, Link } from 'react-router-dom';
import { clearToken } from '../services/api';

const navItems = [
  { path: '/admin/dashboard', label: '📊 Dashboard' },
  { path: '/admin/registrations', label: '📋 Registrations' },
  { path: '/admin/verify', label: '📷 QR Scanner' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    clearToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <div className="navbar-brand" style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
            DigiConf 2026
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>Admin Portal</p>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <Link to="/" className="admin-nav-item" style={{ fontSize: 'var(--font-size-sm)' }}>
            🌐 View Site
          </Link>
          <button className="admin-nav-item" onClick={handleLogout} style={{ color: 'var(--color-danger)', width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
