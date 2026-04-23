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
      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#a5b4fc', marginBottom: 8 }}>店铺编号：{shop.shop_code}</div>
            <h1 style={{ margin: 0, fontSize: 36 }}>{shop.name}</h1>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, maxWidth: 720 }}>{shop.intro || '商家暂未填写店铺简介。'}</p>
          </div>
          <div style={{ minWidth: 260 }}>
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)' }}>
              <div>营业状态：{shop.is_open ? '营业中' : '暂停营业'}</div>
              <div style={{ marginTop: 8 }}>QQ：{shop.contact_qq || '-'}</div>
              <div style={{ marginTop: 8 }}>微信：{shop.contact_wechat || '-'}</div>
              <div style={{ marginTop: 8 }}>公告：{shop.announcement || '暂无公告'}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>商品分类</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={`/links/${shopCode}`} style={{ ...pillStyle, background: !category ? 'rgba(79,70,229,.18)' : 'rgba(255,255,255,.03)' }}>全部 ({products.length})</a>
          {categories.map((item) => (
            <a key={item.id} href={`/links/${shopCode}?category=${item.id}`} style={{ ...pillStyle, background: category === item.id ? 'rgba(79,70,229,.18)' : 'rgba(255,255,255,.03)' }}>{item.name}</a>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 16 }}>商品列表</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {filteredProducts.length ? filteredProducts.map((product) => (
            <article key={product.id} style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>{product.name}</h3>
              <p style={{ color: 'var(--muted)' }}>{product.subtitle || product.summary || '暂无描述'}</p>
              <p style={{ color: 'var(--muted)' }}>库存：{product.stock_count} · 已售：{product.sold_count}</p>
              <div style={{ fontSize: 28, fontWeight: 700, margin: '16px 0' }}>¥{Number(product.price).toFixed(2)}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href={`/links/${shopCode}/product/${product.id}`} style={secondaryButton}>查看详情</a>
                <a href={`/links/${shopCode}/product/${product.id}`} style={primaryButton}>立即购买</a>
              </div>
            </article>
          )) : <div style={{ ...cardStyle, color: 'var(--muted)' }}>当前分类下暂无商品。</div>}
        </div>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' };
const pillStyle: React.CSSProperties = { display: 'inline-flex', padding: '10px 14px', borderRadius: 999, border: '1px solid var(--border)' };
const primaryButton: React.CSSProperties = { padding: '10px 14px', borderRadius: 12, background: 'var(--primary)', color: '#fff' };
const secondaryButton: React.CSSProperties = { padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)' };
