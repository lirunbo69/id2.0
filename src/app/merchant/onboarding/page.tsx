import { getMerchantSystemOverview } from '@/app/merchant/actions';
import { formatBeijingDateTime } from '@/lib/utils';

export default async function MerchantOnboardingPage() {
  const result = await getMerchantSystemOverview();

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>商户入驻</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>商户入驻资料</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>展示当前商户基础资料、审核状态和资料补齐进度，作为入驻档案页。</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>基础资料</h2>
          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <InfoRow label="商户类型" value={result.onboardingInfo.merchantType} />
            <InfoRow label="联系人" value={result.onboardingInfo.contactName} />
            <InfoRow label="联系邮箱" value={result.onboardingInfo.contactEmail} />
            <InfoRow label="审核状态" value={result.onboardingInfo.reviewStatus} />
            <InfoRow label="店铺名称" value={result.onboardingInfo.shopName} />
            <InfoRow label="店铺创建时间" value={result.onboardingInfo.shopCreatedAt ? formatBeijingDateTime(result.onboardingInfo.shopCreatedAt) : '-'} />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>资料清单</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {result.onboardingInfo.materialChecklist.map((item) => (
              <div key={item.label} style={checkRowStyle}>
                <span>{item.label}</span>
                <span style={item.done ? doneTagStyle : pendingTagStyle}>{item.done ? '已完成' : '待补充'}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'grid', gap: 6, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,.08)' }}><span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span><strong style={{ wordBreak: 'break-all' }}>{value}</strong></div>;
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const checkRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)' };
const doneTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
const pendingTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontSize: 12, fontWeight: 700 };
