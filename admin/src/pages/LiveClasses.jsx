import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Video, Edit, ExternalLink, RefreshCw } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { toast } from '../components/toast.js';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const EMPTY_FORM = {
  title: '', description: '', platform: 'zoom', meetingUrl: '',
  scheduledAt: '', durationMinutes: 60,
  isRecurring: false, recurrenceDays: [], isActive: true,
};

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const toLocalDatetimeValue = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseRecurrenceRule = (rule) => {
  if (!rule) return [];
  // e.g. "weekly:monday,wednesday"
  return rule.replace('weekly:', '').split(',').filter(Boolean);
};

const buildRecurrenceRule = (days) => `weekly:${days.join(',')}`;

export default function AdminLiveClasses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });
  const closeConfirm = () => setConfirmState(null);

  const load = () => {
    setLoading(true);
    adminApi.getLiveClasses()
      .then((r) => setItems(r.data.liveClasses || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setMsg('');
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      platform: item.platform || 'zoom',
      meetingUrl: item.meetingUrl || '',
      scheduledAt: toLocalDatetimeValue(item.scheduledAt),
      durationMinutes: item.durationMinutes || 60,
      isRecurring: item.isRecurring || false,
      recurrenceDays: parseRecurrenceRule(item.recurrenceRule),
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setMsg('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setMsg(''); };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      recurrenceDays: f.recurrenceDays.includes(day)
        ? f.recurrenceDays.filter((d) => d !== day)
        : [...f.recurrenceDays, day],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) return setMsg('❌ Title is required.');
    if (!form.meetingUrl.trim()) return setMsg('❌ Meeting URL is required.');
    if (!form.scheduledAt) return setMsg('❌ Scheduled date & time is required.');
    if (form.isRecurring && form.recurrenceDays.length === 0)
      return setMsg('❌ Select at least one day for recurring classes.');

    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        recurrenceRule: form.isRecurring ? buildRecurrenceRule(form.recurrenceDays) : null,
      };
      delete payload.recurrenceDays;

      if (editing) {
        await adminApi.updateLiveClass(editing.id, payload);
        toast.success('Live class updated!');
      } else {
        await adminApi.createLiveClass(payload);
        toast.success('Live class created!');
      }
      load();
      closeModal();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error saving live class.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (id) => {
    askConfirm(
      'Delete Live Class?',
      'This will permanently delete this live class. This cannot be undone.',
      async () => {
        closeConfirm();
        setDeleting(id);
        try {
          await adminApi.deleteLiveClass(id);
          setItems((prev) => prev.filter((i) => i.id !== id));
          toast.success('Live class deleted.');
        } catch {
          toast.error('Failed to delete. Please try again.');
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  const platformLabel = (p) => p === 'google_meet' ? 'Google Meet' : 'Zoom';
  const platformColor = (p) => p === 'google_meet' ? '#16a34a' : '#2563eb';
  const platformBg    = (p) => p === 'google_meet' ? 'rgba(22,163,74,0.1)' : 'rgba(37,99,235,0.1)';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Classes</h1>
          <p className="page-subtitle">Schedule Zoom or Google Meet sessions for students</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="btn-new-live-class">
          <Plus size={16} /> New Live Class
        </button>
      </div>

      {msg && !modal && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <Video size={40} />
          <h3>No live classes yet</h3>
          <p>Create your first Zoom or Google Meet session for students.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ padding: 20 }}>
              <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{item.title}</h3>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                      background: platformBg(item.platform), color: platformColor(item.platform),
                      border: `1px solid ${platformColor(item.platform)}40`,
                    }}>
                      {platformLabel(item.platform)}
                    </span>
                    {item.isRecurring && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <RefreshCw size={10} style={{ display: 'inline', marginRight: 4 }} />Recurring
                      </span>
                    )}
                    <span className={`badge ${item.isActive ? 'badge-success' : 'badge-error'}`}>
                      {item.isActive ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {item.description && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{item.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>🗓 {fmt(item.scheduledAt)}</span>
                    <span>⏱ {item.durationMinutes} min</span>
                    {item.isRecurring && item.recurrenceRule && (
                      <span>🔄 {item.recurrenceRule.replace('weekly:', '').replace(/,/g, ', ')}</span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={item.meetingUrl} target="_blank" rel="noopener noreferrer"
                    className="btn btn-sm btn-outline" title="Open meeting link"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={14} /> Join
                  </a>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)} title="Edit">
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                    onClick={() => remove(item.id)}
                    disabled={deleting === item.id}
                    title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Live Class' : 'New Live Class'}</h3>
              <button onClick={closeModal} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>

            {msg && (
              <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }}>
                {msg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input id="lc-title" className="form-input" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. SSC CGL Maths Doubt Session" />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="lc-description" className="form-input" rows={2} style={{ resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What will be covered in this session?" />
              </div>

              {/* Platform */}
              <div className="form-group">
                <label className="form-label">Platform *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['zoom', 'google_meet'].map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 16px', borderRadius: 8, border: `2px solid ${form.platform === p ? platformColor(p) : 'var(--color-border)'}`, background: form.platform === p ? platformBg(p) : 'transparent', transition: 'all 0.15s', flex: 1, justifyContent: 'center' }}>
                      <input type="radio" name="platform" value={p} checked={form.platform === p}
                        onChange={() => setForm((f) => ({ ...f, platform: p }))} style={{ display: 'none' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: form.platform === p ? platformColor(p) : 'var(--color-text)' }}>
                        {platformLabel(p)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Meeting URL */}
              <div className="form-group">
                <label className="form-label">Meeting URL *</label>
                <input id="lc-url" className="form-input" type="url" value={form.meetingUrl}
                  onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..." />
              </div>

              {/* Scheduled At + Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time *</label>
                  <input id="lc-scheduled-at" className="form-input" type="datetime-local" value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input id="lc-duration" className="form-input" type="number" min={15} max={480} value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
                </div>
              </div>

              {/* Recurring */}
              <label className="form-check" style={{ cursor: 'pointer' }}>
                <input id="lc-recurring" type="checkbox" checked={form.isRecurring}
                  onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked, recurrenceDays: [] }))} />
                <span style={{ fontWeight: 600 }}>Recurring class</span>
              </label>

              {form.isRecurring && (
                <div className="form-group">
                  <label className="form-label">Repeat on *</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DAYS.map((day) => {
                      const selected = form.recurrenceDays.includes(day);
                      return (
                        <button key={day} type="button"
                          onClick={() => toggleDay(day)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 99,
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: '2px solid',
                            letterSpacing: '0.02em',
                            transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                            // Selected: vivid gradient + glow
                            borderColor:  selected ? '#6366f1' : 'var(--color-border)',
                            background:   selected
                              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                              : 'var(--color-bg-alt, rgba(255,255,255,0.04))',
                            color:        selected ? '#ffffff' : 'var(--color-text-muted)',
                            boxShadow:    selected ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
                            transform:    selected ? 'scale(1.08)' : 'scale(1)',
                          }}
                        >
                          {selected ? '✓ ' : ''}{day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Published */}
              <label className="form-check" style={{ cursor: 'pointer' }}>
                <input id="lc-active" type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Publish immediately (visible to students)
              </label>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-outline">Cancel</button>
              <button id="btn-save-live-class" onClick={save} disabled={saving} className="btn btn-primary">
                <Save size={15} /> {saving ? 'Saving...' : editing ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled delete confirm modal — replaces browser confirm() */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
