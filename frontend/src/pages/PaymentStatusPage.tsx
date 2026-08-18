import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { initiateSTKPush, getRegistrationStatus } from '../services/api';

const PASTOR_IMAGE = 'https://res.cloudinary.com/dk8xhb82p/image/upload/v1784367257/images_bxlnct.jpg';

type Step = 'initiating' | 'prompt_sent' | 'waiting' | 'done' | 'failed';

export default function PaymentStatusPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('initiating');
  const [message, setMessage] = useState('Connecting to Safaricom Daraja API...');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!registrationId || attemptedRef.current) return;
    attemptedRef.current = true;
    startPaymentFlow();
    return () => stopPolling();
  }, [registrationId]);

  async function startPaymentFlow() {
    try {
      setStep('initiating');
      setMessage('Sending M-PESA STK Push prompt to your phone...');
      const res = await initiateSTKPush(registrationId!);
      setStep('prompt_sent');
      setMessage(res.customer_message || 'Please check your phone and enter your M-PESA PIN.');
      setTimeout(() => {
        setStep('waiting');
        setMessage('Verifying payment confirmation from Safaricom...');
        startPolling();
      }, 2500);
    } catch (err: any) {
      setStep('failed');
      setError(err.message || 'Failed to initiate payment. Please try again.');
    }
  }

  function startPolling() {
    let attempts = 0;
    const maxAttempts = 24; // ~2 min at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const status = await getRegistrationStatus(registrationId!);
        if (status.status === 'PAID' || status.status === 'CHECKED_IN') {
          stopPolling();
          setStep('done');
          navigate(`/success/${registrationId}`, { replace: true });
        } else if (status.status === 'PAYMENT_FAILED' || status.status === 'PAYMENT_CANCELLED') {
          stopPolling();
          setStep('failed');
          setError('Payment was declined or cancelled. You can try again below.');
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setStep('failed');
          setError('Payment confirmation timed out. If you completed payment, please refresh or contact support.');
        }
      } catch {
        // Continue polling on transient errors
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function handleRetry() {
    stopPolling();
    attemptedRef.current = false;
    setError('');
    startPaymentFlow();
  }

  const steps = [
    { id: 'initiating', label: 'Sending payment request to M-PESA' },
    { id: 'prompt_sent', label: 'Enter your M-PESA PIN on your phone' },
    { id: 'waiting', label: 'Verifying payment with Safaricom' },
    { id: 'done', label: 'Payment confirmed & Delegate QR generated' },
  ];

  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="payment-status-page" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Event / Minister Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <img
            src={PASTOR_IMAGE}
            alt="Apostle Johnson Suleman"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--color-primary)',
              boxShadow: '0 0 12px var(--color-primary-glow)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Kisumu Outpouring 2026</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>Apostle Johnson Suleman · Pastoral Delegation</div>
          </div>
        </div>

        <div className="card" style={{ border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            {step === 'failed' ? (
              <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.5rem' }}>❌</div>
            ) : step === 'done' ? (
              <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.5rem' }}>✅</div>
            ) : (
              <div style={{ position: 'relative', width: 68, height: 68, margin: '0 auto 1rem' }}>
                <span className="spinner spinner-lg" style={{ width: 68, height: 68, borderWidth: 4, borderColor: 'var(--color-primary) transparent transparent transparent' }} />
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem' }}>📱</span>
              </div>
            )}

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              {step === 'failed' ? 'Payment Unsuccessful' : step === 'done' ? 'Payment Confirmed!' : 'M-PESA STK Push'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{message}</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Stepper Progress */}
          <div style={{ marginBottom: '2rem' }}>
            {steps.map((s, idx) => {
              const isDone = step === 'done' || (currentIdx > idx && step !== 'failed');
              const isActive = s.id === step && step !== 'failed';
              return (
                <div
                  key={s.id}
                  className={`payment-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: isDone ? '#dcfce7' : isActive ? '#fffbeb' : '#f1f5f9',
                      border: `1.5px solid ${isDone ? '#16a34a' : isActive ? '#d97706' : '#cbd5e1'}`,
                      color: isDone ? '#16a34a' : isActive ? '#b45309' : '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary-dark)' : isDone ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Paybill Instructions Box */}
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px dashed #f59e0b',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
              💡 Didn't receive the prompt?
            </div>
            <div style={{ color: '#78350f', lineHeight: 1.6 }}>
              You can also pay manually via M-PESA:
              <br />
              <strong>Paybill:</strong> 9410300 · <strong>Amount:</strong> KSh 1,000
            </div>
          </div>

          {step === 'failed' ? (
            <button className="btn btn-primary btn-full" onClick={handleRetry}>
              🔄 Retry Payment (KSh 1,000)
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Link to="/register" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Cancel and return to form
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
