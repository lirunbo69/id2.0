import { getOrderDetail, initiateAlipayPaymentAction, simulatePayOrderAction } from '@/app/shop-actions';
import { isAlipayTradeSuccess, verifyAlipayNotify } from '@/lib/alipay';
import { processOrderPayment } from '@/lib/order-flow';

import { AutoSubmitForm, OrderAutoRefresh } from './OrderAutoClient';

type OrderDetailPageProps = {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const entries = Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] || '' : value || '']);
  return Object.fromEntries(entries) as Record<string, string>;
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { orderNo } = await params;
  const resolvedSearchParams = normalizeSearchParams(await searchParams);

  const returnedOrderNo = String(resolvedSearchParams.out_trade_no || resolvedSearchParams.order_no || '').trim();
  const returnedTradeStatus = String(resolvedSearchParams.trade_status || '').trim();
  const shouldSyncReturnedPayment = returnedOrderNo === orderNo && isAlipayTradeSuccess(returnedTradeStatus) && verifyAlipayNotify(resolvedSearchParams);

  if (shouldSyncReturnedPayment) {
    await processOrderPayment(orderNo);
  }

  const result = await getOrderDetail(orderNo);

  async function simulatePay(formData: FormData) {
    'use server';
    await simulatePayOrderAction(formData);
  }

  async function payWithAlipay(formData: FormData) {
    'use server';
    await initiateAlipayPaymentAction(formData);
  }

  if (!result.ok) {
    return <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>订单不存在</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  const { order } = result;
  const shopCode = result.shopCode;
  const productSnapshot = order.product_snapshot as { name?: string; subtitle?: string; delivery_type?: string } | null;
  const deliveryItems = Array.isArray(order.delivery_result) ? order.delivery_result as { preview?: string; content?: string; type?: string }[] : [];
  const canPay = order.status === 'pending_payment';
  const shouldAutoPay = String(resolvedSearchParams.pay || '') === '1' && canPay;
  const shouldAutoRefresh = order.status === 'pending_payment' || order.status === 'paid';

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
      <AutoSubmitForm
        action={payWithAlipay}
        enabled={shouldAutoPay}
        fields={{ orderNo: order.order_no, channel: 'wap' }}
      />
      <OrderAutoRefresh enabled={shouldAutoRefresh} />
      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: 8 }}>订单详情</h1>
            <div style={{ color: 'var(--muted)' }}>订单创建成功后，可通过订单号 + 查询密钥随时查询。</div>
          </div>
          <span style={getStatusStyle(order.status)}>{getStatusText(order.status)}</span>
        </div>

        <section style={{ ...panelStyle, marginTop: 20 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow label="订单号" value={order.order_no} />
            <InfoRow label="商品名称" value={productSnapshot?.name || '未知商品'} />
            <InfoRow label="商品副标题" value={productSnapshot?.subtitle || '-'} />
            <InfoRow label="发货类型" value={getDeliveryTypeText(order.delivery_type)} />
            <InfoRow label="购买数量" value={String(order.quantity)} />
            <InfoRow label="订单金额" value={`¥${Number(order.payable_amount).toFixed(2)}`} />
            <InfoRow label="联系方式" value={order.buyer_contact || '-'} />
            <InfoRow label="创建时间" value={new Date(order.created_at).toLocaleString('zh-CN')} />
            <InfoRow label="支付时间" value={order.paid_at ? new Date(order.paid_at).toLocaleString('zh-CN') : '未支付'} />
            <InfoRow label="发货时间" value={order.delivered_at ? new Date(order.delivered_at).toLocaleString('zh-CN') : '未发货'} />
            <InfoRow label="查询密钥" value={order.query_token} mono />
            <InfoRow label="备注" value={order.remark || '-'} />
          </div>
        </section>

        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>发货结果</h2>
          {deliveryItems.length ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {deliveryItems.map((item, index) => (
                <div key={`${order.order_no}-${index}`} style={deliveryItemStyle}>
                  <div style={{ fontWeight: 700 }}>结果 {index + 1}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>{item.preview || item.content || '已生成发货结果'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', marginTop: 12 }}>
              {order.status === 'pending_payment' ? '请先完成支付。你也可以用下方按钮模拟支付回调，系统会按正式回调链路尝试自动发货。' : '当前暂无发货结果。'}
            </div>
          )}
        </section>

        {canPay ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <form action={payWithAlipay}>
              <input type="hidden" name="orderNo" value={order.order_no} />
              <button type="submit" style={buttonStyle}>前往支付宝支付</button>
            </form>
            <form action={simulatePay}>
              <input type="hidden" name="orderNo" value={order.order_no} />
              <button type="submit" style={secondaryButtonStyle}>模拟支付回调并执行发货</button>
            </form>
          </div>
        ) : null}

        {shopCode && (
          <div style={{ marginTop: 20 }}>
            <a href={`/links/${shopCode}`} style={continueBuyBtnStyle}>继续购买</a>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      <strong style={{ fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</strong>
    </div>
  );
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending_payment: '待支付',
    paid: '已支付 / 待发货',
    delivered: '已自动发货',
    delivery_failed: '自动发货失败',
    cancelled: '已取消',
    closed: '已关闭',
  };

  return map[status] || status;
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    pending_payment: { background: 'rgba(251,191,36,.12)', color: '#fbbf24' },
    paid: { background: 'rgba(59,130,246,.12)', color: '#60a5fa' },
    delivered: { background: 'rgba(16,185,129,.12)', color: '#34d399' },
    delivery_failed: { background: 'rgba(239,68,68,.12)', color: '#f87171' },
    cancelled: { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' },
    closed: { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' },
  };

  return {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    ...(map[status] || { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' }),
  };
}

function getDeliveryTypeText(deliveryType: string) {
  const map: Record<string, string> = {
    card_key: '卡密自动发货',
    account_password: '账号密码自动发货',
    link: '链接自动发货',
    custom_text: '文本自动发货',
    manual: '人工发货',
  };

  return map[deliveryType] || deliveryType;
}

const cardStyle: React.CSSProperties = { padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' };
const panelStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-soft)' };
const deliveryItemStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: 'var(--surface-soft)', border: '1px solid var(--border)' };
const buttonStyle: React.CSSProperties = { padding: '14px 18px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontWeight: 700, cursor: 'pointer' };
const continueBuyBtnStyle: React.CSSProperties = { display: 'inline-flex', padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 15 };
