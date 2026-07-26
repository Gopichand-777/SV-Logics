import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api.js';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getPayments().then(r => setPayments(r.data.payments)).finally(() => setLoading(false)); }, []);
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const STATUS_COLOR = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-error' };
  const total = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Payments</h1><p className="page-subtitle">All payment transactions</p></div>
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>
          Total Revenue: ₹{(total / 100).toLocaleString('en-IN')}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Payment ID</th><th>Student</th><th>Course</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
              : payments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No payments yet.</td></tr>
              : payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.paymentId?.slice(0, 16)}…</td>
                  <td><div style={{ fontWeight: 600 }}>{p.userName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userEmail}</div></td>
                  <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.courseTitle}</td>
                  <td style={{ fontWeight: 700 }}>₹{((p.amount || 0) / 100).toLocaleString('en-IN')}</td>
                  <td><span className="badge badge-info">{p.gateway || 'mock'}</span></td>
                  <td><span className={`badge ${STATUS_COLOR[p.status] || 'badge-warning'}`}>{p.status}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{fmt(p.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
