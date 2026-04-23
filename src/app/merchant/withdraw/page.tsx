import { createMerchantWithdrawalAction, getMerchantFinanceOverview } from '@/app/merchant/actions';

export default async function MerchantWithdrawPage() {
  async function submitWithdraw(formData: FormData) {
    'use server';
    await createMerchantWithdrawalAction(formData);
  }

  const result = await getMerchantFinanceOverview();

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>提现申请</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>提现申请</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>填写提现账户并提交申请，系统会根据可提现余额进行校验。</p>
        </div>
        <a href="/merchant/finance" style={secondaryButtonStyle}>返回财务中心</a>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>可提现余额</div><strong>¥{result.summary.availableBalance.toFixed(2)}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>累计销售额</div><strong>¥{result.summary.totalSales.toFixed(2)}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>已提现金额</div><strong>¥{result.summary.withdrawnAmount.toFixed(2)}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>处理中金额</div><strong>¥{result.summary.pendingWithdrawAmount.toFixed(2)}</strong></div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>提交提现申请</h2>
          <form action={submitWithdraw} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>提现金额</span>
              <input name="amount" type="number" min="0.01" step="0.01" max={result.summary.availableBalance || undefined} style={inputStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>提现渠道</span>
              <select name="channel" style={inputStyle} defaultValue="bank_card">
                <option value="bank_card">银行卡</option>
                <option value="alipay">支付宝</option>
                <option value="wechat">微信</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>账户姓名</span>
              <input name="accountName" style={inputStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>账户号</span>
              <input name="accountNo" style={inputStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>备注说明</span>
              <textarea name="remark" rows={4} style={textareaStyle} />
            </label>
            <button type="submit" style={primaryButtonStyle} disabled={result.summary.availableBalance <= 0}>提交申请</button>
          </form>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>提现记录</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {result.withdrawRecords.length ? result.withdrawRecords.map((record) => (
              <div key={record.id} style={recordCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>¥{Number(record.amount || 0).toFixed(2)}</strong>
                  <span style={getStatusTagStyle(record.status)}>{record.status}</span>
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 8 }}>{record.channel} · {record.account_name}</div>
                <div style={{ color: '#94a3b8', marginTop: 6 }}>{record.account_no}</div>
                {record.remark ? <div style={{ color: '#8b9bb6', marginTop: 6 }}>{record.remark}</div> : null}
                <div style={{ color: '#8b9bb6', marginTop: 6 }}>{new Date(record.created_at).toLocaleString('zh-CN')}</div>
              </div>
            )) : <div style={emptyStateStyle}>暂无提现申请记录。</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function getStatusTagStyle(status: string): React.CSSProperties {
  if (status === 'paid') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
  if (status === 'rejected') return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#f87171', fontSize: 12, fontWeight: 700 };
  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const statStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(148,163,184,.12)', display: 'grid', gap: 8 };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#e2e8f0' };
const recordCardStyle: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.03)' };
const emptyStateStyle: React.CSSProperties = { padding: 16, borderRadius: 14, color: 'var(--muted)', background: 'rgba(255,255,255,.03)' };
