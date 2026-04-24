import { createMerchantInventoryAction, createSingleMerchantInventoryAction, getMerchantInventoryData, getMerchantInventoryDetail, invalidateMerchantInventoryAction, updateMerchantInventoryAction } from '@/app/merchant/actions';
import { formatBeijingDateTime } from '@/lib/utils';

type MerchantInventoryPageProps = {
  searchParams: Promise<{ productId?: string; status?: string; batchNo?: string; inventoryId?: string; success?: string }>;
};

export default async function MerchantInventoryPage({ searchParams }: MerchantInventoryPageProps) {
  const filters = await searchParams;
  const buildInventoryPath = (overrides: Partial<typeof filters> = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...overrides };
    if (merged.productId) params.set('productId', merged.productId);
    if (merged.status) params.set('status', merged.status);
    if (merged.batchNo) params.set('batchNo', merged.batchNo);
    if (merged.inventoryId) params.set('inventoryId', merged.inventoryId);
    if (merged.success) params.set('success', merged.success);
    const query = params.toString();
    return query ? `/merchant/inventory?${query}` : '/merchant/inventory';
  };

  async function submitInventory(formData: FormData) {
    'use server';
    await createMerchantInventoryAction(formData);
  }

  async function submitSingleInventory(formData: FormData) {
    'use server';
    await createSingleMerchantInventoryAction(formData);
  }

  async function invalidateInventory(formData: FormData) {
    'use server';
    await invalidateMerchantInventoryAction(formData);
  }

  async function updateInventory(formData: FormData) {
    'use server';
    await updateMerchantInventoryAction(formData);
  }

  const result = await getMerchantInventoryData(filters);
  const selectedInventoryId = String(filters.inventoryId || '').trim();
  const inventoryDetail = selectedInventoryId ? await getMerchantInventoryDetail(selectedInventoryId) : null;
  const successMessage = String(filters.success || '').trim();

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>库存管理</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>库存管理</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>支持库存筛选、批量导入、单条新增和作废可用库存，列表已优先展示商品标题。</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>可用库存</div><strong>{result.summary.available}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>已售库存</div><strong>{result.summary.sold}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>锁定库存</div><strong>{result.summary.locked}</strong></div>
        <div style={statStyle}><div style={{ color: 'var(--muted)' }}>失效库存</div><strong>{result.summary.invalid}</strong></div>
      </section>

      {!result.hasShop ? <section style={cardStyle}><div style={warnStyle}>请先创建店铺和商品，再导入库存。</div></section> : null}

      {successMessage ? <section style={successStyle}>{successMessage}</section> : null}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>筛选条件</h2>
        <form method="get" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品</span>
              <select name="productId" defaultValue={result.filters.productId} style={inputStyle}>
                <option value="">全部商品</option>
                {result.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>库存状态</span>
              <select name="status" defaultValue={result.filters.status} style={inputStyle}>
                <option value="">全部状态</option>
                <option value="available">可用</option>
                <option value="sold">已售</option>
                <option value="locked">锁定</option>
                <option value="invalid">失效</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>批次号</span>
              <input name="batchNo" defaultValue={result.filters.batchNo} placeholder="输入批次号" style={inputStyle} />
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
              <button type="submit" style={primaryButtonStyle}>筛选</button>
              <a href="/merchant/inventory" style={secondaryButtonStyle}>重置</a>
            </div>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>单条新增库存</h2>
        <form action={submitSingleInventory} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <input type="hidden" name="returnTo" value="/merchant/inventory" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>选择商品</span>
              <select name="productId" required style={inputStyle}>
                <option value="">请选择商品</option>
                {result.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>库存类型</span>
              <select name="contentType" defaultValue="card_key" style={inputStyle}>
                <option value="card_key">卡密</option>
                <option value="account_password">账号密码</option>
                <option value="link">链接</option>
                <option value="custom_text">文本</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>批次号</span>
              <input name="batchNo" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>库存内容</span>
            <input name="content" required style={inputStyle} placeholder="输入单条库存内容" />
          </label>
          <button type="submit" style={primaryButtonStyle} disabled={!result.hasShop || !result.products.length}>新增库存</button>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>批量导入库存</h2>
        <form action={submitInventory} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <input type="hidden" name="returnTo" value="/merchant/inventory" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>选择商品</span>
              <select name="productId" required style={inputStyle}>
                <option value="">请选择商品</option>
                {result.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>库存类型</span>
              <select name="contentType" defaultValue="card_key" style={inputStyle}>
                <option value="card_key">卡密</option>
                <option value="account_password">账号密码</option>
                <option value="link">链接</option>
                <option value="custom_text">文本</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}><span>批次号</span><input name="batchNo" style={inputStyle} /></label>
          </div>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>库存内容（每行一条）</span>
            <textarea name="contentRaw" rows={10} style={textareaStyle} placeholder={`AAA-BBB-CCC\nDDD-EEE-FFF`} />
          </label>
          <button type="submit" style={primaryButtonStyle} disabled={!result.hasShop || !result.products.length}>导入库存</button>
        </form>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>库存列表</h2>
          {selectedInventoryId ? <a href="/merchant/inventory" style={secondaryButtonStyle}>关闭预览</a> : null}
        </div>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,.12)', textAlign: 'left' }}>
                <th style={thStyle}>商品标题</th>
                <th style={thStyle}>预览</th>
                <th style={thStyle}>类型</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>批次</th>
                <th style={thStyle}>创建时间</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {result.inventoryItems.length ? result.inventoryItems.map((item) => {
                const productRelation = Array.isArray(item.products) ? item.products[0] : item.products;

                return (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                  <td style={tdStyle}>{productRelation?.name || item.product_id}</td>
                  <td style={tdStyle}>{item.content_preview}</td>
                  <td style={tdStyle}>{item.content_type}</td>
                  <td style={tdStyle}><span style={getStatusBadgeStyle(item.status)}>{item.status}</span></td>
                  <td style={tdStyle}>{item.batch_no || '-'}</td>
                  <td style={tdStyle}>{formatBeijingDateTime(item.created_at)}</td>
                  <td style={tdStyle}>
                    {item.status === 'available' ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a href={buildInventoryPath({ inventoryId: item.id, success: undefined })} style={actionLinkStyle}>预览库存</a>
                        <form action={invalidateInventory}>
                          <input type="hidden" name="inventoryId" value={item.id} />
                          <input type="hidden" name="returnTo" value={buildInventoryPath({ inventoryId: undefined, success: undefined })} />
                          <button type="submit" style={actionButtonStyle}>作废</button>
                        </form>
                      </div>
                    ) : (
                      <a href={buildInventoryPath({ inventoryId: item.id, success: undefined })} style={actionLinkStyle}>查看详情</a>
                    )}
                  </td>
                </tr>
              );
              }) : <tr><td colSpan={7} style={emptyStyle}>暂无符合条件的库存数据。</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {inventoryDetail?.ok ? (
        <div style={modalOverlayStyle}>
          <section style={modalCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>库存内容预览</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '8px 0 0' }}>
                  当前商品：{inventoryDetail.product.name}，状态：{inventoryDetail.inventory.status}
                </p>
              </div>
              <a href={buildInventoryPath({ inventoryId: undefined, success: undefined })} style={secondaryButtonStyle}>关闭</a>
            </div>
            <form action={updateInventory} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
              <input type="hidden" name="inventoryId" value={inventoryDetail.inventory.id} />
              <input type="hidden" name="returnTo" value={buildInventoryPath({ inventoryId: undefined, success: undefined })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span>库存类型</span>
                  <select name="contentType" defaultValue={inventoryDetail.inventory.content_type} style={inputStyle} disabled={inventoryDetail.inventory.status !== 'available'}>
                    <option value="card_key">卡密</option>
                    <option value="account_password">账号密码</option>
                    <option value="link">链接</option>
                    <option value="custom_text">文本</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span>批次号</span>
                  <input name="batchNo" defaultValue={inventoryDetail.inventory.batch_no || ''} style={inputStyle} disabled={inventoryDetail.inventory.status !== 'available'} />
                </label>
              </div>
              <label style={{ display: 'grid', gap: 8 }}>
                <span>库存完整内容</span>
                <textarea name="content" rows={8} defaultValue={inventoryDetail.inventory.content_encrypted} style={textareaStyle} disabled={inventoryDetail.inventory.status !== 'available'} />
              </label>
              {inventoryDetail.inventory.status === 'available' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <a href={buildInventoryPath({ inventoryId: undefined, success: undefined })} style={secondaryButtonStyle}>取消</a>
                  <button type="submit" style={primaryButtonStyle}>保存修改</button>
                </div>
              ) : (
                <div style={{ color: 'var(--muted)' }}>当前库存不是可用状态，暂不支持编辑。</div>
              )}
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const colorMap: Record<string, { background: string; color: string }> = {
    available: { background: 'rgba(16,185,129,.12)', color: '#34d399' },
    sold: { background: 'rgba(59,130,246,.12)', color: '#60a5fa' },
    locked: { background: 'rgba(251,191,36,.12)', color: '#fbbf24' },
    invalid: { background: 'rgba(239,68,68,.12)', color: '#f87171' },
  };
  const config = colorMap[status] || { background: 'rgba(148,163,184,.12)', color: '#cbd5e1' };
  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: config.background, color: config.color, fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.58)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 1000 };
const modalCardStyle: React.CSSProperties = { width: 'min(760px, 100%)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', padding: 24, borderRadius: 24, border: '1px solid rgba(148,163,184,.16)', background: 'var(--card)', boxShadow: '0 24px 64px rgba(2,6,23,.4)' };
const statStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(148,163,184,.12)', display: 'grid', gap: 8 };
const warnStyle: React.CSSProperties = { padding: 16, borderRadius: 14, background: 'rgba(251,191,36,.1)', color: '#fcd34d' };
const successStyle: React.CSSProperties = { padding: 16, borderRadius: 14, background: 'rgba(16,185,129,.12)', color: '#86efac', border: '1px solid rgba(16,185,129,.22)' };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#0f172a' };
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(96,165,250,.24)', background: 'rgba(59,130,246,.12)', color: '#0f172a', textDecoration: 'none' };
const actionButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#0f172a', cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '14px 12px', color: 'var(--muted)' };
const tdStyle: React.CSSProperties = { padding: '14px 12px' };
const emptyStyle: React.CSSProperties = { padding: '26px 12px', textAlign: 'center', color: 'var(--muted)' };
