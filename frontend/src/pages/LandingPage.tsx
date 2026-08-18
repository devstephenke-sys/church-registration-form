import { Link } from 'react-router-dom';

const EVENT_TITLE = 'Kisumu Kenya Outpouring 2026';
const EVENT_SUBTITLE = 'Pastoral & Ministerial Delegation';
const PASTOR_IMAGE = 'https://res.cloudinary.com/dk8xhb82p/image/upload/v1784367257/images_bxlnct.jpg';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={PASTOR_IMAGE}
                alt="Apostle Johnson Suleman"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 0 10px var(--color-primary-glow)',
                }}
              />
              <div className="navbar-brand">Kisumu Outpouring 2026</div>
            </div>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register Delegation →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{ padding: '3.5rem 0 4rem' }}>
        <div className="container">
          {/* Minister Profile Card / Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '9999px',
              padding: '0.5rem 1.25rem 0.5rem 0.5rem',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <img
              src={PASTOR_IMAGE}
              alt="Apostle Johnson Suleman"
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid var(--color-primary)',
                boxShadow: '0 0 14px var(--color-primary-glow)',
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Apostle Johnson Suleman</span>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>✓</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Senior Pastor & General Overseer · Omega Fire Ministries
              </div>
            </div>
          </div>

          <h1 className="hero-title" style={{ maxWidth: '850px', margin: '0 auto 1rem' }}>
            {EVENT_TITLE}<br />
            <span>{EVENT_SUBTITLE}</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '640px' }}>
            Calling all pastors, bishops, evangelists, and gospel ministers. Secure your official ministerial delegation pass, priority seating, and prepare for an impartation of grace and apostolic unction.
          </p>

          {/* Call to Actions */}
          <div className="hero-cta" style={{ marginBottom: '3rem' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              🕊️ Register Delegation · KSh 1,000
            </Link>
            <a href="#overview" className="btn btn-secondary btn-lg">
              Delegation Benefits
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="stats-grid" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {[
              { number: 'Ministers', label: 'Pastoral Delegation' },
              { number: 'Priority', label: 'Reserved Seating' },
              { number: 'Impartation', label: 'Grace & Apostolic Fire' },
              { number: 'KSh 1,000', label: 'Registration (Paybill 9410300)' },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delegation Overview & Benefits */}
      <section id="overview" style={{ padding: '3.5rem 0', borderTop: '1px solid var(--color-border)', background: 'rgba(15, 23, 42, 0.4)' }}>
        <div className="container-narrow">
          <div className="card" style={{ border: '1.5px solid var(--color-border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="badge badge-warning" style={{ marginBottom: '0.75rem', padding: '4px 12px' }}>
                Ministerial Protocol
              </span>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Pastoral Delegation Benefits
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 500, margin: '0.5rem auto 0' }}>
                Every registered minister receives full ministerial accreditation for the Kisumu Kenya Outpouring 2026.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: '🪪', title: 'Official Minister Badge', desc: 'Personalized verified digital pass & check-in QR code' },
                { icon: '👑', title: 'Priority Ministerial Seating', desc: 'Reserved front section designated for visiting pastors & bishops' },
                { icon: '⚡', title: 'Ministerial Impartation', desc: 'Special session for impartation of grace and apostolic unction' },
                { icon: '🤝', title: 'Kingdom Network', desc: 'Connecting church leaders across Kenya and East Africa' },
              ].map((f) => (
                <div className="card card-sm" key={f.title} style={{ background: 'var(--color-bg-primary)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{f.title}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Quick Registration Bar */}
            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px dashed var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                  Fee: KSh 1,000 via M-PESA
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Paybill: 9410300 · Instant STK Push & SMS/Email Ticket
                </div>
              </div>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border)',
        padding: '2rem 0',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-xs)'
      }}>
        <div className="container">
          <p>© 2026 Kisumu Kenya Outpouring · Apostle Johnson Suleman · Pastoral Delegation Committee · <Link to="/admin/login" style={{ color: 'inherit' }}>Admin Portal</Link></p>
        </div>
      </footer>
    </div>
  );
}
