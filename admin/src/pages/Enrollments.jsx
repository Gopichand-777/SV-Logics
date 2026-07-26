import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api.js';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getEnrollments().then(r => setEnrollments(r.data.enrollments)).finally(() => setLoading(false)); }, []);
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Enrollments</h1><p className="page-subtitle">All student course enrollments</p></div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Student</th><th>Course</th><th>Category</th><th>Enrolled</th><th>Amount Paid</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
              : enrollments.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No enrollments yet.</td></tr>
              : enrollments.map(e => (
                <tr key={e.id}>
                  <td><div style={{ fontWeight: 600 }}>{e.userName}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.userEmail}</div></td>
                  <td style={{ fontWeight: 500 }}>{e.courseTitle}</td>
                  <td><span className="badge badge-primary">{e.courseCategory}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{fmt(e.enrolledAt)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{((e.amountPaid || 0) / 100).toLocaleString('en-IN')}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
