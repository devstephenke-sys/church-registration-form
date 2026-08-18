import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getDashboardStats, exportCSV } from '../../services/api';

interface Stats {
  total_registrations: number;
  paid_registrations: number;
  pending_payments: number;
  failed_payments: number;
  checked_in_participants: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    try {
      const resp = await exportCSV();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    }
  }

  const statItems = stats ? [
    { label: 'Total Registrations', value: stats.total_registrations, color: 'var(--color-secondary)' },
    { label: 'Paid', value: stats.paid_registrations, color: 'var(--color-success)' },
    { label: 'Pending', value: stats.pending_payments, color: 'var(--color-warning)' },
    { label: 'Failed', value: stats.failed_payments, color: 'var(--color-danger)' },
    { label: 'Checked In', value: stats.checked_in_participants, color: 'var(--color-primary)' },
    { label: 'Revenue (KES)', value: `${stats.total_revenue.toLocaleString()}`, color: 'var(--color-accent)' },
  ] : [];

  return (
    <AdminLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">2026 Digital Skills Conference — Live Overview</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          ⬇ Export CSV
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <span className="spinner spinner-lg" />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {stats && (
        <>
          <div className="stats-grid" style={{ marginBottom: '2rem', marginTop: 0 }}>
            {statItems.map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-number" style={{ background: `${s.color}`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Summary card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Quick Summary</h3>
            <div className="detail-row">
              <span className="detail-label">Paid conversion rate</span>
              <span className="detail-value">
                {stats.total_registrations > 0
                  ? `${Math.round((stats.paid_registrations / stats.total_registrations) * 100)}%`
                  : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Check-in rate (of paid)</span>
              <span className="detail-value">
                {stats.paid_registrations > 0
                  ? `${Math.round((stats.checked_in_participants / stats.paid_registrations) * 100)}%`
                  : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Revenue</span>
              <span className="detail-value" style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                KES {stats.total_revenue.toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
