import { getMerchantSystemOverview } from '@/app/merchant/actions';

export default async function MerchantSecurityPage() {
  const result = await getMerchantSystemOverview();

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>安全设置</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>安全设置</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>集中展示账号安全、审核状态和风险提醒，为后续接 2FA、设备管理与登录日志预留结构。</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>账号与店铺安全</h2>
          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <InfoRow label="登录邮箱" value={result.securityInfo.loginEmail} />
            <InfoRow label="审核状态" value={result.securityInfo.reviewStatus} />
            <InfoRow label="店铺状态" value={result.securityInfo.shopStatus} />
            <InfoRow label="密码策略提示" value={result.securityInfo.passwordUpdatedTip} />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>风险控制建议</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div style={tipStyle}>{result.securityInfo.riskTip}</div>
            <div style={tipStyle}>不要将商户后台账号共享给多人共用，建议后续接入子账号和角色权限。</div>
            <div style={tipStyle}>开放 API 开启后，建议定期轮换 Access Key，并按业务 IP 做来源限制。</div>
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
const tipStyle: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.03)', color: 'var(--muted)', lineHeight: 1.8 };
