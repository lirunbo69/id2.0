import { getMerchantAnalytics } from '@/app/merchant/actions';

export default async function MerchantAnalyticsPage() {
  const result = await getMerchantAnalytics();

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>数据统计</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>数据统计</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>按订单和收入维度展示近期销售趋势、热销商品和订单状态分布。</p>
        </div>
      </section>

      {!result.hasShop ? <section style={cardStyle}><div style={emptyStateStyle}>你还没有店铺，请先完成店铺设置。</div></section> : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="订单总数" value={String(result.summary.totalOrders)} />
        <StatCard label="已支付订单" value={String(result.summary.paidOrders)} tone="success" />
        <StatCard label="退款相关订单" value={String(result.summary.refundedOrders)} tone="warning" />
        <StatCard label="累计销售额" value={`¥${result.summary.totalSales.toFixed(2)}`} />
        <StatCard label="退款率" value={`${(result.summary.refundRate * 100).toFixed(1)}%`} tone="pending" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>近 14 日销售趋势</h2>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {result.dailySales.length ? result.dailySales.map((item) => (
              <div key={item.date} style={trendRowStyle}>
                <div style={{ width: 110, color: 'var(--muted)' }}>{item.date}</div>
                <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, item.amount / Math.max(...result.dailySales.map((entry) => entry.amount || 1)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #22c55e)' }} />
                </div>
                <strong style={{ minWidth: 100, textAlign: 'right' }}>¥{item.amount.toFixed(2)}</strong>
              </div>
            )) : <div style={emptyStateStyle}>暂无销售趋势数据。</div>}
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>订单状态分布</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {result.statusDistribution.length ? result.statusDistribution.map((item) => (
              <div key={item.status} style={distributionRowStyle}>
                <span>{item.status}</span>
                <strong>{item.count}</strong>
              </div>
            )) : <div style={emptyStateStyle}>暂无状态分布数据。</div>}
          </div>
        </section>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>热销商品排行</h2>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
                <th style={thStyle}>商品</th>
                <th style={thStyle}>成交订单数</th>
                <th style={thStyle}>销售额</th>
              </tr>
            </thead>
            <tbody>
              {result.productRanking.length ? result.productRanking.map((item) => (
                <tr key={item.name} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.count}</td>
                  <td style={tdStyle}>¥{item.amount.toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan={3} style={emptyTableStyle}>暂无热销商品数据。</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'pending' }) {
  const backgroundMap: Record<string, string> = {
    default: 'rgba(15,23,42,.78)',
    success: 'linear-gradient(180deg, rgba(6,95,70,.34), rgba(30,41,59,.85))',
    warning: 'linear-gradient(180deg, rgba(127,29,29,.34), rgba(30,41,59,.85))',
    pending: 'linear-gradient(180deg, rgba(120,53,15,.34), rgba(30,41,59,.85))',
  };

  return (
    <div style={{ ...cardStyle, background: backgroundMap[tone] }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{value}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const trendRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const distributionRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)' };
const thStyle: React.CSSProperties = { padding: '12px 10px', color: 'var(--muted)', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '14px 10px' };
const emptyTableStyle: React.CSSProperties = { padding: '24px 10px', textAlign: 'center', color: 'var(--muted)' };
const emptyStateStyle: React.CSSProperties = { padding: 16, borderRadius: 14, color: 'var(--muted)', background: 'rgba(255,255,255,.03)' };
