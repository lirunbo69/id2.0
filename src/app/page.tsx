const highlights = [
  ['自动发货闭环', '支付完成后自动校验库存、锁定发货资源，并即时下发卡密、账号或链接内容。'],
  ['商户快速入驻', '支持商户自助开店、商品上架、库存导入、订单管理与售后处理。'],
  ['稳定支付承接', '支持支付跳转、订单查询与回调处理，适合后续接入正式线上支付。'],
  ['长期经营友好', '兼顾品牌展示、买家转化和商户后台管理，适合持续扩展业务。'],
] as const;

const features = [
  ['自动发货', '支持卡密、账号、链接、文本等虚拟商品自动交付，减少人工值守成本。'],
  ['订单追踪', '买家可随时查询订单状态，平台可对支付、发货与售后流程进行跟踪。'],
  ['商户中心', '提供店铺装修、商品管理、分类管理、库存管理与订单处理能力。'],
  ['品牌展示', '支持搭建面向买家的前台店铺页，统一展示商品、公告与客服信息。'],
  ['安全风控', '预留支付回调、订单校验、操作审计与异常处理机制。'],
  ['轻量 SaaS', '部署方便、结构清晰，便于快速上线和后续迭代升级。'],
] as const;

const scenarios = ['游戏点卡', '会员激活码', '教程资源', '下载链接', '虚拟服务', '多商户寄售'];
const metrics = [
  ['24/7', '在线承接订单'],
  ['多类型', '虚拟商品交付'],
  ['分钟级', '商户开店效率'],
  ['品牌化', '前台展示体验'],
] as const;

export default function HomePage() {
  return (
    <main style={s.page}>
      <section style={s.heroWrap}>
        <div style={s.glowA} />
        <div style={s.glowB} />
        <div style={s.heroTopBar}>
          <a href="/" style={s.brand}>
            <span style={s.brandMark}>
              <span style={s.brandMarkM}>M</span>
              <span style={s.brandMarkT}>T</span>
            </span>
            <span style={s.brandTextWrap}>
              <span style={s.brandTitle}>MT虚拟商品自动发货系统</span>
              <span style={s.brandSubTitle}>Mtgo旗下产品</span>
            </span>
          </a>
        </div>
        <div style={s.hero}>
          <div style={s.left}>
            <span style={s.badge}>虚拟商品寄售与自动发货平台</span>
            <h1 style={s.h1}>让虚拟商品交易平台拥有更好的客户体验</h1>
            <p style={s.heroLead}>无人值守，增加被动收入。</p>
            <p style={s.desc}>
              面向虚拟商品经营场景，提供店铺展示、商品管理、库存导入、订单承接与自动发货能力，帮助商户更高效地完成交易闭环。
            </p>
            <div style={s.btnRow}>
              <a href="/merchant/register" style={s.primary}>立即入驻</a>
              <a href="/merchant/login" style={s.secondary}>商户登录</a>
              <a href="/order/query" style={s.ghost}>订单查询</a>
            </div>
            <div style={s.highlightGrid}>
              {highlights.map(([title, text]) => (
                <div key={title} style={s.highlightCard}>
                  <div style={s.cardTitle}>{title}</div>
                  <p style={s.cardText}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <div style={s.mini}>经营概览</div>
                <div style={s.panelTitle}>更适合正式对外展示的首页承接</div>
              </div>
              <span style={s.tag}>Day Theme</span>
            </div>
            <div style={s.window}>
              <div style={s.windowTop}>
                <i style={{ ...s.dot, background: '#93c5fd' }} />
                <i style={{ ...s.dot, background: '#c4b5fd' }} />
                <i style={{ ...s.dot, background: '#fde68a' }} />
              </div>
              <div style={s.windowBody}>
                <div style={s.metricGrid}>
                  {metrics.map(([value, label]) => (
                    <div key={label} style={s.metricCard}>
                      <div style={s.metricValue}>{value}</div>
                      <div style={s.metricLabel}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={s.largeCard}>
                  <div style={s.cardTitle}>适用场景</div>
                  <div style={s.pills}>
                    {scenarios.map((item) => <span key={item} style={s.pill}>{item}</span>)}
                  </div>
                </div>
                <div style={s.split2}>
                  <div style={s.softCard}><div style={s.cardTitle}>商户侧</div><p style={s.cardText}>开店、装修、上架、补库存、处理订单与售后，形成完整经营流程。</p></div>
                  <div style={s.softCard}><div style={s.cardTitle}>买家侧</div><p style={s.cardText}>浏览店铺、下单支付、查询订单、查看发货结果，路径简洁清晰。</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={s.section}>
        <span style={s.sectionBadge}>核心能力</span>
        <h2 style={s.h2}>聚焦虚拟商品交易，把体验做得更完整</h2>
        <p style={s.sectionDesc}>首页不再展示搭建说明与技术路径，而是面向客户表达产品价值、交易能力与平台优势。</p>
        <div style={s.featureGrid}>
          {features.map(([title, text]) => (
            <article key={title} style={s.featureCard}>
              <div style={s.iconBox}><div style={s.iconInner} /></div>
              <h3 style={s.featureTitle}>{title}</h3>
              <p style={s.featureText}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={s.dual}>
        <div style={s.dualMain}>
          <span style={s.sectionBadge}>为什么适合你</span>
          <h2 style={s.h2Small}>把复杂的发货与经营流程，整理成更顺手的线上体验</h2>
          <p style={s.sectionDesc}>从店铺展示，到商品承接、支付跳转、订单查询与自动发货，整条链路更适合做成正式对外运营的网站。</p>
          <div style={s.list}>
            <div style={s.listItem}>更适合展示品牌、信任感与平台能力</div>
            <div style={s.listItem}>更适合承接客户访问与交易转化</div>
            <div style={s.listItem}>更适合商户长期经营与后续功能扩展</div>
          </div>
        </div>
        <div style={s.dualSide}>
          <div style={s.quote}>“一个更高级的首页，不只是好看，而是能更好地承接客户、解释产品、提高转化。”</div>
          <div style={s.softCard}><div style={s.cardTitle}>适合持续升级</div><p style={s.cardText}>后续可以继续扩展套餐页、客户案例、支付说明、入驻流程和品牌文案体系。</p></div>
        </div>
      </section>

      <section style={s.ctaWrap}>
        <div style={s.cta}>
          <div>
            <span style={s.sectionBadge}>立即开始</span>
            <h2 style={s.h2Small}>让你的寄售平台先拥有一个真正能对外成交的首页</h2>
          </div>
          <div style={s.btnRow}>
            <a href="/merchant/register" style={s.primary}>免费开通商户</a>
            <a href="/merchant/login" style={s.secondary}>进入商户中心</a>
          </div>
        </div>
      </section>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { paddingBottom: 96, background: 'linear-gradient(180deg,#f8fbff 0%,#f5f7fb 40%,#fff 100%)' },
  heroWrap: { position: 'relative', overflow: 'hidden', padding: '72px 24px 56px' },
  glowA: { position: 'absolute', left: -80, top: -120, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,.14), transparent 72%)' },
  glowB: { position: 'absolute', right: -120, top: 30, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,.10), transparent 72%)' },
  hero: { position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 28 },
  heroTopBar: { position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto 28px', display: 'flex', alignItems: 'center' },
  brand: { display: 'inline-flex', alignItems: 'center', gap: 14, textDecoration: 'none' },
  brandMark: { width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 16px 34px rgba(59,130,246,.24)' },
  brandMarkM: { position: 'absolute', left: 10, top: 10, fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-.06em' },
  brandMarkT: { position: 'absolute', right: 10, bottom: 8, fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,.92)', letterSpacing: '-.08em' },
  brandTextWrap: { display: 'grid', gap: 2 },
  brandTitle: { fontSize: 24, lineHeight: 1.2, fontWeight: 800, color: '#0f172a' },
  brandSubTitle: { fontSize: 13, color: '#64748b', letterSpacing: '.04em' },
  left: { padding: '24px 8px 12px' },
  badge: { display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(59,130,246,.08)', color: '#3b82f6', fontSize: 13, fontWeight: 700 },
  h1: { margin: '20px 0 10px', fontSize: 56, lineHeight: 1.08, color: '#0f172a', letterSpacing: '-.03em' },
  heroLead: { margin: '0 0 14px', color: '#4f46e5', fontSize: 20, lineHeight: 1.6, fontWeight: 700 },
  desc: { margin: 0, maxWidth: 760, color: '#475569', fontSize: 18, lineHeight: 1.9 },
  btnRow: { display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 30 },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontWeight: 700, textDecoration: 'none', boxShadow: '0 18px 40px rgba(59,130,246,.18)' },
  secondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 14, border: '1px solid rgba(148,163,184,.2)', background: 'rgba(255,255,255,.82)', color: '#0f172a', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(15,23,42,.05)' },
  ghost: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 14, color: '#475569', fontWeight: 700, textDecoration: 'none' },
  highlightGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginTop: 34 },
  highlightCard: { padding: 18, borderRadius: 18, border: '1px solid rgba(148,163,184,.14)', background: 'rgba(255,255,255,.72)', boxShadow: '0 8px 30px rgba(15,23,42,.04)' },
  panel: { padding: 22, borderRadius: 28, border: '1px solid rgba(148,163,184,.16)', background: 'linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,252,.92))', boxShadow: '0 24px 70px rgba(15,23,42,.08)' },
  panelHead: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  mini: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  panelTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.35 },
  tag: { padding: '8px 12px', borderRadius: 999, background: 'rgba(99,102,241,.08)', color: '#4f46e5', fontWeight: 700, fontSize: 12, height: 'fit-content' },
  window: { overflow: 'hidden', borderRadius: 22, border: '1px solid rgba(148,163,184,.14)', background: '#fff' },
  windowTop: { display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,.12)', background: '#f8fafc' },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  windowBody: { padding: 18, display: 'grid', gap: 16, background: 'linear-gradient(180deg,#fff,#f8fbff)' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  metricCard: { padding: 16, borderRadius: 16, background: 'rgba(248,250,252,.95)', border: '1px solid rgba(148,163,184,.12)' },
  metricValue: { fontSize: 22, fontWeight: 800, color: '#0f172a' },
  metricLabel: { marginTop: 6, color: '#64748b', fontSize: 13 },
  largeCard: { padding: 18, borderRadius: 18, background: 'linear-gradient(180deg,rgba(239,246,255,.88),rgba(255,255,255,.92))', border: '1px solid rgba(147,197,253,.24)' },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  pill: { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#fff', border: '1px solid rgba(148,163,184,.12)', color: '#334155', fontSize: 13 },
  split2: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  softCard: { padding: 16, borderRadius: 16, background: '#fff', border: '1px solid rgba(148,163,184,.12)', boxShadow: '0 10px 36px rgba(15,23,42,.05)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 },
  cardText: { margin: 0, color: '#64748b', lineHeight: 1.75, fontSize: 14 },
  section: { maxWidth: 1240, margin: '0 auto', padding: '18px 24px 0' },
  sectionBadge: { display: 'inline-flex', color: '#4f46e5', fontWeight: 700, fontSize: 13, marginBottom: 12 },
  h2: { margin: '0 0 14px', fontSize: 38, lineHeight: 1.2, color: '#0f172a' },
  h2Small: { margin: '8px 0 14px', fontSize: 34, lineHeight: 1.25, color: '#0f172a' },
  sectionDesc: { margin: 0, maxWidth: 760, color: '#64748b', fontSize: 17, lineHeight: 1.85 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18, marginTop: 28 },
  featureCard: { padding: 24, borderRadius: 22, background: 'rgba(255,255,255,.88)', border: '1px solid rgba(148,163,184,.12)', boxShadow: '0 10px 36px rgba(15,23,42,.05)' },
  iconBox: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(96,165,250,.18),rgba(196,181,253,.18))', display: 'grid', placeItems: 'center' },
  iconInner: { width: 22, height: 22, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
  featureTitle: { margin: '18px 0 10px', fontSize: 20, color: '#0f172a' },
  featureText: { margin: 0, color: '#64748b', lineHeight: 1.8 },
  dual: { maxWidth: 1240, margin: '28px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18 },
  dualMain: { padding: 28, borderRadius: 26, border: '1px solid rgba(148,163,184,.12)', background: 'linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,252,.92))', boxShadow: '0 10px 36px rgba(15,23,42,.05)' },
  dualSide: { display: 'grid', gap: 18 },
  list: { display: 'grid', gap: 12, marginTop: 22 },
  listItem: { padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,.8)', border: '1px solid rgba(148,163,184,.12)', color: '#334155', fontWeight: 600 },
  quote: { padding: 28, borderRadius: 26, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', border: '1px solid rgba(147,197,253,.24)', color: '#1e293b', fontSize: 24, lineHeight: 1.7, fontWeight: 700 },
  ctaWrap: { maxWidth: 1240, margin: '28px auto 0', padding: '0 24px' },
  cta: { padding: 32, borderRadius: 28, background: 'linear-gradient(135deg,#fff,#f8fbff)', border: '1px solid rgba(148,163,184,.12)', boxShadow: '0 14px 44px rgba(15,23,42,.06)', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' },
};
