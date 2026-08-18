import { Link } from 'react-router-dom';

const EVENT_TITLE = 'Kisumu Kenya Outpouring 2026';
const EVENT_SUBTITLE = 'Pastoral & Ministerial Delegation Registration';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div className="navbar-brand">🕊️ Kisumu Outpouring 2026</div>
            <Link to="/register" className="btn btn-primary btn-sm">
              Pastoral Registration →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span>🕊️</span>
            <span>Apostle Johnson Suleman · Kisumu, Kenya</span>
          </div>
          <h1 className="hero-title">
            {EVENT_TITLE}<br />
            <span>{EVENT_SUBTITLE}</span>
          </h1>
          <p className="hero-subtitle">
            Calling all pastors, bishops, apostles, and gospel ministers. Register your official ministerial
            delegation, reserve priority pastoral seating, and prepare for a divine impartation of grace.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              🕊️ Register Pastoral Delegation · KSh 1,000
            </Link>
            <a href="#overview" className="btn btn-secondary btn-lg">
              Event Overview
            </a>
          </div>

          {/* Highlights */}
          <div className="stats-grid">
            {[
              { number: 'Ministers', label: 'Pastoral Delegation' },
              { number: 'Priority', label: 'Ministerial Seating' },
              { number: 'Impartation', label: 'Grace & Anointing' },
              { number: 'KSh 1,000', label: 'Registration Fee' },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Overview */}
      <section id="overview" style={{ padding: '4rem 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container-narrow">
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              Pastoral & Ministerial Delegation
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center' }}>
              Registered delegates receive priority ministerial seating, the special impartation service with Apostle Johnson Suleman, and official delegation credentials.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: '🕊️', title: 'Ministerial Delegation Badge', desc: 'Official accreditation and verified delegate QR pass' },
                { icon: '👑', title: 'Priority Ministerial Seating', desc: 'Reserved seating section for pastors, bishops, and church leaders' },
                { icon: '⚡', title: "Minister's Impartation", desc: 'Special grace transfer and ministerial anointing' },
                { icon: '🤝', title: 'Pastoral Fellowship & Network', desc: 'Connecting ministers across the nation for kingdom advancement' },
              ].map((f) => (
                <div className="card card-sm" key={f.title} style={{ background: 'var(--color-bg-primary)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{f.title}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick CTA */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Instant M-PESA payment verification (Paybill 9410300) with immediate QR code issuance.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Register as Minister / Pastor (KSh 1,000)
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem 0',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <div className="container">
          <p>© 2026 Kisumu Kenya Outpouring · Apostle Johnson Suleman · Pastoral Delegation Committee · <Link to="/admin/login" style={{ color: 'inherit' }}>Admin Portal</Link></p>
        </div>
      </footer>
    </div>
  );
}
