import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getRegistrationDetail, resendReceipt } from '../../services/api';

export default function AdminRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    getRegistrationDetail(id)
      .then(setData)
      .catch(e => alert('Failed to load: ' + e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleResend() {
    if (!id) return;
    setResending(true);
    setMessage('');
    try {
      await resendReceipt(id);
      setMessage('✅ Receipt queued for resending to ' + data?.registration?.email);
    } catch (e: any) {
      setMessage('❌ ' + e.message);
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner spinner-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return <AdminLayout><div className="alert alert-danger">Registration not found.</div></AdminLayout>;
  }

  const { registration: reg, payments, emails } = data;
  const successPayment = payments?.find((p: any) => p.payment_status === 'SUCCESS');
  const sessions = Array.isArray(reg.sessions_attending) ? reg.sessions_attending.join(', ') : reg.sessions_attending || '—';

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{reg.full_name}</h1>
          <p className="page-subtitle">{reg.registration_number || reg.id}</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Registration Info */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Pastoral Delegation Details</h3>
          {[
            { label: 'Status', value: reg.status },
            { label: 'Registration #', value: reg.registration_number || '—' },
            { label: 'Email', value: reg.email },
            { label: 'Phone', value: reg.phone },
            { label: 'Church / Ministry', value: reg.church_ministry || reg.organization || '—' },
            { label: 'Location of Ministry', value: reg.ministry_location || '—' },
            { label: 'Years in Ministry', value: reg.years_in_ministry || '—' },
            { label: 'Sessions Attending', value: sessions },
            { label: 'Referral Source', value: reg.referral_source || '—' },
            { label: 'Special Assistance', value: reg.special_assistance || 'No' },
            { label: 'Checked In', value: reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('en-KE') : 'No' },
            { label: 'Registered On', value: new Date(reg.created_at).toLocaleString('en-KE') },
          ].map(row => (
            <div className="detail-row" key={row.label}>
              <span className="detail-label">{row.label}</span>
              <span className="detail-value">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Payment History</h3>
          {payments && payments.length > 0 ? payments.map((p: any) => (
            <div key={p.id} className="card card-sm" style={{ background: 'var(--color-bg-primary)', marginBottom: '0.75rem' }}>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`badge ${p.payment_status === 'SUCCESS' ? 'badge-success' : p.payment_status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                  {p.payment_status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className="detail-value">KES {Number(p.amount).toLocaleString()}</span>
              </div>
              {p.mpesa_receipt && (
                <div className="detail-row">
                  <span className="detail-label">M-PESA Receipt</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>{p.mpesa_receipt}</span>
                </div>
              )}
              {p.result_description && (
                <div className="detail-row">
                  <span className="detail-label">Result</span>
                  <span className="detail-value">{p.result_description}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">{new Date(p.created_at).toLocaleString('en-KE')}</span>
              </div>
            </div>
          )) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No payments found.</p>
          )}

          {/* Email Logs */}
          {emails && emails.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: 'var(--font-size-sm)' }}>Email Notification History</h4>
              {emails.map((e: any) => (
                <div className="detail-row" key={e.id}>
                  <span className="detail-label">{new Date(e.created_at).toLocaleString('en-KE')}</span>
                  <span className={`badge ${e.status === 'SENT' ? 'badge-success' : 'badge-danger'}`}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {successPayment && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={handleResend} disabled={resending}>
            {resending ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Resending...</> : '📧 Resend Receipt & QR Code'}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
