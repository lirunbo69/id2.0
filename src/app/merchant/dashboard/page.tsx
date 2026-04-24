import { getMerchantDashboardGuide } from '@/app/merchant/actions';
import { formatBeijingDateTime } from '@/lib/utils';

export default async function MerchantDashboardPage() {
  const result = await getMerchantDashboardGuide();

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>商户工作台</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#8b9bb6', fontSize: 14 }}>欢迎回来，{result.merchantName}</div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 34 }}>商户工作台</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8, maxWidth: 760 }}>
            这里集中展示你的经营概览、待办事项、快捷入口和最近订单，方便你快速处理日常业务。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/merchant/products/new" style={primaryButtonStyle}>发布商品</a>
          <a href="/merchant/inventory" style={secondaryButtonStyle}>导入库存</a>
          <a href="/merchant/orders" style={secondaryButtonStyle}>查看订单</a>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="今日订单" value={String(result.todayOrderCount)} subLabel="今日新增订单数" />
        <StatCard label="订单总数" value={String(result.totalOrderCount)} subLabel="累计全部订单" />
        <StatCard label="今日销售额" value={`¥${result.todaySalesAmount.toFixed(2)}`} subLabel="已支付/已发货统计" />
        <StatCard label="累计销售额" value={`¥${result.totalSalesAmount.toFixed(2)}`} subLabel="总经营收入" />
        <StatCard label="可用库存" value={String(result.availableInventoryCount)} subLabel="当前可发货库存" />
        <StatCard label="发货异常" value={String(result.failedOrderCount)} subLabel="失败/关闭订单" tone="warning" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 24 }}>
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={{ margin: 0 }}>待办事项</h2>
              <p style={helperTextStyle}>优先处理这些项目，避免影响店铺正常经营。</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {result.pendingTasks.length ? result.pendingTasks.map((task) => (
              <div key={task} style={todoItemStyle}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#fbbf24' }} />
                <span>{task}</span>
              </div>
            )) : <div style={emptyStateStyle}>当前没有待办事项，店铺经营状态良好。</div>}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={{ margin: 0 }}>店铺摘要</h2>
              <p style={helperTextStyle}>当前商户基础经营信息。</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <SummaryRow label="店铺名称" value={result.shop?.name || '未配置'} />
            <SummaryRow label="店铺状态" value={result.shop ? (result.shop.is_open ? '营业中' : '暂停营业') : '未配置'} />
            <SummaryRow label="分类数量" value={String(result.categoryCount)} />
            <SummaryRow label="商品数量" value={String(result.productCount)} />
            <SummaryRow label="库存数量" value={String(result.inventoryCount)} />
            <SummaryRow label="待支付订单" value={String(result.pendingPaymentCount)} />
            <SummaryRow label="已发货订单" value={String(result.deliveredOrderCount)} />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={{ margin: 0 }}>快捷入口</h2>
            <p style={helperTextStyle}>高频功能直达。</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {result.quickLinks.map((item) => (
            <a key={item.href + item.title} href={item.href} style={quickLinkStyle}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div style={{ color: 'var(--muted)', marginTop: 6, lineHeight: 1.7 }}>{item.description}</div>
            </a>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 24 }}>
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={{ margin: 0 }}>最近订单</h2>
              <p style={helperTextStyle}>最近 6 条订单动态。</p>
            </div>
            <a href="/merchant/orders" style={linkStyle}>查看全部</a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
                  <th style={thStyle}>订单号</th>
                  <th style={thStyle}>商品</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>金额</th>
                  <th style={thStyle}>时间</th>
                </tr>
              </thead>
              <tbody>
                {result.recentOrders.length ? result.recentOrders.map((order) => (
                  <tr key={order.orderNo} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                    <td style={tdStyle}>{order.orderNo}</td>
                    <td style={tdStyle}>{order.productName}</td>
                    <td style={tdStyle}><span style={getStatusBadgeStyle(order.status)}>{order.status}</span></td>
                    <td style={tdStyle}>¥{order.amount.toFixed(2)}</td>
                    <td style={tdStyle}>{formatBeijingDateTime(order.createdAt)}</td>
                  </tr>
                )) : <tr><td colSpan={5} style={emptyTableStyle}>暂无订单数据。</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={{ margin: 0 }}>库存预警</h2>
              <p style={helperTextStyle}>库存较低的商品，建议及时补货。</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {result.lowStockProducts.length ? result.lowStockProducts.map((product) => (
              <div key={product.id} style={warnCardStyle}>
                <div style={{ fontWeight: 700 }}>{product.name}</div>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>库存：{product.stockCount} · 已售：{product.soldCount}</div>
              </div>
            )) : <div style={emptyStateStyle}>暂无库存预警商品。</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, subLabel, tone = 'default' }: { label: string; value: string; subLabel: string; tone?: 'default' | 'warning' }) {
  return (
    <div style={{ ...cardStyle, background: tone === 'warning' ? 'rgba(255,255,255,.92)' : 'var(--card)' }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{value}</div>
      <div style={{ color: '#8b9bb6', marginTop: 8, fontSize: 13 }}>{subLabel}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,.08)' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const colorMap: Record<string, { background: string; color: string }> = {
    pending_payment: { background: 'rgba(251,191,36,.12)', color: '#fbbf24' },
    paid: { background: 'rgba(59,130,246,.12)', color: '#60a5fa' },
    delivered: { background: 'rgba(16,185,129,.12)', color: '#34d399' },
    delivery_failed: { background: 'rgba(239,68,68,.12)', color: '#f87171' },
    cancelled: { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' },
    closed: { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' },
  };

  const config = colorMap[status] || { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' };
  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: config.background, color: config.color, fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 20,
  border: '1px solid rgba(148,163,184,.12)',
  background: 'var(--card)',
  boxShadow: '0 10px 30px rgba(2,6,23,.22)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
};

const helperTextStyle: React.CSSProperties = {
  color: 'var(--muted)',
  margin: '8px 0 0',
  lineHeight: 1.7,
};

const todoItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,.03)',
};

const quickLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: 18,
  borderRadius: 16,
  border: '1px solid rgba(148,163,184,.12)',
  background: 'rgba(255,255,255,.03)',
};

const warnCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: 'rgba(251,191,36,.08)',
  border: '1px solid rgba(251,191,36,.18)',
};

const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  color: 'var(--muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 10px',
  verticalAlign: 'top',
};

const emptyTableStyle: React.CSSProperties = {
  padding: '24px 10px',
  textAlign: 'center',
  color: 'var(--muted)',
};

const emptyStateStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  color: 'var(--muted)',
  background: 'rgba(255,255,255,.03)',
};

const linkStyle: React.CSSProperties = {
  color: '#a5b4fc',
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: 12,
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: '#e2e8f0',
};
