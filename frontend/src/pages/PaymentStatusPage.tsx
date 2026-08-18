import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initiateSTKPush, getRegistrationStatus } from '../services/api';

type Step = 'initiating' | 'prompt_sent' | 'waiting' | 'done' | 'failed';

export default function PaymentStatusPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('initiating');
  const [message, setMessage] = useState('Sending payment request to M-PESA...');
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
      setMessage('Sending payment request to M-PESA...');
      const res = await initiateSTKPush(registrationId!);
      setStep('prompt_sent');
      setMessage(res.customer_message || 'Check your phone for the M-PESA prompt.');
      setTimeout(() => {
        setStep('waiting');
        setMessage('Waiting for payment confirmation...');
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
          setError('Payment confirmation timed out. If you already completed payment on your phone, please wait a minute and refresh.');
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
    { id: 'done', label: 'Payment confirmed & QR generated' },
  ];

  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="payment-status-page">
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {step === 'failed' ? (
              <div className="payment-icon">❌</div>
            ) : step === 'done' ? (
              <div className="payment-icon">✅</div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <span className="spinner spinner-lg" />
              </div>
            )}

            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
              {step === 'failed' ? 'Payment Failed' : step === 'done' ? 'Payment Confirmed!' : 'M-PESA STK Push'}
            </h2>

            {step !== 'failed' && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {message}
              </p>
            )}
          </div>

          {/* Progress Steps */}
          {step !== 'failed' && (
            <div style={{ marginBottom: '1.5rem' }}>
              {steps.map((s, idx) => {
                const isDone = idx < currentIdx;
                const isActive = s.id === step;
                return (
                  <div
                    key={s.id}
                    className={`payment-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  >
                    <span className="step-dot" />
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>
                      {isDone ? '✓ ' : ''}{s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error State */}
          {step === 'failed' && (
            <div>
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                {error || 'Payment could not be completed.'}
              </div>
              <button
                id="retry-payment"
                className="btn btn-primary btn-full"
                onClick={handleRetry}
              >
                🔄 Retry M-PESA STK Push
              </button>
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: '0.75rem' }}
                onClick={() => navigate('/payment-failed')}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Instructions box */}
          {(step === 'prompt_sent' || step === 'waiting') && (
            <div className="card card-sm" style={{ background: 'var(--color-bg-primary)', marginTop: '1rem' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                💡 <strong>Important:</strong> A popup from <strong>M-PESA (Paybill 9410300)</strong> has been sent to your phone.
                Please enter your PIN. Do not navigate away from this screen; verification is automatic.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
