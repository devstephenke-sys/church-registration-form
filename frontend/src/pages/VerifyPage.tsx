import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyToken } from '../services/api';

interface VerifyResult {
  status: string;
  message: string;
  registration_number?: string;
  full_name?: string;
  organization?: string;
  checked_in_at?: string;
  mpesa_receipt?: string;
  paid_at?: string;
  amount?: number;
}

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    verifyToken(token)
      .then(setResult)
      .catch(() => setResult({ status: 'INVALID', message: 'Verification request failed. Please try again.' }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="verify-page">
        <div className="card verify-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          <p style={{ color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>Verifying registration...</p>
        </div>
      </div>
    );
  }

  const status = result?.status || 'INVALID';
  const isValid = status === 'VALID';
  const isCheckedIn = status === 'ALREADY_CHECKED_IN';
  const isInvalid = !isValid && !isCheckedIn;

  let headerClass = 'invalid';
  let icon = '✕';
  let statusLabel = 'INVALID REGISTRATION';
  let statusColor = 'var(--color-danger)';

  if (isValid) {
    headerClass = 'valid';
    icon = '✓';
    statusLabel = 'VALID REGISTRATION';
    statusColor = 'var(--color-success)';
  } else if (isCheckedIn) {
    headerClass = 'warning';
    icon = '⚠';
    statusLabel = 'ALREADY CHECKED IN';
    statusColor = 'var(--color-warning)';
  }

  return (
    <div className="verify-page">
      <div className="card verify-card">
        {/* Header */}
        <div className={`verify-header ${headerClass}`}>
          <div className="verify-icon">{icon}</div>
          <div className="verify-status-text" style={{ color: statusColor }}>{statusLabel}</div>
          {isValid && (
            <div className="badge badge-success" style={{ margin: '0.75rem auto 0', display: 'inline-flex' }}>
              PAID ✓
            </div>
          )}
        </div>

        {/* Body */}
        <div className="verify-body">
          {isValid && result && (
            <>
              {[
                { label: 'Registration', value: result.registration_number },
                { label: 'Name', value: result.full_name },
                { label: 'Organization', value: result.organization },
                { label: 'M-PESA Receipt', value: result.mpesa_receipt },
                { label: 'Amount Paid', value: result.amount ? `KSh ${Number(result.amount).toLocaleString()}` : undefined },
                { label: 'Status', value: '✓ PAYMENT VERIFIED', highlight: true },
              ].filter(r => r.value).map(row => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value" style={row.highlight ? { color: 'var(--color-success)' } : {}}>
                    {row.value}
                  </span>
                </div>
              ))}
            </>
          )}

          {isCheckedIn && result && (
            <>
              {[
                { label: 'Registration', value: result.registration_number },
                { label: 'Name', value: result.full_name },
                { label: 'Checked In', value: result.checked_in_at ? new Date(result.checked_in_at).toLocaleString('en-KE') : 'Yes' },
              ].filter(r => r.value).map(row => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
              <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                {result.message}
              </div>
            </>
          )}

          {isInvalid && (
            <div style={{ padding: '1rem 0' }}>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {result?.message || 'This QR code could not be verified.'}
              </p>
              <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                Please contact event administration for assistance.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
