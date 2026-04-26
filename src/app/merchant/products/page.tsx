import { deleteMerchantProductAction, duplicateMerchantProductAction, getMerchantProducts, moveMerchantProductOrderAction, updateMerchantProductStatusAction } from '@/app/merchant/actions';
import { formatBeijingDateTime } from '@/lib/utils';
import DeleteProductButton from './DeleteProductButton';

type MerchantProductsPageProps = {
  searchParams: Promise<{ keyword?: string; status?: string; categoryId?: string; success?: string }>;
};

export default async function MerchantProductsPage({ searchParams }: MerchantProductsPageProps) {
  const filters = await searchParams;
  const buildProductsPath = (overrides: Partial<typeof filters> = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...overrides };
    if (merged.keyword) params.set('keyword', merged.keyword);
    if (merged.status) params.set('status', merged.status);
    if (merged.categoryId) params.set('categoryId', merged.categoryId);
    if (merged.success) params.set('success', merged.success);
    const query = params.toString();
    return query ? `/merchant/products?${query}` : '/merchant/products';
  };
  const result = await getMerchantProducts(filters);
  const successMessage = String(filters.success || '').trim();

  async function submitStatusAction(formData: FormData) {
    'use server';
    await updateMerchantProductStatusAction(formData);
  }

  async function submitDuplicateAction(formData: FormData) {
    'use server';
    await duplicateMerchantProductAction(formData);
  }

  async function submitMoveAction(formData: FormData) {
    'use server';
    await moveMerchantProductOrderAction(formData);
  }

  async function submitDeleteAction(formData: FormData) {
    'use server';
    await deleteMerchantProductAction(formData);
  }

  if (!result.ok) {
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>商品管理</h1>
          <p style={{ color: '#fca5a5' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 10px', fontSize: 32 }}>商品管理</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>支持商品筛选、调整前台展示顺序、上下架、可见性切换、推荐/热卖标记、复制与删除商品。</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {!result.hasShop ? <a href="/merchant/shop" style={secondaryButtonStyle}>先完善店铺设置</a> : null}
          <a href="/merchant/products/new" style={primaryButtonStyle}>新建商品</a>
        </div>
      </section>

      {!result.hasShop ? (
        <section style={cardStyle}>
          <div style={warnStyle}>你还没有店铺，请先去“店铺设置”完成店铺配置。</div>
        </section>
      ) : null}

      {successMessage ? <section style={successStyle}>{successMessage}</section> : null}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>筛选条件</h2>
        <form method="get" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>关键词</span>
              <input name="keyword" defaultValue={result.filters.keyword} placeholder="商品名称" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品状态</span>
              <select name="status" defaultValue={result.filters.status} style={inputStyle}>
                <option value="">全部状态</option>
                <option value="active">上架中</option>
                <option value="inactive">已下架</option>
                <option value="hidden">隐藏商品</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品分类</span>
              <select name="categoryId" defaultValue={result.filters.categoryId} style={inputStyle}>
                <option value="">全部分类</option>
                {result.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
              <button type="submit" style={primaryButtonStyle}>筛选</button>
              <a href={buildProductsPath({ success: undefined })} style={secondaryButtonStyle}>重置</a>
            </div>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,.12)' }}>
                <th style={thStyle}>商品信息</th>
                <th style={thStyle}>价格</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>库存</th>
                <th style={thStyle}>销量</th>
                <th style={thStyle}>标签</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {result.products.length > 0 ? (
                result.products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{product.name}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>{product.subtitle || '暂无副标题'}</div>
                      <div style={{ color: '#8b9bb6', marginTop: 6 }}>{formatBeijingDateTime(product.created_at)}</div>
                    </td>
                    <td style={tdStyle}>¥{Number(product.price).toFixed(2)}</td>
                    <td style={tdStyle}><span style={getStatusBadgeStyle(product.status, product.is_visible)}>{product.is_visible ? product.status : 'hidden'}</span></td>
                    <td style={tdStyle}>{product.stock_count}</td>
                    <td style={tdStyle}>{product.sold_count}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {product.is_recommended ? <span style={tagStyle}>推荐</span> : null}
                        {product.is_hot ? <span style={hotTagStyle}>热卖</span> : null}
                        {!product.is_visible ? <span style={mutedTagStyle}>隐藏</span> : null}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                          <form action={submitMoveAction} style={actionRowStyle}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                            <input type="hidden" name="direction" value="up" />
                            <button type="submit" style={actionButtonStyle}>上移</button>
                          </form>
                          <form action={submitMoveAction} style={actionRowStyle}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                            <input type="hidden" name="direction" value="down" />
                            <button type="submit" style={actionButtonStyle}>下移</button>
                          </form>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                          <form action={submitMoveAction} style={actionRowStyle}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                            <input type="hidden" name="direction" value="top" />
                            <button type="submit" style={actionButtonStyle}>置顶</button>
                          </form>
                          <form action={submitMoveAction} style={actionRowStyle}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                            <input type="hidden" name="direction" value="bottom" />
                            <button type="submit" style={actionButtonStyle}>置底</button>
                          </form>
                        </div>
                        <form action={submitStatusAction} style={actionRowStyle}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                          <input type="hidden" name="action" value={product.status === 'active' ? 'deactivate' : 'activate'} />
                          <button type="submit" style={actionButtonStyle}>{product.status === 'active' ? '下架' : '上架'}</button>
                        </form>
                        <form action={submitStatusAction} style={actionRowStyle}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                          <input type="hidden" name="action" value="toggle_visible" />
                          <button type="submit" style={actionButtonStyle}>{product.is_visible ? '隐藏' : '显示'}</button>
                        </form>
                        <form action={submitStatusAction} style={actionRowStyle}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                          <input type="hidden" name="action" value="toggle_recommended" />
                          <button type="submit" style={actionButtonStyle}>{product.is_recommended ? '取消推荐' : '设为推荐'}</button>
                        </form>
                        <form action={submitStatusAction} style={actionRowStyle}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                          <input type="hidden" name="action" value="toggle_hot" />
                          <button type="submit" style={actionButtonStyle}>{product.is_hot ? '取消热卖' : '设为热卖'}</button>
                        </form>
                        <a href={`/merchant/products/${product.id}/edit`} style={actionButtonStyle}>编辑商品</a>
                        <form action={submitDuplicateAction} style={actionRowStyle}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="returnTo" value={buildProductsPath({ success: undefined })} />
                          <button type="submit" style={actionButtonStyle}>复制商品</button>
                        </form>
                        <DeleteProductButton
                          productId={product.id}
                          returnTo={buildProductsPath({ success: undefined })}
                          action={submitDeleteAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={emptyStyle} colSpan={7}>还没有符合条件的商品，点击右上角“新建商品”开始发布。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function getStatusBadgeStyle(status: string, isVisible: boolean): React.CSSProperties {
  if (!isVisible) {
    return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(148,163,184,.12)', color: '#cbd5e1', fontSize: 12, fontWeight: 700 };
  }

  if (status === 'active') {
    return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
  }

  return { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontSize: 12, fontWeight: 700 };
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 20,
  border: '1px solid rgba(148,163,184,.12)',
  background: 'var(--card)',
  boxShadow: '0 10px 30px rgba(2,6,23,.22)',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
};

const thStyle: React.CSSProperties = { padding: '14px 12px', color: 'var(--muted)', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '14px 12px', verticalAlign: 'top' };
const emptyStyle: React.CSSProperties = { padding: '28px 12px', textAlign: 'center', color: 'var(--muted)' };
const warnStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: 'rgba(251,191,36,.1)', color: '#fcd34d' };
const successStyle: React.CSSProperties = { padding: 16, borderRadius: 14, background: 'rgba(16,185,129,.12)', color: '#86efac', border: '1px solid rgba(16,185,129,.22)' };
const actionRowStyle: React.CSSProperties = { margin: 0 };
const actionButtonStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#0f172a', cursor: 'pointer' };
const tagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(79,70,229,.18)', color: '#c7d2fe', fontSize: 12, fontWeight: 700 };
const hotTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,.16)', color: '#fca5a5', fontSize: 12, fontWeight: 700 };
const mutedTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(148,163,184,.12)', color: '#cbd5e1', fontSize: 12, fontWeight: 700 };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#0f172a' };
