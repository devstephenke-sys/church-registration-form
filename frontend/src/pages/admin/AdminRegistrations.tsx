import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { listRegistrations } from '../../services/api';

const STATUS_FILTERS = ['', 'PAID', 'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED', 'CHECKED_IN'];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: 'badge-success',
    CHECKED_IN: 'badge-success',
    PENDING_PAYMENT: 'badge-warning',
    PAYMENT_PROCESSING: 'badge-warning',
    PAYMENT_FAILED: 'badge-danger',
    PAYMENT_CANCELLED: 'badge-danger',
    EXPIRED: 'badge-muted',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status.replace(/_/g, ' ')}</span>;
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(s = search, f = filter) {
    setLoading(true);
    setError('');
    try {
      const res = await listRegistrations({ search: s || undefined, status_filter: f || undefined, limit: 100 });
      setRegistrations(res.registrations || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search, filter);
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Registrations</h1>
        <p className="page-subtitle">{total} total registrations</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>🔍</span>
            <input
              id="search-registrations"
              className="search-input"
              placeholder="Search by name, email, phone, reg number, M-PESA receipt..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <select
          className="form-control"
          style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          value={filter}
          onChange={e => { setFilter(e.target.value); load(search, e.target.value); }}
        >
          {STATUS_FILTERS.map(f => (
            <option key={f} value={f}>{f || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner spinner-lg" />
          </div>
        ) : registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No registrations found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reg #</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.8rem' }}>
                    {r.registration_number || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.organization || '—'}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('en-KE')}</td>
                  <td>
                    <Link to={`/admin/registrations/${r.id}`} className="btn btn-secondary btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
