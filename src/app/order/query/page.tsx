import { queryOrderAction } from '@/app/shop-actions';

export default function OrderQueryPage() {
  async function submitQuery(formData: FormData) {
    'use server';
    await queryOrderAction(formData);
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px', display: 'grid', gap: 24 }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>订单查询</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>请输入订单号和查询密钥，查询匿名订单详情、支付状态、发货结果和处理记录。</p>
        <form action={submitQuery} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>订单号</span>
            <input name="orderNo" required placeholder="例如：QX202604201122334455" style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>查询密钥</span>
            <input name="queryToken" required placeholder="请输入下单后生成的查询密钥" style={inputStyle} />
          </label>
          <button type="submit" style={buttonStyle}>查询订单</button>
        </form>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
        <div style={tipCardStyle}>
          <strong>如何获得订单号</strong>
          <div style={tipTextStyle}>下单成功后系统会自动生成订单号，并在订单详情页展示。</div>
        </div>
        <div style={tipCardStyle}>
          <strong>如何获得查询密钥</strong>
          <div style={tipTextStyle}>查询密钥会在创建订单后生成，请务必保存，匿名订单需依赖该密钥查询。</div>
        </div>
        <div style={tipCardStyle}>
          <strong>查询后可查看</strong>
          <div style={tipTextStyle}>支付状态、发货结果、自动发货失败原因，以及商家手动发货内容。</div>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--foreground)' };
const buttonStyle: React.CSSProperties = { width: 'fit-content', padding: '14px 18px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const tipCardStyle: React.CSSProperties = { padding: 18, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card)' };
const tipTextStyle: React.CSSProperties = { marginTop: 10, color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 };
