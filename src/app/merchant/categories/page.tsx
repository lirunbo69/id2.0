import { createMerchantCategoryAction, deleteMerchantCategoryAction, getMerchantCategories, toggleMerchantCategoryAction, updateMerchantCategoryAction } from '@/app/merchant/actions';

export default async function MerchantCategoriesPage() {
  async function submitCategory(formData: FormData) {
    'use server';
    await createMerchantCategoryAction(formData);
  }

  async function submitUpdateCategory(formData: FormData) {
    'use server';
    await updateMerchantCategoryAction(formData);
  }

  async function submitToggleCategory(formData: FormData) {
    'use server';
    await toggleMerchantCategoryAction(formData);
  }

  async function submitDeleteCategory(formData: FormData) {
    'use server';
    await deleteMerchantCategoryAction(formData);
  }

  const result = await getMerchantCategories();

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>分类管理</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>分类管理</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>支持创建、编辑、启用/禁用和删除商品分类。</p>
        </div>
      </section>

      {!result.hasShop ? <section style={cardStyle}><div style={warnStyle}>请先创建店铺，再创建商品分类。</div></section> : null}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>新建分类</h2>
        <form action={submitCategory} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}><span>分类名称</span><input name="name" required style={inputStyle} /></label>
            <label style={{ display: 'grid', gap: 8 }}><span>排序</span><input name="sortOrder" type="number" defaultValue="0" style={inputStyle} /></label>
          </div>
          <label style={{ display: 'grid', gap: 8 }}><span>分类描述</span><textarea name="description" rows={3} style={textareaStyle} /></label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input name="isActive" type="checkbox" defaultChecked />启用分类</label>
          <button type="submit" style={buttonStyle} disabled={!result.hasShop}>创建分类</button>
        </form>
      </section>

      <section style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,.12)', textAlign: 'left' }}>
                <th style={thStyle}>名称</th>
                <th style={thStyle}>描述</th>
                <th style={thStyle}>排序</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>创建时间</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {result.categories.length ? result.categories.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(148,163,184,.08)' }}>
                  <td style={tdStyle}>
                    <form action={submitUpdateCategory} style={{ display: 'grid', gap: 10 }}>
                      <input type="hidden" name="categoryId" value={item.id} />
                      <input name="name" defaultValue={item.name} style={inputStyle} />
                      <textarea name="description" rows={2} defaultValue={item.description || ''} style={textareaStyle} />
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input name="sortOrder" type="number" defaultValue={item.sort_order} style={{ ...inputStyle, width: 110 }} />
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input name="isActive" type="checkbox" defaultChecked={item.is_active} />启用
                        </label>
                        <button type="submit" style={smallButtonStyle}>保存</button>
                      </div>
                    </form>
                  </td>
                  <td style={tdStyle}>{item.description || '-'}</td>
                  <td style={tdStyle}>{item.sort_order}</td>
                  <td style={tdStyle}><span style={item.is_active ? activeTagStyle : inactiveTagStyle}>{item.is_active ? '启用' : '禁用'}</span></td>
                  <td style={tdStyle}>{new Date(item.created_at).toLocaleString('zh-CN')}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <form action={submitToggleCategory}>
                        <input type="hidden" name="categoryId" value={item.id} />
                        <input type="hidden" name="nextActive" value={String(!item.is_active)} />
                        <button type="submit" style={smallButtonStyle}>{item.is_active ? '禁用' : '启用'}</button>
                      </form>
                      <form action={submitDeleteCategory}>
                        <input type="hidden" name="categoryId" value={item.id} />
                        <button type="submit" style={dangerButtonStyle}>删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} style={emptyStyle}>还没有分类，先创建一个。</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const warnStyle: React.CSSProperties = { padding: 16, borderRadius: 14, background: 'rgba(251,191,36,.1)', color: '#fcd34d' };
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const buttonStyle: React.CSSProperties = { width: 'fit-content', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const smallButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#e2e8f0', cursor: 'pointer' };
const dangerButtonStyle: React.CSSProperties = { width: 'fit-content', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,.24)', background: 'rgba(239,68,68,.12)', color: '#fca5a5', cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '14px 12px', color: 'var(--muted)' };
const tdStyle: React.CSSProperties = { padding: '14px 12px', verticalAlign: 'top' };
const activeTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#34d399', fontSize: 12, fontWeight: 700 };
const inactiveTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(148,163,184,.12)', color: '#cbd5e1', fontSize: 12, fontWeight: 700 };
const emptyStyle: React.CSSProperties = { padding: '26px 12px', textAlign: 'center', color: 'var(--muted)' };
