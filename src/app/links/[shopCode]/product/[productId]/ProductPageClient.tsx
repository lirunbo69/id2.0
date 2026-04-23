'use client';

import { useActionState, useEffect } from 'react';

import { createOrderWithFeedbackAction } from '@/app/shop-actions';

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
  };
};

const initialState = {
  ok: true,
  message: '',
};

export default function ProductPageClient({ shopCode, shopName, product }: ProductPageClientProps) {
  const [state, formAction] = useActionState(createOrderWithFeedbackAction, initialState);
  const isAutoDelivery = ['card_key', 'account_password', 'link', 'custom_text'].includes(product.delivery_type);

  useEffect(() => {
    if (!state.ok && state.message) {
      window.alert(state.message);
    }
  }, [state]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <a href={`/links/${shopCode}`} style={{ color: '#a5b4fc' }}>← 返回店铺</a>
      <section style={{ ...cardStyle, marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .9fr', gap: 24 }}>
          <div>
            <h1 style={{ marginTop: 0 }}>{product.name}</h1>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{product.subtitle || product.summary || '暂无描述'}</p>
            <div style={{ fontSize: 32, fontWeight: 700, margin: '16px 0' }}>¥{Number(product.price).toFixed(2)}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <span style={pillStyle}>店铺：{shopName}</span>
              <span style={pillStyle}>库存：{product.stock_count}</span>
              <span style={pillStyle}>已售：{product.sold_count}</span>
              <span style={{ ...pillStyle, background: isAutoDelivery ? 'rgba(16,185,129,.12)' : 'rgba(251,191,36,.14)', color: isAutoDelivery ? '#34d399' : '#fbbf24' }}>
                {isAutoDelivery ? '自动发货' : '人工发货'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <section style={infoCardStyle}>
                <strong>商品详情</strong>
                <div style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>{product.detail_html || '暂无详情'}</div>
              </section>
              <section style={infoCardStyle}>
                <strong>使用说明</strong>
                <div style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>{product.usage_guide || '暂无说明'}</div>
              </section>
              <section style={infoCardStyle}>
                <strong>购买须知</strong>
                <div style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>{product.notice_text || '暂无购买须知'}</div>
              </section>
              <section style={infoCardStyle}>
                <strong>售后规则</strong>
                <div style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>{product.refund_policy || '暂无售后规则'}</div>
              </section>
            </div>
          </div>

          <form action={formAction} style={{ ...panelStyle, display: 'grid', gap: 14, alignSelf: 'start' }}>
            <input type="hidden" name="shopCode" value={shopCode} />
            <input type="hidden" name="productId" value={product.id} />
            <div>
              <h3 style={{ margin: '0 0 8px' }}>立即下单</h3>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                {isAutoDelivery
                  ? '支付成功后系统将自动发货，订单页可直接查看发货结果。'
                  : '支付成功后进入待处理状态，请等待商家人工发货。'}
              </div>
            </div>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>购买数量</span>
              <input name="quantity" type="number" min={product.min_purchase_qty} max={product.max_purchase_qty} defaultValue={product.min_purchase_qty} style={inputStyle} />
              <small style={{ color: 'var(--muted)' }}>限购范围：{product.min_purchase_qty} ~ {product.max_purchase_qty}</small>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>联系方式{product.need_contact ? '（必填）' : '（选填）'}</span>
              <input name="buyerContact" placeholder="邮箱 / 手机 / QQ" required={product.need_contact} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>备注{product.need_remark ? '（必填）' : '（选填）'}</span>
              <textarea name="remark" rows={4} required={product.need_remark} style={textareaStyle} />
            </label>
            <div style={orderTipsStyle}>
              <div>订单创建后会生成专属查询密钥。</div>
              <div>库存不足时会直接弹窗提示；有库存时进入订单详情页后再点击支付宝支付。</div>
            </div>
            <button type="submit" style={primaryButton}>创建订单</button>
          </form>
        </div>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' };
const panelStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-soft)' };
const infoCardStyle: React.CSSProperties = { padding: 18, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface-soft)' };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryButton: React.CSSProperties = { padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const pillStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--foreground)', fontSize: 13 };
const orderTipsStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 12, borderRadius: 14, background: 'rgba(59,130,246,.08)', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 };
