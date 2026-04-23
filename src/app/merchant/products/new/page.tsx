import { createMerchantProductAction, getMerchantProductOptions, getMerchantShopDetail } from '@/app/merchant/actions';

export default async function MerchantProductCreatePage() {
  async function submitProductForm(formData: FormData) {
    'use server';

    await createMerchantProductAction(formData);
  }

  const shopResult = await getMerchantShopDetail();
  const optionsResult = await getMerchantProductOptions();

  if (!shopResult.ok) {
    return (
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
          <h1 style={{ marginTop: 0 }}>新建商品</h1>
          <p style={{ color: '#fca5a5' }}>{shopResult.message}</p>
        </section>
      </main>
    );
  }

  if (!shopResult.shop) {
    return (
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
          <h1 style={{ marginTop: 0 }}>新建商品</h1>
          <p style={{ color: '#fbbf24', lineHeight: 1.8 }}>请先前往“店铺设置”创建店铺，然后再发布商品。</p>
          <a href="/merchant/shop" style={buttonStyle}>前往创建店铺</a>
        </section>
      </main>
    );
  }

  const categories = optionsResult.ok ? optionsResult.categories : [];

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <section style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h1 style={{ marginTop: 0 }}>新建商品</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          当前表单会直接写入 `products` 表，现已支持选择真实商品分类。
        </p>

        <form action={submitProductForm} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品名称</span>
              <input name="name" required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>副标题</span>
              <input name="subtitle" style={inputStyle} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品分类</span>
              <select name="categoryId" defaultValue="" style={inputStyle}>
                <option value="">未分类</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>封面图片 URL</span>
              <input name="coverUrl" style={inputStyle} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>商品简介</span>
            <textarea name="summary" rows={3} style={textareaStyle} />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>商品详情（HTML 或纯文本）</span>
            <textarea name="detailHtml" rows={6} style={textareaStyle} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>售价</span>
              <input name="price" type="number" min="0.01" step="0.01" required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>最小购买数量</span>
              <input name="minPurchaseQty" type="number" min="1" defaultValue="1" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>最大购买数量</span>
              <input name="maxPurchaseQty" type="number" min="1" defaultValue="1" style={inputStyle} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>发货类型</span>
            <select name="deliveryType" defaultValue="card_key" style={inputStyle}>
              <option value="card_key">卡密</option>
              <option value="account_password">账号密码</option>
              <option value="link">链接</option>
              <option value="custom_text">自定义文本</option>
              <option value="manual">人工交付</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 8 }}><span>使用说明</span><textarea name="usageGuide" rows={4} style={textareaStyle} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>购买须知</span><textarea name="noticeText" rows={4} style={textareaStyle} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>售后规则</span><textarea name="refundPolicy" rows={4} style={textareaStyle} /></label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <label style={checkboxLabelStyle}><input name="isVisible" type="checkbox" defaultChecked />商品可见</label>
            <label style={checkboxLabelStyle}><input name="isRecommended" type="checkbox" />推荐商品</label>
            <label style={checkboxLabelStyle}><input name="isHot" type="checkbox" />热卖商品</label>
            <label style={checkboxLabelStyle}><input name="needContact" type="checkbox" />要求联系方式</label>
          </div>

          <label style={checkboxLabelStyle}><input name="needRemark" type="checkbox" />下单时要求买家备注</label>
          <button type="submit" style={buttonStyle}>发布商品</button>
        </form>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)', color: 'var(--foreground)' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };
const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '14px 18px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
