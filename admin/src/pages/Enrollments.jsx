import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api.js';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getEnrollments()
      .then(r => setEnrollments(r.data.enrollments))
      .finally(() => setLoading(false));
  }, []);

  const fmt = d => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollments</h1>
          <p className="page-subtitle">All student course enrollments · {enrollments.length} records</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Category</th>
              <th>Enrolled On</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48 }}>
                <div className="spinner" style={{ margin: 'auto' }} />
              </td></tr>
            ) : enrollments.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                No enrollments yet.
              </td></tr>
            ) : enrollments.map(e => (
              <tr key={e.id}>
                {/* Student — uses studentName + studentUsername from updated backend */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {e.studentName || <span style={{ opacity: 0.35 }}>—</span>}
                  </div>
                  {e.studentUsername && (
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', fontFamily: 'monospace' }}>
                      @{e.studentUsername}
                    </div>
                  )}
                </td>

                {/* Course */}
                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{e.courseTitle || '—'}</td>

                {/* Category */}
                <td>
                  {e.courseCategory
                    ? <span className="badge badge-primary">{e.courseCategory}</span>
                    : <span style={{ opacity: 0.35 }}>—</span>}
                </td>

                {/* Enrolled date */}
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {fmt(e.enrolledAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
