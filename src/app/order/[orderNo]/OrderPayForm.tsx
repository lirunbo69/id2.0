'use client';

import { useMemo } from 'react';

type ServerAction = (formData: FormData) => void | Promise<void>;

export function OrderPayForm({
  action,
  orderNo,
  buttonLabel,
  buttonStyle,
}: {
  action: ServerAction;
  orderNo: string;
  buttonLabel: string;
  buttonStyle: React.CSSProperties;
}) {
  const channel = useMemo(() => {
    if (typeof window === 'undefined') return 'pc';
    return window.innerWidth <= 768 ? 'wap' : 'pc';
  }, []);

  return (
    <form action={action}>
      <input type="hidden" name="orderNo" value={orderNo} />
      <input type="hidden" name="channel" value={channel} />
      <button type="submit" style={buttonStyle}>{buttonLabel}</button>
    </form>
  );
}
