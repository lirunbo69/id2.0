'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function MerchantRegisterPage() {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsPending(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedContactName = contactName.trim();
      const trimmedContactPhone = contactPhone.trim();

      if (!trimmedContactName || !trimmedContactPhone || !normalizedEmail) {
        setErrorMessage('请完整填写联系人、电话和邮箱。');
        return;
      }

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${siteUrl}/auth/callback?next=/merchant/set-password`,
          data: {
            nickname: trimmedContactName,
            contact_phone: trimmedContactPhone,
            role: 'merchant',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || '确认邮件发送失败。');
        return;
      }

      setEmail(normalizedEmail);
      setSuccessMessage('确认邮件已发送，请点击邮件中的确认链接继续完成注册。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '确认邮件发送失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>商户注册</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          填写邮箱后发送确认邮件，点击邮件中的链接即可继续完成商户注册。
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>联系人姓名</span>
            <input value={contactName} onChange={(event) => setContactName(event.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>联系电话</span>
            <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>邮箱</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={inputStyle} />
          </label>
          {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          {successMessage ? <div style={successStyle}>{successMessage}</div> : null}
          <button type="submit" style={buttonStyle} disabled={isPending}>{isPending ? '发送中...' : '发送确认邮件'}</button>
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

const successStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(34,197,94,.12)',
  color: '#86efac',
  border: '1px solid rgba(34,197,94,.24)',
};
