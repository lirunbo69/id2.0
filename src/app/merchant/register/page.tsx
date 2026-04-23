'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type Step = 'request_code' | 'verify_code';

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request_code');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsPending(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!contactName.trim() || !contactPhone.trim() || !normalizedEmail) {
        setErrorMessage('请完整填写联系人、电话和邮箱。');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          data: {
            nickname: contactName.trim(),
            contact_phone: contactPhone.trim(),
            role: 'merchant',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || '验证码发送失败。');
        return;
      }

      setEmail(normalizedEmail);
      setStep('verify_code');
      setSuccessMessage('验证码已发送到你的邮箱，请输入验证码完成注册。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '验证码发送失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsPending(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedCode = code.trim();
      const trimmedPassword = password.trim();

      if (!normalizedEmail || !trimmedCode || !trimmedPassword) {
        setErrorMessage('请填写邮箱验证码和登录密码。');
        return;
      }

      if (trimmedPassword.length < 6) {
        setErrorMessage('登录密码至少需要 6 位。');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: trimmedCode,
        type: 'email',
      });

      if (error) {
        setErrorMessage(error.message || '验证码校验失败。');
        return;
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        password: trimmedPassword,
        data: {
          nickname: contactName.trim(),
          contact_phone: contactPhone.trim(),
          role: 'merchant',
        },
      });

      if (updateUserError) {
        setErrorMessage(updateUserError.message || '注册成功，但设置密码失败。');
        return;
      }

      router.push('/merchant/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '注册失败，请稍后重试。');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>商户注册</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          填写邮箱后发送验证码，输入验证码并设置登录密码，即可完成商户注册。
        </p>

        {step === 'request_code' ? (
          <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
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
            <button type="submit" style={buttonStyle} disabled={isPending}>{isPending ? '发送中...' : '发送验证码'}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>注册邮箱</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>邮箱验证码</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>登录密码</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required style={inputStyle} />
            </label>
            {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
            {successMessage ? <div style={successStyle}>{successMessage}</div> : null}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => { setStep('request_code'); setCode(''); setPassword(''); setErrorMessage(''); setSuccessMessage(''); }} disabled={isPending}>返回上一步</button>
              <button type="submit" style={buttonStyle} disabled={isPending}>{isPending ? '提交中...' : '验证并注册'}</button>
            </div>
          </form>
        )}

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

const secondaryButtonStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
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
