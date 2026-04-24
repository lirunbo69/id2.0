import { getMerchantAftersales } from '@/app/merchant/actions';
import { formatBeijingDateTime } from '@/lib/utils';

type MerchantAftersalesPageProps = {
  searchParams: Promise<{ keyword?: string; status?: string }>;
};

export default async function MerchantAftersalesPage({ searchParams }: MerchantAftersalesPageProps) {
  const filters = await searchParams;
  const result = await getMerchantAftersales(filters);

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>售后与投诉</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>售后与投诉</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>
            当前已接入售后相关订单状态，集中查看退款中、已退款和发货失败订单，作为商户售后处理台。
          </p>
        </div>
      </section>

      {!result.hasShop ? <section style={cardStyle}><div style={emptyStateStyle}>你还没有店铺，请先完成店铺设置。</div></section> : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="售后总数" value={String(result.summary.total)} />
        <StatCard label="退款处理中" value={String(result.summary.refundPending)} tone="pending" />
        <StatCard label="已退款" value={String(result.summary.refunded)} tone="success" />
        <StatCard label="发货失败" value={String(result.summary.deliveryFailed)} tone="warning" />
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>筛选条件</h2>
        <form method="get" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>订单号 / 联系方式</span>
              <input name="keyword" defaultValue={result.filters.keyword} placeholder="输入订单号或联系方式" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>售后状态</span>
              <select name="status" defaultValue={result.filters.status} style={inputStyle}>
                <option value="">全部状态</option>
                <option value="refund_pending">退款处理中</option>
                <option value="refunded">已退款</option>
                <option value="delivery_failed">发货失败</option>
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
              <button type="submit" style={primaryButtonStyle}>筛选</button>
              <a href="/merchant/aftersales" style={secondaryButtonStyle}>重置</a>
            </div>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
                <th style={thStyle}>订单号</th>
                <th style={thStyle}>商品信息</th>
                <th style={thStyle}>买家</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>金额</th>
                <th style={thStyle}>备注/说明</th>
                <th style={thStyle}>时间</th>
              </tr>
            </thead>
            <tbody>
              {result.records.length ? result.records.map((record) => {
                const productSnapshot = record.product_snapshot as { name?: string; subtitle?: string } | null;
                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                    <td style={tdStyle}>{record.order_no}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{productSnapshot?.name || '未知商品'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>{productSnapshot?.subtitle || '-'}</div>
                    </td>
                    <td style={tdStyle}>{record.buyer_contact || '-'}</td>
                    <td style={tdStyle}><span style={getStatusTagStyle(record.status)}>{record.status}</span></td>
                    <td style={tdStyle}>¥{Number(record.payable_amount || 0).toFixed(2)}</td>
                    <td style={tdStyle}>{record.remark || '暂无备注'}</td>
                    <td style={tdStyle}>
                      <div>下单：{formatBeijingDateTime(record.created_at)}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>支付：{record.paid_at ? formatBeijingDateTime(record.paid_at) : '未支付'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>发货：{record.delivered_at ? formatBeijingDateTime(record.delivered_at) : '未发货'}</div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={7} style={emptyTableStyle}>暂无售后/投诉记录。</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'pending' | 'success' | 'warning' }) {
  const backgroundMap: Record<string, string> = {
    default: 'rgba(15,23,42,.78)',
    pending: 'linear-gradient(180deg, rgba(120,53,15,.34), rgba(30,41,59,.85))',
    success: 'linear-gradient(180deg, rgba(6,95,70,.34), rgba(30,41,59,.85))',
    warning: 'linear-gradient(180deg, rgba(127,29,29,.34), rgba(30,41,59,.85))',
  };

  return (
    <div style={{ ...cardStyle, background: backgroundMap[tone] }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{value}</div>
    </div>
  );
}

function getStatusTagStyle(status: string): React.CSSProperties {
  if (status === 'refunded') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
  if (status === 'refund_pending') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontSize: 12, fontWeight: 700 };
  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#f87171', fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const thStyle: React.CSSProperties = { padding: '12px 10px', color: 'var(--muted)', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '14px 10px', verticalAlign: 'top' };
const emptyTableStyle: React.CSSProperties = { padding: '24px 10px', textAlign: 'center', color: 'var(--muted)' };
const emptyStateStyle: React.CSSProperties = { padding: 16, borderRadius: 14, color: 'var(--muted)', background: 'rgba(255,255,255,.03)' };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 84, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 84, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#e2e8f0' };
