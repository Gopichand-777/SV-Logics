// React components ONLY — no plain object exports (required for Vite Fast Refresh)
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { setAddFn } from './toastStore.js';

const ICONS = {
  success: <CheckCircle   size={18} color="#10b981" />,
  error:   <XCircle       size={18} color="#ef4444" />,
  warning: <AlertTriangle size={18} color="#f59e0b" />,
  info:    <Info          size={18} color="#3b82f6" />,
};

const COLORS = {
  success: { border: 'rgba(16,185,129,0.35)',  bg: 'rgba(16,185,129,0.08)'  },
  error:   { border: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.08)'   },
  warning: { border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)'  },
  info:    { border: 'rgba(59,130,246,0.35)',  bg: 'rgba(59,130,246,0.08)'  },
};

function ToastItem({ id, type = 'info', message, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [dismiss]);

  const colors = COLORS[type] || COLORS.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: `color-mix(in srgb, var(--color-surface) 92%, transparent)`,
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${colors.border.replace('0.35', '0.9')}`,
      borderRadius: 10,
      padding: '12px 14px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      minWidth: 280, maxWidth: 380,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[type]}</div>
      <p style={{
        flex: 1, margin: 0, fontSize: '0.84rem',
        color: 'var(--color-text)', lineHeight: 1.5, fontWeight: 500,
      }}>
        {message}
      </p>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', padding: 0, lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register the add function in the shared store so toast.js can call it
  useEffect(() => {
    setAddFn(add);
    return () => setAddFn(null);
  }, [add]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 10,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem {...t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
