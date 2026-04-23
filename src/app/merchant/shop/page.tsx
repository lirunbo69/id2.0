import { headers } from 'next/headers';

import { resolveSiteUrl } from '@/lib/utils';
import { getMerchantShopDetail, upsertMerchantShopAction } from '@/app/merchant/actions';

export default async function MerchantShopPage() {
  async function submitShopForm(formData: FormData) {
    'use server';

    await upsertMerchantShopAction(formData);
  }

  const result = await getMerchantShopDetail();

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>店铺设置</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  const shop = result.shop;
  const headerStore = await headers();
  const siteUrl = resolveSiteUrl({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    host: headerStore.get('x-forwarded-host') || headerStore.get('host') || 'localhost:3007',
    protocol: headerStore.get('x-forwarded-proto'),
  });
  const shopUrl = shop?.shop_code ? `${siteUrl}/links/${shop.shop_code}` : null;
  const merchantName = result.merchantProfile.contact_name;

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>店铺设置</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>
            配置店铺基础资料、营业状态、联系方式、展示素材和搜索优化信息。首次保存会自动创建店铺。
          </p>
        </div>
        {shopUrl ? <a href={shopUrl} target="_blank" rel="noreferrer" style={primaryButtonStyle}>访问前台店铺</a> : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 24 }}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>店铺概览</h2>
          {!shop ? (
            <div style={warnStyle}>
              你当前还没有店铺。首次保存本页内容时，系统会自动为你创建店铺，并生成唯一的店铺编号和前台访问地址。
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <OverviewRow label="店铺编号" value={shop.shop_code} />
              <OverviewRow label="店铺名称" value={shop.name || '-'} />
              <OverviewRow label="店铺状态" value={shop.is_open ? '营业中' : '暂停营业'} />
              <OverviewRow label="商户联系人" value={merchantName || '-'} />
              <OverviewRow label="前台地址" value={shopUrl || '-'} link={shopUrl || undefined} />
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>展示与经营提示</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={tipCardStyle}>建议完善店铺公告、客服联系方式和 SEO 信息，提升买家信任度与搜索展示效果。</div>
            <div style={tipCardStyle}>如需暂停接单，可关闭“店铺营业中”开关，前台会显示暂停营业状态。</div>
            <div style={tipCardStyle}>保存成功后，你可以直接通过右上角按钮访问前台店铺页检查展示效果。</div>
          </div>
        </div>
      </section>

      <form action={submitShopForm} style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>基础资料</h2>
          <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>店铺名称</span>
              <input name="name" defaultValue={shop?.name ?? ''} required style={inputStyle} />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>店铺简介</span>
              <textarea name="intro" defaultValue={shop?.intro ?? ''} rows={4} style={textareaStyle} />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>店铺公告</span>
              <textarea name="announcement" defaultValue={shop?.announcement ?? ''} rows={4} style={textareaStyle} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>展示素材</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Logo URL</span>
              <input name="logoUrl" defaultValue={shop?.logo_url ?? ''} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Banner URL</span>
              <input name="bannerUrl" defaultValue={shop?.banner_url ?? ''} style={inputStyle} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>联系与客服</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>QQ</span>
              <input name="contactQq" defaultValue={shop?.contact_qq ?? ''} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>微信</span>
              <input name="contactWechat" defaultValue={shop?.contact_wechat ?? ''} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Telegram</span>
              <input name="contactTelegram" defaultValue={shop?.contact_telegram ?? ''} style={inputStyle} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            <span>客服链接</span>
            <input name="customerServiceUrl" defaultValue={shop?.customer_service_url ?? ''} style={inputStyle} />
          </label>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>搜索优化</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>SEO 标题</span>
              <input name="seoTitle" defaultValue={shop?.seo_title ?? ''} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>SEO 描述</span>
              <input name="seoDescription" defaultValue={shop?.seo_description ?? ''} style={inputStyle} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>经营状态</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input name="isOpen" type="checkbox" defaultChecked={shop?.is_open ?? true} />
            <span>店铺营业中</span>
          </label>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={primaryButtonStyle}>保存店铺设置</button>
        </div>
      </form>
    </main>
  );
}

function OverviewRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div style={{ display: 'grid', gap: 6, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,.08)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', wordBreak: 'break-all' }}>{value}</a> : <strong style={{ wordBreak: 'break-all' }}>{value}</strong>}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 20,
  border: '1px solid rgba(148,163,184,.12)',
  background: 'var(--card)',
  boxShadow: '0 10px 30px rgba(2,6,23,.22)',
};

const warnStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: 'rgba(251,191,36,.08)',
  border: '1px solid rgba(251,191,36,.22)',
  color: '#fcd34d',
  lineHeight: 1.8,
};

const tipCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: 'rgba(255,255,255,.03)',
  color: 'var(--muted)',
  lineHeight: 1.8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};
