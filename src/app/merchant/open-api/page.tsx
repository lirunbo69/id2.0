import { getMerchantSystemOverview } from '@/app/merchant/actions';

export default async function MerchantOpenApiPage() {
  const result = await getMerchantSystemOverview();

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>开放 API</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>开放 API</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>展示商户开放能力参数、签名方式和回调地址占位，便于后续接入真实 API Key 管理。</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>接口身份信息</h2>
          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <InfoRow label="App ID" value={result.apiInfo.appId} />
            <InfoRow label="Access Key" value={result.apiInfo.accessKey} mono />
            <InfoRow label="Secret 提示" value={result.apiInfo.secretHint} mono />
            <InfoRow label="签名方式" value={result.apiInfo.signMethod} />
            <InfoRow label="回调地址" value={result.apiInfo.callbackUrl} mono />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>开放能力说明</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div style={tipStyle}>订单查询：按订单号查询支付状态与发货结果。</div>
            <div style={tipStyle}>库存回调：预留发货回执与库存同步回调入口。</div>
            <div style={tipStyle}>签名校验：统一采用 HMAC-SHA256 方式进行签名验证。</div>
            <div style={tipStyle}>IP 白名单与日志：当前为占位展示，后续可接真实白名单与调用日志。</div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div style={{ display: 'grid', gap: 6, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,.08)' }}><span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span><strong style={{ wordBreak: 'break-all', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</strong></div>;
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const tipStyle: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.03)', color: 'var(--muted)', lineHeight: 1.8 };
