'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function MerchantLoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get('email') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '').trim();

      if (!email || !password) {
        setErrorMessage('请输入邮箱和密码。');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message || '登录失败。');
        return;
      }

      window.location.href = '/merchant/dashboard';
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>商户登录</h1>
        <p style={{ color: 'var(--muted)' }}>使用 Supabase Auth 邮箱密码登录。若提示账号不存在，请先注册商户账号。</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>邮箱</span>
            <input name="email" type="email" required style={inputStyle} autoComplete="email" />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>密码</span>
            <input name="password" type="password" required minLength={6} style={inputStyle} autoComplete="current-password" />
          </label>
          {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          <button type="submit" style={{ ...buttonStyle, opacity: isPending ? 0.75 : 1 }} disabled={isPending}>
            {isPending ? '登录中...' : '登录'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)' }}>还没有账号？<a href="/merchant/register" style={{ color: '#a5b4fc' }}>去注册</a></p>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const buttonStyle: React.CSSProperties = { padding: '14px 18px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const errorStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.2)' };
