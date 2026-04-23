'use client';

import { useActionState } from 'react';

import { registerMerchantAuthAction } from '@/app/merchant/actions';

const initialState = {
  ok: true,
  message: '',
};

export default function MerchantRegisterPage() {
  const [state, formAction, isPending] = useActionState(registerMerchantAuthAction, initialState);

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>商户注册</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          填写联系人、电话、邮箱和密码后即可直接注册商户账号，注册成功后会自动登录并进入商户后台。
        </p>
        <form action={formAction} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>联系人姓名</span>
            <input name="contactName" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>联系电话</span>
            <input name="contactPhone" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>邮箱</span>
            <input name="email" type="email" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>密码</span>
            <input name="password" type="password" minLength={6} required style={inputStyle} />
          </label>
          {!state.ok && state.message ? <div style={errorStyle}>{state.message}</div> : null}
          <button type="submit" style={{ ...buttonStyle, opacity: isPending ? 0.75 : 1 }} disabled={isPending}>
            {isPending ? '注册中...' : '注册商户'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)', marginTop: 20 }}>已有账号？<a href="/merchant/login" style={{ color: '#a5b4fc' }}>去登录</a></p>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
};

const buttonStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 14,
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(239,68,68,.12)',
  color: '#fca5a5',
  border: '1px solid rgba(239,68,68,.2)',
};
