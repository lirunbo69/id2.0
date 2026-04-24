'use client';

import { useEffect, useRef } from 'react';

type ServerAction = (formData: FormData) => void | Promise<void>;

export function AutoSubmitForm({
  action,
  fields,
  enabled,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  enabled: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <form ref={formRef} action={action} style={{ display: 'none' }}>
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit">submit</button>
    </form>
  );
}

export function OrderAutoRefresh({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const reload = () => window.location.reload();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') reload();
    };

    const timer = window.setInterval(reload, 3000);
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);

  return null;
}
