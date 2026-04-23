'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const contactName = String(formData.get('contactName') || '').trim();
      const contactPhone = String(formData.get('contactPhone') || '').trim();
      const email = String(formData.get('email') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '').trim();

      if (!contactName || !contactPhone || !email || !password) {
        setErrorMessage('请完整填写商户注册信息。');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: contactName,
            contact_phone: contactPhone,
            role: 'merchant',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || '商户注册失败。');
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setErrorMessage(loginError.message || '注册成功，但自动登录失败。');
        return;
      }

      router.push('/merchant/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '商户注册失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>商户注册</h1>
        <p style={{ color: 'var(--muted)' }}>先创建 Auth 账号；如你的 Supabase 开启邮箱验证，可能需要确认邮箱后再登录。</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>联系人姓名</span><input name="contactName" required style={inputStyle} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>联系电话</span><input name="contactPhone" required style={inputStyle} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>邮箱</span><input name="email" type="email" required style={inputStyle} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>密码</span><input name="password" type="password" minLength={6} required style={inputStyle} /></label>
          {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          <button type="submit" style={buttonStyle} disabled={isPending}>{isPending ? '注册中...' : '注册商户'}</button>
        </form>
        <p style={{ color: 'var(--muted)' }}>已有账号？<a href="/merchant/login" style={{ color: '#a5b4fc' }}>去登录</a></p>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const buttonStyle: React.CSSProperties = { padding: '14px 18px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: 1 };
const errorStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.2)' };
