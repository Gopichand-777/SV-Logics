import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = (q) => adminApi.getUsers({ search: q }).then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  useEffect(() => { load(''); }, []);

  const handleSearch = (e) => { setSearch(e.target.value); load(e.target.value); };
  const toggleStatus = async (user) => {
    await adminApi.updateUserStatus(user.id, !user.isActive);
    setUsers(us => us.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    setMsg(`✅ User ${user.isActive ? 'deactivated' : 'activated'}.`);
    setTimeout(() => setMsg(''), 2000);
  };
  const changeRole = async (user, role) => {
    await adminApi.updateUserRole(user.id, role);
    setUsers(us => us.map(u => u.id === user.id ? { ...u, role } : u));
  };

  const ROLES = ['student', 'content_manager', 'super_admin'];
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage student and admin accounts</p></div>
      </div>
      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="search-wrap">
          <Search size={15} />
          <input className="search-input" placeholder="Search by name or email…" value={search} onChange={handleSearch} />
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{users.length} users</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
              : users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                  <td>
                    <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }} value={u.role} onChange={e => changeRole(u, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{formatDate(u.createdAt)}</td>
                  <td><span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-error'}`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.isActive !== false ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleStatus(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                      {u.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
