'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function MerchantSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsPending(true);

    try {
      const trimmedPassword = password.trim();
      const trimmedConfirmPassword = confirmPassword.trim();

      if (!trimmedPassword || !trimmedConfirmPassword) {
        setErrorMessage('请完整填写登录密码。');
        return;
      }

      if (trimmedPassword.length < 6) {
        setErrorMessage('登录密码至少需要 6 位。');
        return;
      }

      if (trimmedPassword !== trimmedConfirmPassword) {
        setErrorMessage('两次输入的密码不一致。');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword,
      });

      if (error) {
        setErrorMessage(error.message || '设置密码失败。');
        return;
      }

      router.push('/merchant/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '设置密码失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>设置登录密码</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          邮箱确认成功后，请设置你的商户后台登录密码，完成后将自动进入商户工作台。
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>登录密码</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>确认密码</span>
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" minLength={6} required style={inputStyle} />
          </label>
          {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          <button type="submit" style={buttonStyle} disabled={isPending}>{isPending ? '提交中...' : '保存密码并进入后台'}</button>
        </form>
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
