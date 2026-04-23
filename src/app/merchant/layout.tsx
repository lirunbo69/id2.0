import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { getMerchantDashboardGuide, logoutMerchantAuthAction } from '@/app/merchant/actions';

type DashboardLayoutProps = {
  children: ReactNode;
};

const merchantGroups = [
  {
    title: '概览',
    links: [
      ['工作台', '/merchant/dashboard'],
      ['店铺设置', '/merchant/shop'],
      ['入驻资料', '/merchant/onboarding'],
    ],
  },
  {
    title: '商品与订单',
    links: [
      ['分类管理', '/merchant/categories'],
      ['商品管理', '/merchant/products'],
      ['库存管理', '/merchant/inventory'],
      ['订单管理', '/merchant/orders'],
      ['售后投诉', '/merchant/aftersales'],
    ],
  },
  {
    title: '经营与系统',
    links: [
      ['财务中心', '/merchant/finance'],
      ['提现申请', '/merchant/withdraw'],
      ['数据统计', '/merchant/analytics'],
      ['开放 API', '/merchant/open-api'],
      ['安全设置', '/merchant/security'],
    ],
  },
];

export default async function MerchantLayout({ children }: DashboardLayoutProps) {
  const result = await getMerchantDashboardGuide();

  async function submitLogout() {
    'use server';
    await logoutMerchantAuthAction();
  }

  const merchantName = result.ok ? result.merchantName : '商户';
  const shopName = result.ok && result.shop ? result.shop.name : '未配置店铺';
  const shopStatus = result.ok && result.shop ? (result.shop.is_open ? '营业中' : '暂停营业') : '待配置';
  const shopUrl = result.ok ? result.shopUrl : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--shell-bg)', transition: 'background 0.25s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
        <aside style={{ borderRight: '1px solid var(--border)', padding: 24, background: 'var(--sidebar-bg)', backdropFilter: 'blur(18px)', transition: 'background 0.25s ease, border-color 0.25s ease' }}>
          <div style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 24 }}>Mtgo寄售</h2>
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{merchantName}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{shopName}</div>
          </div>

          <nav style={{ display: 'grid', gap: 24, marginTop: 24 }}>
            {merchantGroups.map((group) => (
              <div key={group.title}>
                <div style={{ color: 'var(--nav-muted)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>{group.title}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {group.links.map(([label, href]) => (
                    <a key={href} href={href} style={navLinkStyle}>{label}</a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr' }}>
          <header style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(18px)', transition: 'background 0.25s ease, border-color 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--nav-muted)', fontSize: 13 }}>商户后台 / Merchant Center</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={badgeStyle}>{merchantName}</span>
                  <span style={badgeStyle}>{shopStatus}</span>
                  {shopUrl ? <a href={shopUrl} target="_blank" rel="noreferrer" style={ghostButtonStyle}>访问前台店铺</a> : null}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <ThemeToggle />
                <a href="/" style={ghostButtonStyle}>返回首页</a>
                <a href="/merchant/orders" style={ghostButtonStyle}>查看订单</a>
                <form action={submitLogout}>
                  <button type="submit" style={primaryButtonStyle}>退出登录</button>
                </form>
              </div>
            </div>
          </header>

          <div style={{ padding: 28 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 42,
  padding: '10px 12px',
  borderRadius: 12,
  color: 'var(--nav-text)',
  background: 'var(--surface-soft)',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: 'var(--surface-strong)',
  color: 'var(--foreground)',
  fontSize: 13,
};

const ghostButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-soft)',
  color: 'var(--foreground)',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};
