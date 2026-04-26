'use client';

import { useActionState, useEffect, useState } from 'react';

import { createOrderAndReturnAction, getAlipayPayUrl } from '@/app/shop-actions';

type ProductPageClientProps = {
  shopCode: string;
  shopName: string;
  product: {
    id: string;
    name: string;
    subtitle: string | null;
    price: number;
    stock_count: number;
    sold_count: number;
    summary: string | null;
    detail_html: string | null;
    usage_guide: string | null;
    refund_policy: string | null;
    notice_text: string | null;
    delivery_type: string;
    min_purchase_qty: number;
    max_purchase_qty: number;
    need_contact: boolean;
    need_remark: boolean;
    cover_url: string | null;
  };
};

const initialState = {
  ok: true,
  message: '',
  orderNo: undefined as string | undefined,
  amount: undefined as number | undefined,
  productName: undefined as string | undefined,
  quantity: undefined as number | undefined,
  queryToken: undefined as string | undefined,
};

export default function ProductPageClient({ shopCode, shopName, product }: ProductPageClientProps) {
  const [state, formAction, isPending] = useActionState(createOrderAndReturnAction, initialState);
  const [showModal, setShowModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isAutoDelivery = ['card_key', 'account_password', 'link', 'custom_text'].includes(product.delivery_type);

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.documentElement.setAttribute('data-theme', prev || 'dark');
    };
  }, []);

  useEffect(() => {
    const evaluateMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    evaluateMobile();
    window.addEventListener('resize', evaluateMobile);

    return () => {
      window.removeEventListener('resize', evaluateMobile);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const syncBackToOrder = () => {
      try {
        const raw = window.sessionStorage.getItem('pending-mobile-order');
        if (!raw) return;
        const data = JSON.parse(raw) as { orderNo?: string; createdAt?: number };
        if (!data.orderNo) return;
        if (data.createdAt && Date.now() - data.createdAt > 15 * 60 * 1000) {
          window.sessionStorage.removeItem('pending-mobile-order');
          return;
        }
        if (window.location.pathname !== `/order/${data.orderNo}`) {
          window.location.href = `/order/${data.orderNo}`;
        }
      } catch {
        window.sessionStorage.removeItem('pending-mobile-order');
      }
    };

    syncBackToOrder();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncBackToOrder();
      }
    };

    window.addEventListener('focus', syncBackToOrder);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncBackToOrder);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!state.ok && state.message) {
      window.alert(state.message);
    }
    if (state.ok && state.orderNo) {
      setShowModal(true);
    }
  }, [state]);

  async function handleConfirmPay() {
    if (!state.orderNo || !state.amount || !state.productName) return;
    setPayLoading(true);
    if (isMobile) {
      try {
        window.sessionStorage.setItem('pending-mobile-order', JSON.stringify({ orderNo: state.orderNo, createdAt: Date.now() }));
      } catch {}
      window.location.href = `/order/${state.orderNo}?pay=1`;
      return;
    }
    try {
      const payUrl = await getAlipayPayUrl(state.orderNo, state.amount, state.productName, 'pc');
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        window.location.href = `/order/${state.orderNo}`;
      }
    } catch {
      window.location.href = `/order/${state.orderNo}`;
    }
  }

  function handleCancelPay() {
    setShowModal(false);
    if (state.orderNo) {
      window.location.href = `/order/${state.orderNo}`;
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 10px 28px' : '32px 24px 80px', background: isMobile ? '#f1f5f9' : 'transparent', width: '100%', overflowX: 'hidden' }}>
      <a href={`/links/${shopCode}`} style={{ color: '#2563eb', fontSize: isMobile ? 13 : 15, fontWeight: 600 }}>← 返回店铺</a>

      <section style={{
        ...cardStyle,
        marginTop: 12,
        padding: isMobile ? 10 : 28,
        borderRadius: isMobile ? 16 : 24,
        border: isMobile ? 'none' : cardStyle.border,
        boxShadow: isMobile ? 'none' : cardStyle.boxShadow,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr .9fr', gap: isMobile ? 12 : 24 }}>
          <div>
            {product.cover_url ? (
              <div style={{ marginBottom: 10, borderRadius: isMobile ? 12 : 16, overflow: 'hidden', border: '1px solid rgba(148,163,184,.14)', background: '#fff' }}>
                <img src={product.cover_url} alt={product.name} style={{ width: '100%', maxHeight: isMobile ? 260 : 320, objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null}

            <section style={{ ...infoCardStyle, padding: isMobile ? 14 : 18 }}>
              <h1 style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? 28 : 32, lineHeight: 1.25, fontWeight: 800 }}>{product.name}</h1>
              <p style={{ color: '#64748b', lineHeight: 1.7, margin: '10px 0 0' }}>{product.subtitle || product.summary || '暂无描述'}</p>
              <div style={{ fontSize: isMobile ? 42 : 32, fontWeight: 800, margin: '12px 0 0', color: '#ef4444', lineHeight: 1 }}>¥{Number(product.price).toFixed(2)}</div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={pillStyle}>店铺：{shopName}</span>
                <span style={pillStyle}>库存：{product.stock_count}</span>
                <span style={pillStyle}>已售：{product.sold_count}</span>
                <span style={{ ...pillStyle, background: isAutoDelivery ? 'rgba(16,185,129,.12)' : 'rgba(251,191,36,.14)', color: isAutoDelivery ? '#059669' : '#d97706' }}>
                  {isAutoDelivery ? '自动发货' : '人工发货'}
                </span>
              </div>
            </section>
          </div>

          <form action={formAction} style={{ ...panelStyle, display: 'grid', gap: 14, alignSelf: 'start', padding: isMobile ? 14 : 20 }}>
            <input type="hidden" name="shopCode" value={shopCode} />
            <input type="hidden" name="productId" value={product.id} />
            <div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: isMobile ? 24 : 22 }}>立即下单</h3>
              <div style={{ color: '#64748b', fontSize: isMobile ? 14 : 13, lineHeight: 1.7 }}>
                {isAutoDelivery
                  ? '支付成功后系统将自动发货，订单页可直接查看发货结果。'
                  : '支付成功后进入待处理状态，请等待商家人工发货。'}
              </div>
            </div>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>购买数量</span>
              <input name="quantity" type="number" min={product.min_purchase_qty} max={product.max_purchase_qty} defaultValue={product.min_purchase_qty} style={inputStyle} />
              <small style={{ color: '#64748b' }}>限购范围：{product.min_purchase_qty} ~ {product.max_purchase_qty}</small>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>联系方式{product.need_contact ? '（必填）' : '（选填）'}</span>
              <input name="buyerContact" placeholder="邮箱 / 手机 / QQ" required={product.need_contact} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>备注{product.need_remark ? '（必填）' : '（选填）'}</span>
              <textarea name="remark" rows={isMobile ? 3 : 4} required={product.need_remark} style={textareaStyle} />
            </label>
            <button type="submit" style={{ ...primaryButton, opacity: isPending ? 0.7 : 1, padding: isMobile ? '14px 16px' : primaryButton.padding, fontSize: isMobile ? 17 : 15 }} disabled={isPending}>
              {isPending ? '提交中...' : '创建订单'}
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <section style={infoCardStyle}><strong>商品详情</strong><div style={{ color: '#64748b', marginTop: 8, lineHeight: 1.8 }}>{product.detail_html || '暂无详情'}</div></section>
          <section style={infoCardStyle}>
            <strong>使用说明</strong>
            <div style={{ color: '#64748b', marginTop: 8, lineHeight: 1.8 }}>
              {renderUsageGuideContent(product.usage_guide)}
            </div>
          </section>
          <section style={infoCardStyle}><strong>购买须知</strong><div style={{ color: '#64748b', marginTop: 8, lineHeight: 1.8 }}>{product.notice_text || '暂无购买须知'}</div></section>
          <section style={infoCardStyle}><strong>售后规则</strong><div style={{ color: '#64748b', marginTop: 8, lineHeight: 1.8 }}>{product.refund_policy || '暂无售后规则'}</div></section>
        </div>
      </section>

      {showModal && state.orderNo && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ margin: '0 0 20px', color: '#0f172a' }}>确认支付信息</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              <ConfirmRow label="支付金额" value={`${state.amount?.toFixed(2)} 元`} highlight />
              <ConfirmRow label="支付方式" value={isMobile ? '支付宝H5通道' : '支付宝PC通道'} />
              <ConfirmRow label="订单编号" value={state.orderNo} mono />
              <ConfirmRow label="商品名称" value={state.productName || '-'} />
              <ConfirmRow label="购买数量" value={String(state.quantity || 1)} />
              <ConfirmRow label="查询密钥" value={state.queryToken || '-'} mono />
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
              <button type="button" onClick={handleCancelPay} style={cancelBtnStyle}>取消支付</button>
              <button type="button" onClick={handleConfirmPay} disabled={payLoading} style={{ ...confirmBtnStyle, opacity: payLoading ? 0.7 : 1 }}>
                {payLoading ? '跳转中...' : '确认付款'}
              </button>
            </div>

            <p style={{ margin: '16px 0 0', padding: 12, borderRadius: 12, background: 'rgba(239,246,255,.8)', color: '#475569', fontSize: 13, lineHeight: 1.7, textAlign: 'center' }}>
              商品问题请先和商家交流，如果处理结果不满意，请于订单当日23点之前联系平台客服，超过时间认定订单没问题。
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function renderUsageGuideContent(content: string | null) {
  if (!content) {
    return '暂无说明';
  }

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return '暂无说明';
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {lines.map((line, index) => {
        const match = line.match(/^!\[[^\]]*\]\((.+)\)$/);
        if (match) {
          const src = match[1].trim();
          return (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={`使用说明图片${index + 1}`}
              style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(148,163,184,.14)', background: '#fff' }}
            />
          );
        }

        return <p key={`${line}-${index}`} style={{ margin: 0 }}>{line}</p>;
      })}
    </div>
  );
}

function ConfirmRow({ label, value, highlight = false, mono = false }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
      <span style={{ color: '#64748b', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{label}：</span>
      <span style={{
        color: highlight ? '#ef4444' : '#0f172a',
        fontWeight: highlight ? 800 : 700,
        fontSize: highlight ? 20 : 14,
        fontFamily: mono ? 'monospace' : 'inherit',
        background: mono ? 'rgba(239,246,255,.6)' : 'transparent',
        padding: mono ? '4px 8px' : 0,
        borderRadius: mono ? 6 : 0,
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = { padding: 28, borderRadius: 24, border: '1px solid rgba(148,163,184,.14)', background: '#fff', boxShadow: '0 10px 24px rgba(15,23,42,.05)' };
const panelStyle: React.CSSProperties = { padding: 20, borderRadius: 18, border: '1px solid rgba(148,163,184,.14)', background: '#fff', boxShadow: '0 8px 20px rgba(15,23,42,.05)', width: '100%', maxWidth: '100%', overflow: 'hidden' };
const infoCardStyle: React.CSSProperties = { padding: 16, borderRadius: 14, border: '1px solid rgba(148,163,184,.12)', background: '#fff' };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', background: '#fff', color: '#0f172a', fontSize: 16 };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryButton: React.CSSProperties = { padding: '12px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const pillStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,.14)', background: 'rgba(248,250,252,.95)', color: '#334155', fontSize: 13 };

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)' };
const modalStyle: React.CSSProperties = { width: '92%', maxWidth: 500, padding: 28, borderRadius: 24, background: '#fff', boxShadow: '0 24px 60px rgba(15,23,42,.18)' };
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 15 };
const confirmBtnStyle: React.CSSProperties = { flex: 1, padding: '14px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 };
