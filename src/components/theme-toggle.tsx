'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const currentTheme = (document.documentElement.getAttribute('data-theme') as ThemeMode | null) || 'dark';
    setTheme(currentTheme);
  }, []);

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('merchant-theme', nextTheme);
    } catch {
      // ignore storage failures to avoid affecting auth/business flows
    }
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={() => updateTheme(isLight ? 'dark' : 'light')}
      style={toggleStyle}
      aria-label={isLight ? '切换到夜晚主题' : '切换到白天主题'}
      title={isLight ? '切换到夜晚主题' : '切换到白天主题'}
    >
      <span style={labelStyle}>{isLight ? '白天' : '夜晚'}</span>
      <span style={knobTrackStyle}>
        <span
          style={{
            ...knobStyle,
            transform: isLight ? 'translateX(28px)' : 'translateX(0)',
            background: isLight ? '#f59e0b' : '#1e293b',
            color: isLight ? '#fff' : '#cbd5e1',
          }}
        >
          {isLight ? '☀' : '☾'}
        </span>
      </span>
    </button>
  );
}

const toggleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface-soft)',
  color: 'var(--foreground)',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
};

const knobTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: 56,
  height: 28,
  borderRadius: 999,
  background: 'var(--surface-strong)',
  padding: 2,
};

const knobStyle: React.CSSProperties = {
  position: 'absolute',
  top: 2,
  left: 2,
  width: 24,
  height: 24,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  transition: 'transform 0.2s ease, background 0.2s ease',
};
