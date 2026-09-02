// React components ONLY — no plain object exports (Vite Fast Refresh compatible)
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { setAddFn } from './toastStore.js';

const ICONS = {
  success: <CheckCircle   size={18} color="#10b981" />,
  error:   <XCircle       size={18} color="#ef4444" />,
  warning: <AlertTriangle size={18} color="#f59e0b" />,
  info:    <Info          size={18} color="#3b82f6" />,
};

const BAR_COLORS = {
  success: '#10b981',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};

function ToastItem({ id, type = 'info', message, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onRemove(id), 320);
  }, [id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, [dismiss]);

  const color = BAR_COLORS[type] || BAR_COLORS.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: 'var(--color-surface)',
      border: `1px solid var(--color-border)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      padding: '13px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      minWidth: 280, maxWidth: 380,
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.95)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[type]}</div>
      <p style={{
        flex: 1, margin: 0,
        fontSize: '0.84rem', lineHeight: 1.5, fontWeight: 500,
        color: 'var(--color-text)', fontFamily: 'var(--font)',
      }}>
        {message}
      </p>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0, background: 'none', border: 'none',
          cursor: 'pointer', padding: 2, lineHeight: 1,
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

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
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem {...t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
