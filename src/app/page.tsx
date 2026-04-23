const features = [
  {
    title: '多商户寄售',
    description: '支持商户入驻、店铺开通、商品上架、库存导入和订单管理。',
  },
  {
    title: '自动发货',
    description: '支付成功后自动锁定库存并下发卡密、账号或链接内容。',
  },
  {
    title: '平台风控',
    description: '支持订单风险校验、投诉仲裁、提现审核与操作审计。',
  },
  {
    title: 'SaaS 架构',
    description: '前端部署在 Vercel，后端完全基于 Supabase 能力实现。',
  },
];

const modules = [
  '买家店铺页 /links/[shopCode]',
  '匿名订单查询 /order/query',
  '商户注册 /merchant/register',
  '商户登录 /merchant/login',
  '商户后台 /merchant/*',
  '平台管理后台 /admin/*',
  'Supabase Edge Functions 支付回调与自动发货',
  'Storage 资源管理与投诉附件上传',
];

export default function HomePage() {
  return (
    <main style={{ padding: '48px 24px 96px' }}>
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 32,
          border: '1px solid var(--border)',
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(15,23,42,.85), rgba(15,23,42,.6))',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 999, background: 'rgba(79,70,229,.15)', color: '#c7d2fe', fontSize: 14 }}>
          千寻寄售 SaaS 平台骨架
        </div>
        <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: '20px 0 16px' }}>
          基于 Next.js + Supabase 的
          <br />
          虚拟商品自动发货平台
        </h1>
        <p style={{ maxWidth: 760, color: 'var(--muted)', fontSize: 18, lineHeight: 1.8 }}>
          现在已经支持商户注册、商户登录、创建店铺、创建分类、创建商品、导入库存，以及前台真实店铺页、商品详情、创建订单、模拟支付和自动发货。
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28 }}>
          <a href="/merchant/register" style={primaryButton}>商户注册</a>
          <a href="/merchant/login" style={secondaryButton}>商户登录</a>
          <a href="/merchant/dashboard" style={secondaryButton}>进入商户后台</a>
          <a href="/order/query" style={secondaryButton}>订单查询</a>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '32px auto 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {features.map((item) => (
            <article
              key={item.title}
              style={{
                padding: 24,
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--card)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 20 }}>{item.title}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '32px auto 0' }}>
        <div style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card)' }}>
          <h2 style={{ marginTop: 0 }}>当前可直接访问的入口</h2>
          <ul style={{ color: 'var(--muted)', lineHeight: 2, paddingLeft: 20, marginBottom: 0 }}>
            {modules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: 'rgba(251,191,36,.08)', color: '#fcd34d', lineHeight: 1.8 }}>
            注意：店铺页现在已经接入真实数据库，所以不能再访问 `/links/demo-shop`。
            你需要先注册商户、创建店铺、创建商品后，再用真实的 `shop_code` 访问 `/links/你的shop_code`。
          </div>
        </div>
      </section>
    </main>
  );
}

const primaryButton: React.CSSProperties = {
  padding: '14px 22px',
  borderRadius: 14,
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  fontWeight: 700,
};

const secondaryButton: React.CSSProperties = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,.03)',
};
