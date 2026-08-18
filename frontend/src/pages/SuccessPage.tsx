import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRegistrationDetails } from '../services/api';

const PASTOR_IMAGE = 'https://res.cloudinary.com/dk8xhb82p/image/upload/v1784367257/images_bxlnct.jpg';

interface Details {
  registration: {
    full_name: string;
    email: string;
    phone: string;
    organization?: string;
    church_ministry?: string;
    ministry_location?: string;
    years_in_ministry?: string;
    registration_number?: string;
    status: string;
  };
  payment?: { amount: number; mpesa_receipt?: string; paid_at?: string };
  qr_code_base64?: string;
  verification_url?: string;
}

export default function SuccessPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!registrationId) return;
    getRegistrationDetails(registrationId)
      .then(setDetails)
      .catch(() => setError('Could not load registration details.'))
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', border: '1.5px solid var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
          <h2>Could not load details</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const { registration: reg, payment, qr_code_base64 } = details;
  const paidAt = payment?.paid_at
    ? new Date(payment.paid_at).toLocaleDateString('en-KE', { dateStyle: 'long', timeStyle: 'short' })
    : 'Confirmed';

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem 0 4rem' }}>
      <div className="container-narrow">
        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            ← Back to Home
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            🖨️ Print Pass / Badge
          </button>
        </div>

        {/* ─── VIP Delegate Pass Card ─── */}
        <div
          className="card"
          style={{
            border: '2px solid var(--color-primary)',
            boxShadow: 'var(--shadow-glow-primary)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.98) 100%)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '1.75rem',
          }}
        >
          {/* Top Decorative Gold Bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #d97706)' }} />

          {/* Event & Host Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={PASTOR_IMAGE}
                alt="Apostle Johnson Suleman"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2.5px solid var(--color-primary)',
                  boxShadow: '0 0 14px var(--color-primary-glow)',
                }}
              />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Apostle Johnson Suleman
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                  Kisumu Kenya Outpouring 2026
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Official Pastoral & Ministerial Pass
                </div>
              </div>
            </div>
            <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              ✓ ACCREDITED DELEGATE
            </span>
          </div>

          {/* Delegate Name & Pass Code */}
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              Delegate Name & Title
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              {reg.full_name}
            </h2>
            <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
              {reg.organization || reg.church_ministry || 'Pastoral Delegate'}
            </p>
            {reg.registration_number && (
              <div
                style={{
                  display: 'inline-block',
                  margin: '1rem auto 0',
                  padding: '0.35rem 1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--color-primary)',
                }}
              >
                PASS ID: {reg.registration_number}
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {qr_code_base64 && (
            <div
              style={{
                background: '#fff',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                maxWidth: 240,
                margin: '0 auto 1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src={qr_code_base64}
                alt="Delegate QR Code"
                style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontSize: '0.7rem', color: '#020617', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '0.04em' }}>
                OFFICIAL ENTRY QR PASS
              </div>
            </div>
          )}

          {/* Delegate Credentials Table */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Email:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{reg.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Phone:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{reg.phone}</div>
              </div>
              {payment?.mpesa_receipt && (
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>M-PESA Receipt:</span>
                  <div style={{ color: 'var(--color-success)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {payment.mpesa_receipt}
                  </div>
                </div>
              )}
              {payment?.amount && (
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Amount Paid:</span>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                    KSh {Number(payment.amount).toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Payment Date:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{paidAt}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
            🖨️ Download / Print Official Pass
          </button>
          <Link to="/" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Back to Home
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '1.75rem' }}>
          A digital copy of this ministerial pass & QR ticket has been delivered to <strong>{reg.email}</strong>.
        </p>
      </div>
    </div>
  );
}
