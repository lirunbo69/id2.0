import { createServerSupabaseClient } from '@/lib/supabase';

export default async function SupabaseStatusPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>Supabase 连接状态</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          这个页面用于确认项目是否已经填入真实的 Supabase 环境变量，并验证当前服务端是否能读取登录用户。
        </p>

        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <div>URL：{process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置'}</div>
          <div>Anon Key：{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置'}</div>
          <div>Site URL：{process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : '未配置'}</div>
          <div>
            环境状态：
            <strong style={{ color: envReady ? '#34d399' : '#f87171', marginLeft: 8 }}>
              {envReady ? '环境变量已接入' : '请先填写 .env.local'}
            </strong>
          </div>
          <div>
            当前登录用户：
            <strong style={{ color: user ? '#34d399' : '#fbbf24', marginLeft: 8 }}>
              {user ? user.email || user.id : '未登录'}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}
