import { Trash2 } from 'lucide-react';

/**
 * Styled delete confirmation modal — replaces browser confirm().
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *   const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });
 *   const closeConfirm = () => setConfirmState(null);
 *
 *   {confirmState && (
 *     <ConfirmModal {...confirmState} onCancel={closeConfirm} />
 *   )}
 */
export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 25px 70px rgba(0,0,0,0.55)', overflow: 'hidden',
      }}>
        {/* Red gradient header */}
        <div style={{
          background: 'linear-gradient(135deg,#dc2626,#ef4444)',
          padding: '20px 22px 18px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Trash2 size={22} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{title}</h3>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 20px' }}>
          <p style={{
            margin: '0 0 18px', fontSize: '0.84rem',
            color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center',
          }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 2, padding: '10px 16px',
                background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              <Trash2 size={14} /> Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
