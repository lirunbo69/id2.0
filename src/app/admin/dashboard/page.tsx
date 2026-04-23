export default function AdminDashboardPage() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>平台管理后台</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          后续这里会接入商户审核、提现审核、投诉仲裁、平台订单、系统设置和角色权限管理。
        </p>
      </section>
    </main>
  );
}
