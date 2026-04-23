import { getPublicShopData } from '@/app/shop-actions';

type ShopPageProps = {
  params: Promise<{ shopCode: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { shopCode } = await params;
  const { category } = await searchParams;
  const result = await getPublicShopData(shopCode);

  if (!result.ok) {
    return <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>店铺不存在</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  const { shop, categories, products } = result;
  const filteredProducts = category ? products.filter((item) => item.category_id === category) : products;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      <section style={heroCardStyle}>
        <div style={heroGlowLeftStyle} />
        <div style={heroGlowRightStyle} />
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 22 }}>
          <div style={brandRowStyle}>
            <a href="/" style={brandStyle}>
              <span style={brandMarkStyle}>
                <span style={brandMarkMStyle}>M</span>
                <span style={brandMarkTStyle}>T</span>
              </span>
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={brandTitleStyle}>MT虚拟商品自动发货系统</span>
                <span style={brandSubTitleStyle}>Mtgo旗下产品</span>
              </span>
            </a>
            <span style={shopCodeBadgeStyle}>店铺编号：{shop.shop_code}</span>
          </div>

          <div style={heroContentStyle}>
            <div>
              <h1 style={heroTitleStyle}>{shop.name}</h1>
              <p style={heroIntroStyle}>{shop.intro || '商家暂未填写店铺简介。'}</p>
              <div style={heroMetaRowStyle}>
                <span style={statusPillStyle(shop.is_open)}>{shop.is_open ? '营业中' : '暂停营业'}</span>
                <span style={metaPillStyle}>自动发货</span>
                <span style={metaPillStyle}>安全交易</span>
              </div>
            </div>

            <aside style={contactPanelStyle}>
              <div style={contactPanelTitleWrapStyle}>
                <div style={contactPanelEyebrowStyle}>客服与公告</div>
                <div style={contactPanelTitleStyle}>为买家提供及时支持</div>
              </div>
              <div style={infoListStyle}>
                <InfoRow label="营业状态" value={shop.is_open ? '营业中' : '暂停营业'} highlight={shop.is_open} />
                <InfoRow label="QQ" value={shop.contact_qq || '-'} />
                <InfoRow label="微信" value={shop.contact_wechat || '-'} />
                <InfoRow label="Telegram" value={shop.contact_telegram || '-'} />
              </div>
              <div style={announcementCardStyle}>
                <div style={announcementTitleStyle}>店铺公告</div>
                <div style={announcementTextStyle}>{shop.announcement || '暂无公告'}</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>商品分类</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={`/links/${shopCode}`} style={{ ...pillStyle, background: !category ? 'rgba(79,70,229,.12)' : '#fff', color: !category ? '#4338ca' : '#334155', borderColor: !category ? 'rgba(99,102,241,.18)' : 'rgba(148,163,184,.18)' }}>全部 ({products.length})</a>
          {categories.map((item) => (
            <a key={item.id} href={`/links/${shopCode}?category=${item.id}`} style={{ ...pillStyle, background: category === item.id ? 'rgba(79,70,229,.12)' : '#fff', color: category === item.id ? '#4338ca' : '#334155', borderColor: category === item.id ? 'rgba(99,102,241,.18)' : 'rgba(148,163,184,.18)' }}>{item.name}</a>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 16, color: '#0f172a' }}>商品列表</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {filteredProducts.length ? filteredProducts.map((product) => (
            <article key={product.id} style={productCardStyle}>
              <div style={productTopStyle}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{product.name}</h3>
                <span style={productTypePillStyle}>{product.delivery_type === 'manual' ? '人工发货' : '自动发货'}</span>
              </div>
              <p style={{ color: '#64748b', lineHeight: 1.75 }}>{product.subtitle || product.summary || '暂无描述'}</p>
              <p style={{ color: '#64748b', marginBottom: 0 }}>库存：{product.stock_count} · 已售：{product.sold_count}</p>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '18px 0 16px', color: '#0f172a' }}>¥{Number(product.price).toFixed(2)}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={`/links/${shopCode}/product/${product.id}`} style={secondaryButton}>查看详情</a>
                <a href={`/links/${shopCode}/product/${product.id}`} style={primaryButton}>立即购买</a>
              </div>
            </article>
          )) : <div style={{ ...cardStyle, color: '#64748b' }}>当前分类下暂无商品。</div>}
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={highlight ? infoValueHighlightStyle : infoValueStyle}>{value}</span>
    </div>
  );
}

function statusPillStyle(isOpen: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    padding: '9px 14px',
    borderRadius: 999,
    background: isOpen ? 'rgba(16,185,129,.12)' : 'rgba(148,163,184,.14)',
    color: isOpen ? '#059669' : '#64748b',
    fontWeight: 700,
    fontSize: 13,
  };
}

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  marginBottom: 24,
  padding: 28,
  borderRadius: 28,
  border: '1px solid rgba(148,163,184,.14)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.96))',
  boxShadow: '0 18px 50px rgba(15,23,42,.06)',
};

const heroGlowLeftStyle: React.CSSProperties = {
  position: 'absolute',
  top: -100,
  left: -90,
  width: 280,
  height: 280,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(96,165,250,.16), transparent 72%)',
};

const heroGlowRightStyle: React.CSSProperties = {
  position: 'absolute',
  right: -90,
  top: -40,
  width: 260,
  height: 260,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(167,139,250,.12), transparent 72%)',
};

const brandRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const brandStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 14,
  textDecoration: 'none',
};

const brandMarkStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
  display: 'grid',
  placeItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 14px 30px rgba(59,130,246,.20)',
};

const brandMarkMStyle: React.CSSProperties = {
  position: 'absolute',
  left: 9,
  top: 8,
  fontSize: 23,
  fontWeight: 900,
  color: '#fff',
  letterSpacing: '-.06em',
};

const brandMarkTStyle: React.CSSProperties = {
  position: 'absolute',
  right: 9,
  bottom: 7,
  fontSize: 24,
  fontWeight: 900,
  color: 'rgba(255,255,255,.94)',
  letterSpacing: '-.08em',
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.15,
  fontWeight: 800,
  color: '#0f172a',
};

const brandSubTitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
};

const shopCodeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.8)',
  border: '1px solid rgba(148,163,184,.16)',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
};

const heroContentStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 320px',
  gap: 24,
  alignItems: 'start',
};

const heroTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 38,
  lineHeight: 1.18,
  color: '#0f172a',
};

const heroIntroStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 720,
  color: '#64748b',
  lineHeight: 1.9,
  fontSize: 16,
};

const heroMetaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
};

const metaPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.82)',
  border: '1px solid rgba(148,163,184,.14)',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
};

const contactPanelStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  background: 'rgba(255,255,255,.8)',
  border: '1px solid rgba(148,163,184,.14)',
  boxShadow: '0 10px 28px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 16,
};

const contactPanelTitleWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
};

const contactPanelEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#4f46e5',
  letterSpacing: '.04em',
};

const contactPanelTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#0f172a',
};

const infoListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid rgba(148,163,184,.10)',
};

const infoLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
};

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 700,
  fontSize: 14,
  textAlign: 'right',
  wordBreak: 'break-all',
};

const infoValueHighlightStyle: React.CSSProperties = {
  ...infoValueStyle,
  color: '#059669',
};

const announcementCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(239,246,255,.8), rgba(255,255,255,.9))',
  border: '1px solid rgba(147,197,253,.20)',
};

const announcementTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: 8,
};

const announcementTextStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.8,
  fontSize: 14,
  wordBreak: 'break-word',
};

const cardStyle: React.CSSProperties = {
  padding: 28,
  borderRadius: 24,
  border: '1px solid rgba(148,163,184,.14)',
  background: 'rgba(255,255,255,.96)',
  boxShadow: '0 12px 34px rgba(15,23,42,.04)',
};

const productCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: 24,
};

const productTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const productTypePillStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(79,70,229,.10)',
  color: '#4338ca',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,.18)',
  textDecoration: 'none',
  fontWeight: 700,
};

const primaryButton: React.CSSProperties = {
  padding: '11px 15px',
  borderRadius: 12,
  background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
};

const secondaryButton: React.CSSProperties = {
  padding: '11px 15px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.18)',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 700,
};
