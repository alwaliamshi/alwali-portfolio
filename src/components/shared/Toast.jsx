import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type || 'success'}`} role="status" aria-live="polite">
      <span>{toast.type === 'error' ? '!' : '✓'}</span>
      <div>{toast.message}</div>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>×</button>
    </div>
  );
}
