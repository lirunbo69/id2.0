import { getMerchantOrderDetail, manualDeliverMerchantOrderAction, redeliverMerchantOrderAction } from '@/app/merchant/actions';

type MerchantOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function MerchantOrderDetailPage({ params }: MerchantOrderDetailPageProps) {
  const { orderId } = await params;

  async function submitRedeliver(formData: FormData) {
    'use server';
    await redeliverMerchantOrderAction(formData);
  }

  async function submitManualDeliver(formData: FormData) {
    'use server';
    await manualDeliverMerchantOrderAction(formData);
  }

  const result = await getMerchantOrderDetail(orderId);

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>订单详情</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  if (!result.order) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>订单详情</h1><p style={{ color: 'var(--muted)' }}>未找到订单。</p></section></main>;
  }

  const order = result.order;
  const productSnapshot = order.product_snapshot as { name?: string; subtitle?: string; summary?: string } | null;
  const deliveryResult = Array.isArray(order.delivery_result) ? order.delivery_result as { preview?: string; content?: string }[] : [];
  const canRedeliver = order.status === 'paid' || order.status === 'delivery_failed';
  const canManualDeliver = order.status === 'pending_payment' || order.status === 'paid' || order.status === 'delivery_failed';

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>订单详情</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>查看订单状态、商品快照、买家联系方式和发货结果详情，并支持商家补发或手动发货。</p>
        </div>
        <a href="/merchant/orders" style={secondaryButtonStyle}>返回订单列表</a>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>订单信息</h2>
          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <InfoRow label="订单号" value={order.order_no} />
            <InfoRow label="订单状态" value={order.status} badge />
            <InfoRow label="买家联系方式" value={order.buyer_contact || '-'} />
            <InfoRow label="订单金额" value={`¥${Number(order.payable_amount || 0).toFixed(2)}`} />
            <InfoRow label="购买数量" value={String(order.quantity)} />
            <InfoRow label="发货类型" value={order.delivery_type} />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>时间节点</h2>
          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <InfoRow label="下单时间" value={new Date(order.created_at).toLocaleString('zh-CN')} />
            <InfoRow label="支付时间" value={order.paid_at ? new Date(order.paid_at).toLocaleString('zh-CN') : '未支付'} />
            <InfoRow label="发货时间" value={order.delivered_at ? new Date(order.delivered_at).toLocaleString('zh-CN') : '未发货'} />
            <InfoRow label="买家备注" value={order.remark || '暂无备注'} />
          </div>
        </section>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>商品快照</h2>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <InfoRow label="商品名称" value={productSnapshot?.name || '未知商品'} />
          <InfoRow label="副标题" value={productSnapshot?.subtitle || '-'} />
          <InfoRow label="商品摘要" value={productSnapshot?.summary || '-'} />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>发货结果</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {deliveryResult.length ? deliveryResult.map((item, index) => (
              <div key={`${order.id}-${index}`} style={deliveryCardStyle}>
                <div style={{ fontWeight: 700 }}>结果 {index + 1}</div>
                <div style={{ color: 'var(--muted)', marginTop: 8 }}>{item.preview || item.content || '已发货内容'}</div>
              </div>
            )) : <div style={emptyStateStyle}>{order.status === 'delivery_failed' ? '该订单发货失败，请及时处理。' : '暂无发货结果内容。'}</div>}
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>发货处理</h2>
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {canRedeliver ? (
              <form action={submitRedeliver} style={{ display: 'grid', gap: 10 }}>
                <input type="hidden" name="orderId" value={order.id} />
                <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>适用于自动发货订单。系统会重新从可用库存中发货。</div>
                <button type="submit" style={primaryButtonStyle}>自动补发</button>
              </form>
            ) : null}

            {canManualDeliver ? (
              <form action={submitManualDeliver} style={{ display: 'grid', gap: 10 }}>
                <input type="hidden" name="orderId" value={order.id} />
                <textarea name="manualContent" rows={6} placeholder="填写手动发货内容，例如卡密、账号密码、下载地址或处理说明" style={textareaStyle} required />
                <button type="submit" style={secondaryActionButtonStyle}>手动发货</button>
              </form>
            ) : (
              <div style={emptyStateStyle}>当前订单状态无需再次发货。</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoRow({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return <div style={{ display: 'grid', gap: 6, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,.08)' }}><span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>{badge ? <span style={statusTagStyle}>{value}</span> : <strong style={{ wordBreak: 'break-all' }}>{value}</strong>}</div>;
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'var(--surface-soft)', color: 'var(--foreground)' };
const statusTagStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '4px 8px', borderRadius: 999, background: 'rgba(59,130,246,.12)', color: '#60a5fa', fontSize: 12, fontWeight: 700 };
const deliveryCardStyle: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'var(--surface-soft)' };
const emptyStateStyle: React.CSSProperties = { padding: 16, borderRadius: 14, color: 'var(--muted)', background: 'var(--surface-soft)' };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryActionButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'var(--surface-soft)', color: 'var(--foreground)', fontWeight: 700, cursor: 'pointer' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'var(--surface-soft)', color: 'var(--foreground)', resize: 'vertical' };
