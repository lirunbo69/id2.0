'use client';

import { useEffect, useState } from 'react';

type ActionToastProps = {
  success?: string;
  error?: string;
};

export default function ActionToast({ success = '', error = '' }: ActionToastProps) {
  const [visible, setVisible] = useState(Boolean(success || error));
  const message = error || success;
  const isError = Boolean(error);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message || !visible) return null;

  return (
    <div style={{ ...toastStyle, ...(isError ? errorStyle : successStyle) }}>
      {message}
    </div>
  );
}

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  maxWidth: 420,
  padding: '12px 14px',
  borderRadius: 12,
  fontWeight: 700,
  boxShadow: '0 12px 28px rgba(2,6,23,.25)',
  border: '1px solid transparent',
  backdropFilter: 'blur(6px)',
};

const successStyle: React.CSSProperties = {
  background: 'rgba(16,185,129,.14)',
  borderColor: 'rgba(16,185,129,.28)',
  color: '#86efac',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,.14)',
  borderColor: 'rgba(239,68,68,.32)',
  color: '#fca5a5',
};
