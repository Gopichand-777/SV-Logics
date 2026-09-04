import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, UserCheck, UserX, Plus, Eye, EyeOff,
  Copy, Check, X, BookOpen, Trash2, ShieldCheck, ShieldOff, GraduationCap, KeyRound,
} from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

/* ── shared styles ── */
const inp = {
  width: '100%', padding: '10px 14px', borderRadius: 9, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '0.9rem', outline: 'none',
};
const overlayBg = {
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const backdrop = {
  position: 'absolute', inset: 0,
  background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)',
};
const card = {
  position: 'relative', zIndex: 1,
  background: '#0f172a',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
};
const closeBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0,
};
const spin = { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };

/* ══════════════════════════════════════════════════════════════════════════ */
/* Course Access Modal                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */
function CourseAccessModal({ student, onClose }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getStudentCourses(student.id)
      .then(r => setCourses(r.data.courses)).catch(() => {})
      .finally(() => setLoading(false));
  }, [student.id]);

  useEffect(() => {
    load();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [load]);

  const toggle = async (course) => {
    setToggling(course.id);
    try {
      course.isEnrolled
        ? await adminApi.revokeCourseAccess(student.id, course.id)
        : await adminApi.grantCourseAccess(student.id, course.id);
      setCourses(p => p.map(c => c.id === course.id ? { ...c, isEnrolled: !c.isEnrolled } : c));
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setToggling(null); }
  };

  const enrolled = courses.filter(c => c.isEnrolled).length;
  const price = (p) => p ? `₹${Math.round(p).toLocaleString('en-IN')}` : 'Free';

  return createPortal(
    <div style={overlayBg}>
      <div style={backdrop} onClick={onClose} />
      <div style={{ ...card, width: '100%', maxWidth: 540, maxHeight: '82vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(99,102,241,0.25)' }}>

        {/* ── Header ── */}
        <div style={{ padding: '22px 26px 18px', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={22} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1rem' }}>Manage Course Access</h2>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                  {student.name}&nbsp;
                  <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>@{student.username}</span>
                </p>
              </div>
            </div>
            <button style={closeBtn} onClick={onClose}><X size={15} /></button>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[
              { label: `${enrolled} Enrolled`, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
              { label: `${courses.length - enrolled} Not enrolled`, color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
            ].map(p => (
              <span key={p.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>{p.label}</span>
            ))}
          </div>
        </div>

        {/* ── Course list ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 52, gap: 10 }}>
              <div style={{ ...spin, width: 24, height: 24 }} />
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>Loading courses…</span>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 44 }}>
              <BookOpen size={36} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 10 }} />
              <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.9rem' }}>No published courses found.</p>
            </div>
          ) : courses.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
              borderBottom: i < courses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: c.isEnrolled ? 'rgba(16,185,129,0.04)' : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = c.isEnrolled ? 'rgba(16,185,129,0.09)' : 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = c.isEnrolled ? 'rgba(16,185,129,0.04)' : 'transparent'}>

              {/* Accent bar */}
              <div style={{ width: 3, height: 38, borderRadius: 3, background: c.isEnrolled ? '#10b981' : 'rgba(255,255,255,0.07)', flexShrink: 0, transition: 'background 0.2s' }} />

              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                background: c.isEnrolled ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)',
                border: `1px solid ${c.isEnrolled ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={17} color={c.isEnrolled ? '#10b981' : '#818cf8'} />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.35)' }}>{c.category}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>·</span>
                  <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>{price(c.price)}</span>
                  {c.isEnrolled && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', padding: '1px 7px', borderRadius: 20 }}>✓ Enrolled</span>}
                </div>
              </div>

              {/* Button */}
              <button onClick={() => toggle(c)} disabled={toggling === c.id} style={{
                padding: '7px 15px', borderRadius: 8, flexShrink: 0, fontWeight: 600, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: 5, cursor: toggling === c.id ? 'wait' : 'pointer', transition: 'all 0.15s',
                ...(c.isEnrolled
                  ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                  : { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }),
              }}>
                {toggling === c.id ? <div style={spin} /> : c.isEnrolled ? <><ShieldOff size={13} /> Revoke</> : <><ShieldCheck size={13} /> Grant</>}
              </button>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Delete Confirm                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */
function DeleteConfirm({ name, username, onConfirm, onCancel, loading }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return createPortal(
    <div style={overlayBg}>
      <div style={backdrop} onClick={onCancel} />
      <div style={{ ...card, width: '100%', maxWidth: 400, padding: 30, border: '1px solid rgba(239,68,68,0.25)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={22} color="#f87171" />
        </div>
        <h3 style={{ margin: '0 0 6px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Delete Student?</h3>
        <p style={{ margin: '0 0 4px', textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{name}</p>
        <p style={{ margin: '0 0 22px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', lineHeight: 1.7 }}>
          Permanently deletes <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>@{username}</span> and all their<br />enrollments &amp; test data.{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>Cannot be undone.</span>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '11px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '11px 0', background: loading ? '#1e293b' : 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: loading ? 'none' : '0 4px 14px rgba(239,68,68,0.35)' }}>
            {loading ? <><div style={spin} /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Create Student Modal                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await adminApi.createStudent(form); onCreated(form.name, form.username, form.password); }
    catch (ex) { setErr(ex.response?.data?.error || 'Failed.'); }
    finally { setBusy(false); }
  };
  return createPortal(
    <div style={overlayBg}>
      <div style={backdrop} onClick={onClose} />
      <div style={{ ...card, width: '100%', maxWidth: 440, padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Create Student</h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Account for main website login</p>
          </div>
          <button style={closeBtn} onClick={onClose}><X size={15} /></button>
        </div>
        {err && <div style={{ padding: '9px 14px', marginBottom: 16, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.84rem' }}>{err}</div>}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ravi Kumar', extraStyle: {} },
            { label: 'Username', key: 'username', type: 'text', placeholder: 'e.g. ravi_kumar', hint: 'used to log in', extraStyle: { fontFamily: 'monospace', color: '#818cf8' } },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600 }}>
                {f.label}{f.hint && <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400, marginLeft: 6 }}>({f.hint})</span>}
              </label>
              <input {...inp} type={f.type} style={{ ...inp, ...f.extraStyle }} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: f.key === 'username' ? e.target.value.toLowerCase().replace(/\s+/g,'_') : e.target.value }))}
                placeholder={f.placeholder} required minLength={f.key === 'username' ? 3 : 1} autoFocus={f.key === 'name'} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 42 }} type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ flex: 1, padding: '11px 0', background: busy ? '#1e293b' : 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: busy ? 'none' : '0 4px 14px rgba(99,102,241,0.4)' }}>
              {busy ? <><div style={spin} /> Creating…</> : <><Plus size={15} /> Create Student</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Credentials Banner (one-time display)                                      */
/* ══════════════════════════════════════════════════════════════════════════ */
function CredBanner({ name, username, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div style={{ marginBottom: 20, padding: '18px 22px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#34d399', fontSize: '0.87rem' }}>✅ Student created — save credentials now!</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['Name', name, {}], ['Username', `@${username}`, { fontFamily: 'monospace', color: '#818cf8' }], ['Password', password, { fontFamily: 'monospace' }]].map(([lbl, val, st]) => (
            <div key={lbl}>
              <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</p>
              <p style={{ margin: 0, fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', ...st }}>{val}</p>
            </div>
          ))}
        </div>
        <button onClick={copy} style={{ padding: '5px 13px', borderRadius: 7, background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#34d399' : 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: '0.77rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Credentials</>}
        </button>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><X size={16} /></button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Reset Password Modal                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */
function ResetPasswordModal({ student, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (newPassword.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await adminApi.resetStudentPassword(student.id, newPassword);
      onSuccess(student.name);
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div style={overlayBg}>
      <div style={backdrop} onClick={onClose} />
      <div style={{ ...card, width: '100%', maxWidth: 420, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.25)' }}>

        {/* Amber gradient header */}
        <div style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', padding: '20px 24px 18px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <KeyRound size={22} color="#fff" />
          </div>
          <h3 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: '1rem' }}>Reset Password</h3>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>
            {student.name} &nbsp;<span style={{ fontFamily: 'monospace', opacity: 0.85 }}>@{student.username}</span>
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px 24px' }}>
          {err && <div style={{ padding: '9px 14px', marginBottom: 14, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.84rem' }}>{err}</div>}
          <form onSubmit={submit}>
            <label style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600 }}>New Password</label>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <input
                style={{ ...inp, paddingRight: 42 }}
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required minLength={6} autoFocus
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              ⚠️ The student will be logged out of all devices and must sign in with the new password.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={busy} style={{ flex: 1, padding: '11px 0', background: busy ? '#1e293b' : 'linear-gradient(135deg,#d97706,#f59e0b)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: busy ? 'none' : '0 4px 14px rgba(245,158,11,0.35)' }}>
                {busy ? <><div style={spin} /> Resetting…</> : <><KeyRound size={14} /> Reset Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Main Page                                                                   */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [creds, setCreds] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [accessSt, setAccessSt] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const showToast = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast({ text: '', type: 'success' }), 3000); };

  const load = useCallback((q = '') => {
    setLoading(true);
    adminApi.getStudents({ search: q }).then(r => setStudents(r.data.users)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (s) => {
    try {
      await adminApi.updateStudentStatus(s.id, !s.isActive);
      setStudents(p => p.map(u => u.id === s.id ? { ...u, isActive: !u.isActive } : u));
      showToast(`${s.name} ${s.isActive ? 'deactivated' : 'activated'}.`);
    } catch { showToast('Failed to update status.', 'error'); }
  };

  const doDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteStudent(delTarget.id);
      setStudents(p => p.filter(s => s.id !== delTarget.id));
      showToast(`${delTarget.name} deleted.`);
      setDelTarget(null);
    } catch (e) { showToast(e.response?.data?.error || 'Failed to delete.', 'error'); setDelTarget(null); }
    finally { setDeleting(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const avatarColor = (id) => `hsl(${(id * 53) % 360},55%,25%)`;
  const avatarText = (id) => `hsl(${(id * 53) % 360},80%,70%)`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Students</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage student accounts · <strong>{students.length}</strong> total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
          <Plus size={16} /> Create Student
        </button>
      </div>

      {/* Toast */}
      {toast.text && (
        <div style={{ padding: '11px 16px', marginBottom: 16, borderRadius: 10, fontWeight: 500, fontSize: '0.875rem', background: toast.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, color: toast.type === 'error' ? '#f87171' : '#34d399' }}>
          {toast.text}
        </div>
      )}

      {/* Creds */}
      {creds && <CredBanner {...creds} onClose={() => setCreds(null)} />}

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 20, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value); }}
          placeholder="Search by name or username…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'inherit' }} />
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
              {['Name', 'Username', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 52, textAlign: 'center' }}>
                <div style={{ width: 28, height: 28, margin: 'auto', border: '2.5px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 52, textAlign: 'center', color: 'var(--text-muted)' }}>No students yet. Create one to get started.</td></tr>
            ) : students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>

                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: avatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: avatarText(s.id), flexShrink: 0 }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</span>
                  </div>
                </td>

                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#818cf8' }}>@{s.username}</span>
                </td>

                <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.phone || <span style={{ opacity: 0.35 }}>—</span>}</td>

                <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmt(s.createdAt)}</td>

                <td style={{ padding: '13px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700, ...(s.isActive !== false ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' } : { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }) }}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setAccessSt(s)} title="Manage Course Access" style={{ padding: '6px 11px', borderRadius: 7, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                      <BookOpen size={13} /> Access
                    </button>
                    <button onClick={() => setResetTarget(s)} title="Reset Password" style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', cursor: 'pointer' }}>
                      <KeyRound size={14} />
                    </button>
                    <button onClick={() => toggleStatus(s)} title={s.isActive !== false ? 'Deactivate' : 'Activate'} style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      {s.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => setDelTarget(s)} title="Delete" style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portalled modals */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={(n, u, p) => { setShowCreate(false); setCreds({ name: n, username: u, password: p }); load(search); }} />
      )}
      {accessSt && <CourseAccessModal student={accessSt} onClose={() => setAccessSt(null)} />}
      {delTarget && <DeleteConfirm name={delTarget.name} username={delTarget.username} onConfirm={doDelete} onCancel={() => setDelTarget(null)} loading={deleting} />}
      {resetTarget && <ResetPasswordModal student={resetTarget} onClose={() => setResetTarget(null)} onSuccess={(name) => showToast(`Password reset for ${name}.`)} />}
    </div>
  );
}
