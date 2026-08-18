import { Link } from 'react-router-dom';

export default function PaymentFailedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
          Payment Failed
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
          Your payment could not be completed. This could be due to a cancelled prompt,
          insufficient M-PESA balance, or a network timeout.
        </p>
        <div className="card card-sm" style={{ background: 'var(--color-bg-primary)', textAlign: 'left', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            💡 <strong>Note:</strong> If you were charged but did not receive confirmation, please
            contact our support team with your M-PESA receipt number.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/register" className="btn btn-primary">
            🔄 Try Again
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
