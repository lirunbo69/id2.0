'use client';

import { useRef } from 'react';

type DeleteProductButtonProps = {
  productId: string;
  returnTo: string;
  action: (formData: FormData) => void;
};

export default function DeleteProductButton({ productId, returnTo, action }: DeleteProductButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleDeleteConfirm() {
    const ok = window.confirm('确认删除这个商品吗？删除后将无法恢复。');
    if (!ok) return;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action} style={{ margin: 0 }}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="button" onClick={handleDeleteConfirm} style={dangerButtonStyle}>删除商品</button>
    </form>
  );
}

const dangerButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid rgba(239,68,68,.25)',
  background: 'rgba(239,68,68,.08)',
  color: '#b91c1c',
  cursor: 'pointer',
};
