import { getMerchantFinanceOverview } from '@/app/merchant/actions';

export default async function MerchantFinancePage() {
  const result = await getMerchantFinanceOverview();

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>财务中心</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>财务中心</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>查看累计收入、可提现余额、已提现金额和最近收款订单。</p>
        </div>
        <a href="/merchant/withdraw" style={primaryButtonStyle}>申请提现</a>
      </section>

      {!result.hasShop ? <section style={cardStyle}><div style={emptyStateStyle}>你还没有店铺，请先完成店铺设置后再查看财务数据。</div></section> : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="累计销售额" value={`¥${result.summary.totalSales.toFixed(2)}`} />
        <StatCard label="可提现余额" value={`¥${result.summary.availableBalance.toFixed(2)}`} tone="success" />
        <StatCard label="已提现金额" value={`¥${result.summary.withdrawnAmount.toFixed(2)}`} />
        <StatCard label="提现处理中" value={`¥${result.summary.pendingWithdrawAmount.toFixed(2)}`} tone="pending" />
        <StatCard label="已支付订单" value={String(result.summary.paidOrderCount)} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>最近收款订单</h2>
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
                  <th style={thStyle}>订单号</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>金额</th>
                  <th style={thStyle}>支付时间</th>
                </tr>
              </thead>
              <tbody>
                {result.recentOrders.length ? result.recentOrders.map((order) => (
                  <tr key={order.order_no} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                    <td style={tdStyle}>{order.order_no}</td>
                    <td style={tdStyle}><span style={statusTagStyle}>{order.status}</span></td>
                    <td style={tdStyle}>¥{Number(order.payable_amount || 0).toFixed(2)}</td>
                    <td style={tdStyle}>{order.paid_at ? new Date(order.paid_at).toLocaleString('zh-CN') : new Date(order.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                )) : <tr><td colSpan={4} style={emptyTableStyle}>暂无收款订单。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>提现记录</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {result.withdrawRecords.length ? result.withdrawRecords.slice(0, 8).map((record) => (
              <div key={record.id} style={recordCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>¥{Number(record.amount || 0).toFixed(2)}</strong>
                  <span style={getWithdrawTagStyle(record.status)}>{record.status}</span>
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 8 }}>{record.channel} · {record.account_name}</div>
                <div style={{ color: '#94a3b8', marginTop: 6 }}>{record.account_no}</div>
                <div style={{ color: '#8b9bb6', marginTop: 6 }}>{new Date(record.created_at).toLocaleString('zh-CN')}</div>
              </div>
            )) : <div style={emptyStateStyle}>暂无提现记录。提交提现申请后会显示在这里。</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'pending' }) {
  const backgroundMap: Record<string, string> = {
    default: 'rgba(15,23,42,.78)',
    success: 'linear-gradient(180deg, rgba(6,95,70,.34), rgba(30,41,59,.85))',
    pending: 'linear-gradient(180deg, rgba(120,53,15,.34), rgba(30,41,59,.85))',
  };

  return (
    <div style={{ ...cardStyle, background: backgroundMap[tone] }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{value}</div>
    </div>
  );
}

function getWithdrawTagStyle(status: string): React.CSSProperties {
  if (status === 'paid') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
  if (status === 'rejected') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#f87171', fontSize: 12, fontWeight: 700 };
  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700 };
const thStyle: React.CSSProperties = { padding: '12px 10px', color: 'var(--muted)', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '14px 10px' };
const emptyTableStyle: React.CSSProperties = { padding: '24px 10px', textAlign: 'center', color: 'var(--muted)' };
const emptyStateStyle: React.CSSProperties = { padding: 16, borderRadius: 14, color: 'var(--muted)', background: 'rgba(255,255,255,.03)' };
const statusTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
const recordCardStyle: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.03)' };
