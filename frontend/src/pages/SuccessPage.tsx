import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRegistrationDetails } from '../services/api';

interface Details {
  registration: {
    full_name: string;
    email: string;
    phone: string;
    organization?: string;
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
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
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
    ? new Date(payment.paid_at).toLocaleDateString('en-KE', { dateStyle: 'long' })
    : 'Confirmed';

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 0' }}>
      <div className="container-narrow">
        {/* Success Header */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(0,209,178,0.08))', borderColor: 'rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🎉</div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem' }}>
            Registration Confirmed!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--color-text-primary)' }}>{reg.full_name}</strong>! Your spot is secured.
          </p>
        </div>

        {/* Registration Details */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: 'var(--font-size-lg)' }}>📋 Registration Details</h3>
          {[
            { label: 'Registration Number', value: reg.registration_number, highlight: true },
            { label: 'Name', value: reg.full_name },
            { label: 'Email', value: reg.email },
            { label: 'Phone', value: reg.phone },
            ...(reg.organization ? [{ label: 'Organization', value: reg.organization }] : []),
          ].map(row => (
            <div className="detail-row" key={row.label}>
              <span className="detail-label">{row.label}</span>
              <span className="detail-value" style={row.highlight ? { color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '1rem' } : {}}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Payment Details */}
        {payment && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: 'var(--font-size-lg)' }}>💳 Payment Details</h3>
            {[
              { label: 'Amount', value: `KSh ${Number(payment.amount).toLocaleString()}` },
              { label: 'M-PESA Receipt', value: payment.mpesa_receipt || '—' },
              { label: 'Payment Date', value: paidAt },
              { label: 'Status', value: 'PAID ✓' },
            ].map(row => (
              <div className="detail-row" key={row.label}>
                <span className="detail-label">{row.label}</span>
                <span className="detail-value" style={row.label === 'Status' ? { color: 'var(--color-success)' } : {}}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* QR Code */}
        {qr_code_base64 && (
          <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: 'var(--font-size-lg)' }}>
              📱 Your Check-in QR Code
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
              Present this at the event entrance. A copy has been sent to your email.
            </p>
            <img
              src={qr_code_base64}
              alt="QR Code for event check-in"
              style={{ width: 220, height: 220, border: '2px solid var(--color-border)', borderRadius: 12, margin: '0 auto', display: 'block' }}
            />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
              Screenshot or save this QR code to your phone
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            Back to Home
          </Link>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
            🖨️ Print Receipt
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '1.5rem' }}>
          A confirmation email with your QR code has been sent to <strong>{reg.email}</strong>
        </p>
      </div>
    </div>
  );
}
