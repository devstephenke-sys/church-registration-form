import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { verifyToken, checkIn } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';

type ScanState = 'idle' | 'scanning' | 'verified' | 'checking_in' | 'checked_in' | 'error';

interface VerifyResult {
  status: string;
  message: string;
  registration_number?: string;
  full_name?: string;
  organization?: string;
  checked_in_at?: string;
  mpesa_receipt?: string;
  amount?: number;
}

export default function AdminVerify() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [currentToken, setCurrentToken] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  async function startScanner() {
    setScanState('scanning');
    setVerifyResult(null);
    setCheckInResult(null);
    setError('');

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      isScanning.current = true;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        async (decodedText) => {
          if (!isScanning.current) return;
          isScanning.current = false;
          await stopScanner();

          // Extract token from URL or use raw text
          let token = decodedText;
          const urlMatch = decodedText.match(/\/verify\/([A-Za-z0-9_-]+)$/);
          if (urlMatch) token = urlMatch[1];

          setCurrentToken(token);
          await handleVerify(token);
        },
        undefined
      );
    } catch (err: any) {
      setScanState('error');
      setError('Camera access denied or unavailable. ' + err.message);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      scannerRef.current = null;
    }
  }

  async function handleVerify(token: string) {
    try {
      const result = await verifyToken(token);
      setVerifyResult(result);
      setScanState('verified');
    } catch (e: any) {
      setScanState('error');
      setError('Verification failed: ' + e.message);
    }
  }

  async function handleCheckIn() {
    if (!currentToken) return;
    setScanState('checking_in');
    try {
      const result = await checkIn(currentToken);
      setCheckInResult(result);
      setScanState('checked_in');
    } catch (e: any) {
      setScanState('error');
      setError('Check-in failed: ' + e.message);
    }
  }

  function handleReset() {
    stopScanner();
    setScanState('idle');
    setVerifyResult(null);
    setCheckInResult(null);
    setCurrentToken('');
    setError('');
    isScanning.current = false;
  }

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const isValid = verifyResult?.status === 'VALID';
  const isAlreadyCheckedIn = verifyResult?.status === 'ALREADY_CHECKED_IN';

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">📷 QR Scanner & Check-in</h1>
        <p className="page-subtitle">Scan participant QR codes to verify and check in</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Idle State */}
        {scanState === 'idle' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>📷</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Ready to Scan</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: 'var(--font-size-sm)' }}>
              Click the button below to activate your camera and scan a participant's QR code.
            </p>
            <button id="start-scanner" className="btn btn-primary btn-lg" onClick={startScanner}>
              🚀 Start Scanner
            </button>
          </div>
        )}

        {/* Scanning State */}
        {scanState === 'scanning' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              Point camera at QR code
            </h3>
            <div id="qr-reader" className="scanner-container" />
            <button className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }} onClick={handleReset}>
              Cancel
            </button>
          </div>
        )}

        {/* Verified — Valid */}
        {scanState === 'verified' && isValid && verifyResult && (
          <div className="card verify-card" style={{ maxWidth: '100%' }}>
            <div className="verify-header valid">
              <div className="verify-icon">✓</div>
              <div className="verify-status-text" style={{ color: 'var(--color-success)' }}>VALID REGISTRATION</div>
              <span className="badge badge-success" style={{ margin: '0.75rem auto 0', display: 'inline-flex' }}>PAID ✓</span>
            </div>
            <div className="verify-body">
              {[
                { label: 'Registration #', value: verifyResult.registration_number },
                { label: 'Name', value: verifyResult.full_name },
                { label: 'Organization', value: verifyResult.organization },
                { label: 'M-PESA Receipt', value: verifyResult.mpesa_receipt },
              ].filter(r => r.value).map(row => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button id="check-in-btn" className="btn btn-success btn-full btn-lg" onClick={handleCheckIn}>
                  ✅ CHECK IN
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* Already Checked In */}
        {scanState === 'verified' && isAlreadyCheckedIn && (
          <div className="card verify-card" style={{ maxWidth: '100%' }}>
            <div className="verify-header warning">
              <div className="verify-icon">⚠</div>
              <div className="verify-status-text" style={{ color: 'var(--color-warning)' }}>ALREADY CHECKED IN</div>
            </div>
            <div className="verify-body">
              {[
                { label: 'Registration #', value: verifyResult?.registration_number },
                { label: 'Name', value: verifyResult?.full_name },
                { label: 'Checked In', value: verifyResult?.checked_in_at ? new Date(verifyResult.checked_in_at).toLocaleString('en-KE') : '—' },
              ].filter(r => r.value).map(row => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
              <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                This participant has already been checked in.
              </div>
              <button className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }} onClick={handleReset}>
                Scan Next
              </button>
            </div>
          </div>
        )}

        {/* Invalid */}
        {scanState === 'verified' && !isValid && !isAlreadyCheckedIn && (
          <div className="card verify-card" style={{ maxWidth: '100%' }}>
            <div className="verify-header invalid">
              <div className="verify-icon">✕</div>
              <div className="verify-status-text" style={{ color: 'var(--color-danger)' }}>INVALID REGISTRATION</div>
            </div>
            <div className="verify-body">
              <div className="alert alert-danger" style={{ marginTop: '0.5rem' }}>
                {verifyResult?.message || 'QR code could not be verified.'}
              </div>
              <button className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }} onClick={handleReset}>
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Checking In */}
        {scanState === 'checking_in' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Processing check-in...</p>
          </div>
        )}

        {/* Checked In Success */}
        {scanState === 'checked_in' && checkInResult && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem' }}>
              Checked In!
            </h2>
            <p style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: '0.25rem' }}>
              {checkInResult.full_name}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '2rem' }}>
              {checkInResult.registration_number}
            </p>
            <button id="scan-next-btn" className="btn btn-primary btn-lg" onClick={handleReset}>
              Scan Next →
            </button>
          </div>
        )}

        {/* Error */}
        {scanState === 'error' && (
          <div className="card" style={{ padding: '2rem' }}>
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>
            <button className="btn btn-secondary btn-full" onClick={handleReset}>Try Again</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
