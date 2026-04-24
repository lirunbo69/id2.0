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

export function OrderAutoRefresh({ enabled, orderNo, status }: { enabled: boolean; orderNo: string; status: string }) {
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('pending-mobile-order');
      if (!raw) return;
      const data = JSON.parse(raw) as { orderNo?: string };
      if (data.orderNo !== orderNo) return;
      if (status === 'delivered' || status === 'closed' || status === 'cancelled' || status === 'delivery_failed') {
        window.sessionStorage.removeItem('pending-mobile-order');
      }
    } catch {
      window.sessionStorage.removeItem('pending-mobile-order');
    }
  }, [orderNo, status]);

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
