import { Link } from 'react-router-dom';

const EVENT_TITLE = 'Apostle Johnson Suleman Crusade';
const EVENT_SUBTITLE = 'Pastoral Delegation Registration';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div className="navbar-brand">🕊️ Suleman Crusade 2026</div>
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
            <span>Pastoral & Ministerial Delegation · Nairobi, Kenya</span>
          </div>
          <h1 className="hero-title">
            {EVENT_TITLE}<br />
            <span>{EVENT_SUBTITLE}</span>
          </h1>
          <p className="hero-subtitle">
            Calling all pastors, bishops, apostles, and gospel ministers. Secure your official ministerial
            badge and delegation seating for this power-packed spiritual encounter.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              🕊️ Register Delegation · KSh 1,000
            </Link>
            <a href="#schedule" className="btn btn-secondary btn-lg">
              View Schedule
            </a>
          </div>

          {/* Highlights */}
          <div className="stats-grid">
            {[
              { number: '4', label: 'Spiritual Sessions' },
              { number: 'Ministers', label: 'Impartation Service' },
              { number: 'Pastoral', label: 'Fellowship Luncheon' },
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

      {/* Schedule / Highlights */}
      <section id="schedule" style={{ padding: '4rem 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container-narrow">
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              Pastoral Delegation Sessions
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center' }}>
              Registered delegates receive priority ministerial seating, the special impartation service, and access to all designated sessions.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: '🌅', title: 'Morning Leadership Session', desc: 'Strategic ministry insights and pastoral leadership empowerment' },
                { icon: '🔥', title: 'Evening Main Crusade', desc: 'Mighty signs, wonders, salvation, and kingdom demonstration' },
                { icon: '🍽️', title: 'Pastoral Fellowship Luncheon', desc: 'Intimate ministerial networking and fellowship' },
                { icon: '⚡', title: "Minister's Impartation Service", desc: 'Special grace transfer and ministerial anointing' },
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
          <p>© 2026 Apostle Johnson Suleman Crusade · Pastoral Delegation Committee · <Link to="/admin/login" style={{ color: 'inherit' }}>Admin Portal</Link></p>
        </div>
      </footer>
    </div>
  );
}
