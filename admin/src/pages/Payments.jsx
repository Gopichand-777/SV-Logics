import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api.js';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPayments().then(r => setPayments(r.data.payments)).finally(() => setLoading(false));
  }, []);

  const fmt = d => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const total = payments
    .filter(p => p.status === 'success' || p.status === 'admin_grant')
    .reduce((s, p) => s + (p.amount || 0), 0);

  const statusBadge = (status) => {
    const map = {
      success:     { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: 'Success' },
      admin_grant: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)', label: 'Admin Grant' },
      pending:     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: 'Pending' },
      failed:      { bg: 'rgba(239,68,68,0.10)',  color: '#f87171', border: 'rgba(239,68,68,0.25)',  label: 'Failed' },
    };
    const s = map[status] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)', label: status };
    return (
      <span style={{
        padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>{s.label}</span>
    );
  };

  const gatewayBadge = (gw) => (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 600,
      background: gw === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
      color:      gw === 'admin' ? '#818cf8' : 'rgba(255,255,255,0.6)',
      border:     gw === 'admin' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.1)',
    }}>{gw || 'mock'}</span>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">All payment transactions · {payments.length} records</p>
        </div>
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10, padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#34d399',
        }}>
          Total Revenue: ₹{(total / 100).toLocaleString('en-IN')}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Gateway</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                <div className="spinner" style={{ margin: 'auto' }} />
              </td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                No payments yet.
              </td></tr>
            ) : payments.map(p => (
              <tr key={p.id}>

                {/* Payment ID */}
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  #{p.id}
                </td>

                {/* Student — now uses studentName + studentUsername */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {p.studentName || <span style={{ opacity: 0.35 }}>—</span>}
                  </div>
                  {p.studentUsername && (
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', fontFamily: 'monospace' }}>
                      @{p.studentUsername}
                    </div>
                  )}
                </td>

                {/* Course */}
                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  {p.courseTitle || '—'}
                </td>

                {/* Amount */}
                <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                  ₹{((p.amount || 0) / 100).toLocaleString('en-IN')}
                </td>

                {/* Gateway */}
                <td>{gatewayBadge(p.gateway)}</td>

                {/* Status */}
                <td>{statusBadge(p.status)}</td>

                {/* Date */}
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {fmt(p.paidAt || p.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
