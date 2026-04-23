type AdminLayoutProps = {
  children: React.ReactNode;
};

const adminLinks = [
  ['总览', '/admin/dashboard'],
  ['商户管理', '/admin/merchants'],
  ['店铺管理', '/admin/shops'],
  ['商品管理', '/admin/products'],
  ['订单管理', '/admin/orders'],
  ['提现审核', '/admin/withdrawals'],
  ['投诉仲裁', '/admin/disputes'],
  ['内容管理', '/admin/cms'],
  ['系统设置', '/admin/settings'],
  ['角色权限', '/admin/roles'],
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid var(--border)', padding: 24, background: 'rgba(2,6,23,.82)' }}>
        <h2 style={{ marginTop: 0 }}>平台后台</h2>
        <nav style={{ display: 'grid', gap: 10 }}>
          {adminLinks.map(([label, href]) => (
            <a key={href} href={href} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.03)' }}>
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <div>
        <header style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(15,23,42,.6)' }}>
          千寻寄售 · 平台管理后台
        </header>
        {children}
      </div>
    </div>
  );
}
