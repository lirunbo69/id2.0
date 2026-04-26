import { getMerchantProductDetail, updateMerchantProductAction } from '@/app/merchant/actions';

type MerchantProductEditPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function MerchantProductEditPage({ params }: MerchantProductEditPageProps) {
  const { productId } = await params;

  async function submitProductForm(formData: FormData) {
    'use server';
    await updateMerchantProductAction(formData);
  }

  const result = await getMerchantProductDetail(productId);

  if (!result.ok) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>编辑商品</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  if (!result.product) {
    return <main style={{ display: 'grid', gap: 24 }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>编辑商品</h1><p style={{ color: 'var(--muted)' }}>未找到商品。</p></section></main>;
  }

  const product = result.product;

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>编辑商品</h1>
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.8 }}>修改商品资料、购买规则、展示状态与发货方式。</p>
        </div>
        <a href="/merchant/products" style={secondaryButtonStyle}>返回商品列表</a>
      </section>

      <form action={submitProductForm} encType="multipart/form-data" style={{ display: 'grid', gap: 24 }}>
        <input type="hidden" name="productId" value={product.id} />

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>基础信息</h2>
          <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <label style={{ display: 'grid', gap: 8 }}>
                <span>商品名称</span>
                <input name="name" defaultValue={product.name} required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: 8 }}>
                <span>副标题</span>
                <input name="subtitle" defaultValue={product.subtitle ?? ''} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <label style={{ display: 'grid', gap: 8 }}>
                <span>商品分类</span>
                <select name="categoryId" defaultValue={product.category_id ?? ''} style={inputStyle}>
                  <option value="">未分类</option>
                  {result.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 8 }}>
                <span>封面图片（可上传或粘贴 URL）</span>
                <input name="coverUrl" defaultValue={product.cover_url ?? ''} placeholder="https://...（可选）" style={inputStyle} />
                <input name="coverFile" type="file" accept="image/*" style={inputStyle} />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品简介</span>
              <textarea name="summary" defaultValue={product.summary ?? ''} rows={3} style={textareaStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品详情</span>
              <textarea name="detailHtml" defaultValue={product.detail_html ?? ''} rows={8} style={textareaStyle} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>销售与发货</h2>
          <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
              <label style={{ display: 'grid', gap: 8 }}><span>售价</span><input name="price" type="number" min="0.01" step="0.01" defaultValue={Number(product.price)} required style={inputStyle} /></label>
              <label style={{ display: 'grid', gap: 8 }}><span>最小购买数量</span><input name="minPurchaseQty" type="number" min="1" defaultValue={product.min_purchase_qty} style={inputStyle} /></label>
              <label style={{ display: 'grid', gap: 8 }}><span>最大购买数量</span><input name="maxPurchaseQty" type="number" min="1" defaultValue={product.max_purchase_qty} style={inputStyle} /></label>
              <label style={{ display: 'grid', gap: 8 }}><span>状态</span><select name="status" defaultValue={product.status} style={inputStyle}><option value="active">上架</option><option value="inactive">下架</option></select></label>
            </div>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>发货类型</span>
              <select name="deliveryType" defaultValue={product.delivery_type} style={inputStyle}>
                <option value="card_key">卡密</option>
                <option value="account_password">账号密码</option>
                <option value="link">链接</option>
                <option value="custom_text">自定义文本</option>
                <option value="manual">人工交付</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>使用说明</span>
              <textarea name="usageGuide" defaultValue={product.usage_guide ?? ''} rows={4} style={textareaStyle} />
              <input name="usageGuideImages" type="file" accept="image/*" multiple style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}><span>购买须知</span><textarea name="noticeText" defaultValue={product.notice_text ?? ''} rows={4} style={textareaStyle} /></label>
            <label style={{ display: 'grid', gap: 8 }}><span>售后规则</span><textarea name="refundPolicy" defaultValue={product.refund_policy ?? ''} rows={4} style={textareaStyle} /></label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>展示与购买规则</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
            <label style={checkboxLabelStyle}><input name="isVisible" type="checkbox" defaultChecked={product.is_visible} />商品可见</label>
            <label style={checkboxLabelStyle}><input name="isRecommended" type="checkbox" defaultChecked={product.is_recommended} />推荐商品</label>
            <label style={checkboxLabelStyle}><input name="isHot" type="checkbox" defaultChecked={product.is_hot} />热卖商品</label>
            <label style={checkboxLabelStyle}><input name="needContact" type="checkbox" defaultChecked={product.need_contact} />要求联系方式</label>
            <label style={checkboxLabelStyle}><input name="needRemark" type="checkbox" defaultChecked={product.need_remark} />要求备注</label>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <a href="/merchant/products" style={secondaryButtonStyle}>取消</a>
          <button type="submit" style={primaryButtonStyle}>保存商品</button>
        </div>
      </form>
    </main>
  );
}

const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 20, border: '1px solid rgba(148,163,184,.12)', background: 'var(--card)', boxShadow: '0 10px 30px rgba(2,6,23,.22)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(255,255,255,.03)', color: '#e2e8f0' };
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
