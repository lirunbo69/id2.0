import { appendMerchantOrderRemarkAction, closeMerchantOrderAction, getMerchantOrders, redeliverMerchantOrderAction, triggerMerchantOrderPaymentAction } from '@/app/merchant/actions';

type MerchantOrdersPageProps = {
  searchParams: Promise<{ keyword?: string; status?: string; buyerContact?: string; closeOrderId?: string; success?: string }>;
};

export default async function MerchantOrdersPage({ searchParams }: MerchantOrdersPageProps) {
  const filters = await searchParams;
  const buildOrdersPath = (overrides: Partial<typeof filters> = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...overrides };
    if (merged.keyword) params.set('keyword', merged.keyword);
    if (merged.status) params.set('status', merged.status);
    if (merged.buyerContact) params.set('buyerContact', merged.buyerContact);
    if (merged.closeOrderId) params.set('closeOrderId', merged.closeOrderId);
    if (merged.success) params.set('success', merged.success);
    const query = params.toString();
    return query ? `/merchant/orders?${query}` : '/merchant/orders';
  };
  const result = await getMerchantOrders(filters);
  const closeOrderId = String(filters.closeOrderId || '').trim();
  const closeTargetOrder = closeOrderId ? result.ok && result.orders.find((item) => item.id === closeOrderId) : null;
  const successMessage = String(filters.success || '').trim();

  async function submitPayAction(formData: FormData) {
    'use server';
    await triggerMerchantOrderPaymentAction(formData);
  }

  async function submitRedeliverAction(formData: FormData) {
    'use server';
    await redeliverMerchantOrderAction(formData);
  }

  async function submitCloseAction(formData: FormData) {
    'use server';
    await closeMerchantOrderAction(formData);
  }

  async function submitRemarkAction(formData: FormData) {
    'use server';
    await appendMerchantOrderRemarkAction(formData);
  }

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>订单管理</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>订单管理</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>查看订单状态、发货结果，并根据订单号、状态、联系方式进行筛选。</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="订单总数" value={String(result.summary.total)} />
        <StatCard label="待支付" value={String(result.summary.pendingPayment)} tone="pending" />
        <StatCard label="已发货" value={String(result.summary.delivered)} tone="success" />
        <StatCard label="异常订单" value={String(result.summary.failed)} tone="warning" />
      </section>

      {!result.hasShop ? (
        <section style={cardStyle}>
          <div style={emptyStateStyle}>你还没有店铺，请先完成店铺设置，再开始接单。</div>
        </section>
      ) : null}

      {successMessage ? <section style={successStyle}>{successMessage}</section> : null}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>筛选条件</h2>
        <form method="get" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>订单号</span>
              <input name="keyword" defaultValue={result.filters.keyword} placeholder="输入订单号" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>订单状态</span>
              <select name="status" defaultValue={result.filters.status} style={inputStyle}>
                <option value="">全部状态</option>
                <option value="pending_payment">待支付</option>
                <option value="paid">已支付</option>
                <option value="delivered">已发货</option>
                <option value="delivery_failed">发货失败</option>
                <option value="cancelled">已取消</option>
                <option value="closed">已关闭</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>联系方式</span>
              <input name="buyerContact" defaultValue={result.filters.buyerContact} placeholder="邮箱/手机号/QQ" style={inputStyle} />
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
              <button type="submit" style={primaryButtonStyle}>筛选</button>
              <a href="/merchant/orders" style={secondaryButtonStyle}>重置</a>
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
                <th style={thStyle}>买家信息</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>金额</th>
                <th style={thStyle}>时间</th>
                <th style={thStyle}>发货结果</th>
                <th style={thStyle}>快捷操作</th>
              </tr>
            </thead>
            <tbody>
              {result.orders.length ? result.orders.map((order) => {
                const productSnapshot = order.product_snapshot as { name?: string; subtitle?: string } | null;
                const deliveryResult = Array.isArray(order.delivery_result) ? order.delivery_result as { preview?: string }[] : [];

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{order.order_no}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>数量：{order.quantity}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{productSnapshot?.name || '未知商品'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>{productSnapshot?.subtitle || order.delivery_type}</div>
                    </td>
                    <td style={tdStyle}>{order.buyer_contact || '-'}</td>
                    <td style={tdStyle}><span style={getStatusBadgeStyle(order.status)}>{order.status}</span></td>
                    <td style={tdStyle}>¥{Number(order.payable_amount || 0).toFixed(2)}</td>
                    <td style={tdStyle}>
                      <div>下单：{new Date(order.created_at).toLocaleString('zh-CN')}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>支付：{order.paid_at ? new Date(order.paid_at).toLocaleString('zh-CN') : '未支付'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>发货：{order.delivered_at ? new Date(order.delivered_at).toLocaleString('zh-CN') : '未发货'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <a href={`/merchant/orders/${order.id}`} style={detailLinkStyle}>查看详情</a>
                        {deliveryResult.length ? (
                          <div style={{ display: 'grid', gap: 6 }}>
                            {deliveryResult.slice(0, 3).map((item, index) => (
                              <div key={`${order.id}-${index}`} style={deliveryItemStyle}>{item.preview || '已发货内容'}</div>
                            ))}
                            {deliveryResult.length > 3 ? <div style={{ color: 'var(--muted)' }}>还有 {deliveryResult.length - 3} 条内容</div> : null}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>{order.status === 'delivery_failed' ? '发货失败' : '暂未发货'}</span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
                        {order.status === 'pending_payment' ? (
                          <form action={submitPayAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <button type="submit" style={actionButtonStyle}>触发支付回调</button>
                          </form>
                        ) : null}
                        {(order.status === 'paid' || order.status === 'delivery_failed') ? (
                          <form action={submitRedeliverAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <button type="submit" style={actionButtonStyle}>自动补发</button>
                          </form>
                        ) : null}
                        {order.status !== 'closed' && order.status !== 'cancelled' ? (
                          <a href={buildOrdersPath({ closeOrderId: order.id, success: undefined })} style={dangerButtonStyle}>关闭订单</a>
                        ) : null}
                        <form action={submitRemarkAction} style={{ display: 'grid', gap: 6 }}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input name="remark" placeholder="追加内部备注" style={miniInputStyle} />
                          <button type="submit" style={secondaryMiniButtonStyle}>追加备注</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={emptyTableStyle}>暂无符合条件的订单。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {closeTargetOrder ? (
        <div style={modalOverlayStyle}>
          <section style={modalCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>确认关闭订单</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              你确定要关闭订单 <strong style={{ color: 'var(--foreground)' }}>{closeTargetOrder.order_no}</strong> 吗？关闭后订单将不可继续支付。
            </p>
            <form action={submitCloseAction} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
              <input type="hidden" name="orderId" value={closeTargetOrder.id} />
              <input type="hidden" name="reason" value="商家在订单列表中手动关闭订单。" />
              <input type="hidden" name="returnTo" value={buildOrdersPath({ closeOrderId: undefined, success: undefined })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <a href={buildOrdersPath({ closeOrderId: undefined, success: undefined })} style={secondaryButtonStyle}>取消</a>
                <button type="submit" style={dangerButtonStyle}>确定关闭</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
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

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,.58)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  zIndex: 1000,
};

const modalCardStyle: React.CSSProperties = {
  width: 'min(520px, 100%)',
  padding: 24,
  borderRadius: 24,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'var(--card)',
  boxShadow: '0 24px 64px rgba(2,6,23,.4)',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
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

const deliveryItemStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 10,
  background: 'rgba(255,255,255,.04)',
  color: '#cbd5e1',
  fontSize: 13,
};

const detailLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '6px 8px',
  borderRadius: 10,
  background: 'rgba(79,70,229,.18)',
  color: '#c7d2fe',
  fontSize: 13,
  fontWeight: 700,
};

const miniInputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'var(--surface-soft)',
  color: 'var(--foreground)',
};

const actionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(59,130,246,.12)',
  color: '#93c5fd',
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryMiniButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'var(--surface-soft)',
  color: 'var(--foreground)',
  cursor: 'pointer',
  fontWeight: 700,
};

const dangerButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid rgba(239,68,68,.2)',
  background: 'rgba(239,68,68,.12)',
  color: '#fca5a5',
  cursor: 'pointer',
  fontWeight: 700,
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

const successStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: 'rgba(16,185,129,.12)',
  color: '#86efac',
  border: '1px solid rgba(16,185,129,.22)',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 84,
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 84,
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: '#e2e8f0',
};
