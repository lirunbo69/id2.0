'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase';
import { appendOrderRemark, closeOrderAndRelease, processOrderPayment } from '@/lib/order-flow';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function randomShopCode() {
  return `SHOP${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function buildInventoryPreview(content: string) {
  if (content.length <= 8) return content;
  return `${content.slice(0, 3)}****${content.slice(-3)}`;
}

function withSuccessMessage(path: string, message: string) {
  const [pathname, queryString = ''] = path.split('?');
  const params = new URLSearchParams(queryString);
  params.set('success', message);
  return `${pathname}?${params.toString()}`;
}

async function findAuthUserIdByEmail(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();

  if (error) {
    throw new Error(error.message);
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

async function confirmAuthEmailIfNeeded(email: string) {
  const admin = createAdminClient();
  const userId = await findAuthUserIdByEmail(email);

  if (!userId) {
    return null;
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return userId;
}

async function getCurrentMerchantContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      message: '请先登录商户账号。',
    };
  }

  const { data: merchantProfile, error: merchantError } = await supabase
    .from('merchant_profiles')
    .select('id, user_id, contact_name, review_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (merchantError || !merchantProfile) {
    return {
      ok: false as const,
      message: '未找到商户资料，请先完成商户入驻。',
    };
  }

  return {
    ok: true as const,
    user,
    merchantProfile,
    supabase,
  };
}

async function getMerchantShopBase() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop, error } = await context.supabase
    .from('shops')
    .select('id, name, shop_code')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      message: error.message,
    };
  }

  return {
    ok: true as const,
    context,
    shop,
  };
}

type MerchantAuthActionState = {
  ok: boolean;
  message: string;
};

function successAuthState(message = ''): MerchantAuthActionState {
  return { ok: true, message };
}

function errorAuthState(message: string): MerchantAuthActionState {
  return { ok: false, message };
}

export async function registerMerchantAuthAction(_prevState: MerchantAuthActionState, formData: FormData): Promise<MerchantAuthActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '').trim();
  const contactName = String(formData.get('contactName') || '').trim();
  const contactPhone = String(formData.get('contactPhone') || '').trim();

  if (!email || !password || !contactName || !contactPhone) {
    return errorAuthState('请完整填写商户注册信息。');
  }

  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nickname: contactName,
      },
    });

    if (error || !data.user) {
      return errorAuthState(error?.message || '商户注册失败。');
    }

    await admin.from('profiles').upsert({
      id: data.user.id,
      role: 'merchant',
      email,
      phone: contactPhone,
      nickname: contactName,
      status: 'active',
    });

    await admin.from('merchant_profiles').upsert({
      user_id: data.user.id,
      merchant_type: 'individual',
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: email,
      review_status: 'approved',
    });

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      return errorAuthState(loginError.message || '注册成功，但自动登录失败。');
    }
  } catch (error) {
    return errorAuthState(error instanceof Error ? error.message : '商户注册失败。');
  }

  redirect('/merchant/dashboard');
}

export async function loginMerchantAuthAction(_prevState: MerchantAuthActionState, formData: FormData): Promise<MerchantAuthActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    return errorAuthState('请输入邮箱和密码。');
  }

  try {
    const supabase = await createServerSupabaseClient();
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error?.message?.toLowerCase().includes('email not confirmed')) {
      await confirmAuthEmailIfNeeded(email);
      const retry = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = retry.error;
    }

    if (error) {
      return errorAuthState(error.message || '登录失败。');
    }
  } catch (error) {
    return errorAuthState(error instanceof Error ? error.message : '登录失败。');
  }

  redirect('/merchant/dashboard');
}

export async function logoutMerchantAuthAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/merchant/login');
}

export async function upsertMerchantShopAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const name = String(formData.get('name') || '').trim();
  const intro = String(formData.get('intro') || '').trim();
  const announcement = String(formData.get('announcement') || '').trim();
  const logoUrl = String(formData.get('logoUrl') || '').trim();
  const bannerUrl = String(formData.get('bannerUrl') || '').trim();
  const contactQq = String(formData.get('contactQq') || '').trim();
  const contactWechat = String(formData.get('contactWechat') || '').trim();
  const contactTelegram = String(formData.get('contactTelegram') || '').trim();
  const customerServiceUrl = String(formData.get('customerServiceUrl') || '').trim();
  const seoTitle = String(formData.get('seoTitle') || '').trim();
  const seoDescription = String(formData.get('seoDescription') || '').trim();
  const isOpen = formData.get('isOpen') === 'on';

  if (!name) {
    return { ok: false as const, message: '店铺名称不能为空。' };
  }

  const { data: existingShop } = await context.supabase
    .from('shops')
    .select('id, shop_code')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  const payload = {
    merchant_id: context.merchantProfile.id,
    name,
    intro: intro || null,
    announcement: announcement || null,
    logo_url: logoUrl || null,
    banner_url: bannerUrl || null,
    contact_qq: contactQq || null,
    contact_wechat: contactWechat || null,
    contact_telegram: contactTelegram || null,
    customer_service_url: customerServiceUrl || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    slug: slugify(name) || null,
    is_open: isOpen,
    status: 'active' as const,
  };

  const query = existingShop
    ? context.supabase.from('shops').update(payload).eq('id', existingShop.id)
    : context.supabase.from('shops').insert({
        ...payload,
        shop_code: randomShopCode(),
      });

  const { error } = await query;

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/shop');
  revalidatePath('/merchant/products');
  revalidatePath('/merchant/categories');
  revalidatePath('/merchant/inventory');

  return {
    ok: true as const,
    message: existingShop ? '店铺信息已更新。' : '店铺创建成功。',
  };
}

export async function createMerchantCategoryAction(formData: FormData) {
  const base = await getMerchantShopBase();
  if (!base.ok) {
    return base;
  }

  if (!base.shop) {
    return { ok: false as const, message: '请先创建店铺。' };
  }

  const returnTo = String(formData.get('returnTo') || '/merchant/categories').trim() || '/merchant/categories';
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const sortOrder = Number(formData.get('sortOrder') || 0);
  const isActive = formData.get('isActive') === 'on';

  if (!name) {
    return { ok: false as const, message: '分类名称不能为空。' };
  }

  const { error } = await base.context.supabase.from('shop_categories').insert({
    shop_id: base.shop.id,
    name,
    description: description || null,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/categories');
  revalidatePath('/merchant/products/new');

  redirect(withSuccessMessage(returnTo, '创建分类成功'));
}

export async function updateMerchantCategoryAction(formData: FormData) {
  const base = await getMerchantShopBase();
  if (!base.ok) {
    return base;
  }

  if (!base.shop) {
    return { ok: false as const, message: '请先创建店铺。' };
  }

  const categoryId = String(formData.get('categoryId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const sortOrder = Number(formData.get('sortOrder') || 0);
  const isActive = formData.get('isActive') === 'on';

  if (!categoryId || !name) {
    return { ok: false as const, message: '分类参数不完整。' };
  }

  const { error } = await base.context.supabase
    .from('shop_categories')
    .update({
      name,
      description: description || null,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })
    .eq('id', categoryId)
    .eq('shop_id', base.shop.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/categories');
  revalidatePath('/merchant/products/new');
  return { ok: true as const, message: '分类已更新。' };
}

export async function toggleMerchantCategoryAction(formData: FormData) {
  const base = await getMerchantShopBase();
  if (!base.ok) {
    return base;
  }

  if (!base.shop) {
    return { ok: false as const, message: '请先创建店铺。' };
  }

  const categoryId = String(formData.get('categoryId') || '').trim();
  const nextActive = String(formData.get('nextActive') || '') === 'true';

  if (!categoryId) {
    return { ok: false as const, message: '缺少分类 ID。' };
  }

  const { error } = await base.context.supabase
    .from('shop_categories')
    .update({ is_active: nextActive })
    .eq('id', categoryId)
    .eq('shop_id', base.shop.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/categories');
  return { ok: true as const, message: '分类状态已更新。' };
}

export async function deleteMerchantCategoryAction(formData: FormData) {
  const base = await getMerchantShopBase();
  if (!base.ok) {
    return base;
  }

  if (!base.shop) {
    return { ok: false as const, message: '请先创建店铺。' };
  }

  const categoryId = String(formData.get('categoryId') || '').trim();
  if (!categoryId) {
    return { ok: false as const, message: '缺少分类 ID。' };
  }

  const { error } = await base.context.supabase
    .from('shop_categories')
    .delete()
    .eq('id', categoryId)
    .eq('shop_id', base.shop.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/categories');
  revalidatePath('/merchant/products/new');
  return { ok: true as const, message: '分类已删除。' };
}

export async function createMerchantProductAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const returnTo = String(formData.get('returnTo') || '/merchant/products/new').trim() || '/merchant/products/new';

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id, name')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: false as const,
      message: '请先创建店铺后再发布商品。',
    };
  }

  const categoryIdRaw = String(formData.get('categoryId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const subtitle = String(formData.get('subtitle') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const detailHtml = String(formData.get('detailHtml') || '').trim();
  const usageGuide = String(formData.get('usageGuide') || '').trim();
  const noticeText = String(formData.get('noticeText') || '').trim();
  const refundPolicy = String(formData.get('refundPolicy') || '').trim();
  const deliveryType = String(formData.get('deliveryType') || 'card_key').trim();
  const coverUrl = String(formData.get('coverUrl') || '').trim();
  const priceValue = Number(formData.get('price') || 0);
  const minPurchaseQty = Number(formData.get('minPurchaseQty') || 1);
  const maxPurchaseQty = Number(formData.get('maxPurchaseQty') || 1);
  const isVisible = formData.get('isVisible') === 'on';
  const isRecommended = formData.get('isRecommended') === 'on';
  const isHot = formData.get('isHot') === 'on';
  const needContact = formData.get('needContact') === 'on';
  const needRemark = formData.get('needRemark') === 'on';

  if (!name) {
    return { ok: false as const, message: '商品名称不能为空。' };
  }

  if (!priceValue || Number.isNaN(priceValue) || priceValue <= 0) {
    return { ok: false as const, message: '商品价格必须大于 0。' };
  }

  if (minPurchaseQty <= 0 || maxPurchaseQty <= 0 || minPurchaseQty > maxPurchaseQty) {
    return { ok: false as const, message: '购买数量范围不合法。' };
  }

  const { error } = await context.supabase.from('products').insert({
    shop_id: shop.id,
    category_id: categoryIdRaw || null,
    name,
    subtitle: subtitle || null,
    summary: summary || null,
    detail_html: detailHtml || null,
    usage_guide: usageGuide || null,
    notice_text: noticeText || null,
    refund_policy: refundPolicy || null,
    delivery_type: deliveryType,
    cover_url: coverUrl || null,
    price: priceValue,
    min_purchase_qty: minPurchaseQty,
    max_purchase_qty: maxPurchaseQty,
    is_visible: isVisible,
    is_recommended: isRecommended,
    is_hot: isHot,
    need_contact: needContact,
    need_remark: needRemark,
    status: 'active',
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/products');
  revalidatePath('/merchant/products/new');
  revalidatePath('/merchant/inventory');

  redirect(withSuccessMessage(returnTo, '发布商品成功'));
}

export async function createMerchantInventoryAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const returnTo = String(formData.get('returnTo') || '/merchant/inventory').trim() || '/merchant/inventory';
  const productId = String(formData.get('productId') || '').trim();
  const contentRaw = String(formData.get('contentRaw') || '').trim();
  const contentType = String(formData.get('contentType') || 'card_key').trim();
  const batchNo = String(formData.get('batchNo') || '').trim();

  if (!productId) {
    return { ok: false as const, message: '请选择商品。' };
  }

  if (!contentRaw) {
    return { ok: false as const, message: '请输入库存内容。' };
  }

  const { data: product, error: productError } = await context.supabase
    .from('products')
    .select('id, shop_id, stock_count')
    .eq('id', productId)
    .maybeSingle();

  if (productError || !product) {
    return { ok: false as const, message: '商品不存在。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop || shop.id !== product.shop_id) {
    return { ok: false as const, message: '你没有权限操作该商品库存。' };
  }

  const lines = Array.from(new Set(contentRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)));

  if (!lines.length) {
    return { ok: false as const, message: '没有可导入的库存内容。' };
  }

  const { error } = await context.supabase.from('inventories').insert(
    lines.map((line) => ({
      product_id: productId,
      content_encrypted: line,
      content_preview: buildInventoryPreview(line),
      content_type: contentType,
      status: 'available',
      batch_no: batchNo || null,
    })),
  );

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await context.supabase
    .from('products')
    .update({ stock_count: Number(product.stock_count || 0) + lines.length })
    .eq('id', productId);

  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');

  redirect(withSuccessMessage(returnTo, lines.length === 1 ? '新增库存成功' : '导入库存成功'));
}

export async function getMerchantShopDetail() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data, error } = await context.supabase
    .from('shops')
    .select('*')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    shop: data,
    merchantProfile: context.merchantProfile,
  };
}

export async function getMerchantCategories() {
  const base = await getMerchantShopBase();
  if (!base.ok) {
    return base;
  }

  if (!base.shop) {
    return {
      ok: true as const,
      categories: [],
      hasShop: false,
    };
  }

  const { data, error } = await base.context.supabase
    .from('shop_categories')
    .select('id, name, description, sort_order, is_active, created_at')
    .eq('shop_id', base.shop.id)
    .order('sort_order', { ascending: true });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    categories: data || [],
    hasShop: true,
  };
}

export async function getMerchantProducts(searchParams?: {
  keyword?: string;
  status?: string;
  categoryId?: string;
}) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      products: [],
      categories: [],
      hasShop: false,
      filters: {
        keyword: searchParams?.keyword || '',
        status: searchParams?.status || '',
        categoryId: searchParams?.categoryId || '',
      },
    };
  }

  const keyword = searchParams?.keyword?.trim() || '';
  const status = searchParams?.status?.trim() || '';
  const categoryId = searchParams?.categoryId?.trim() || '';

  let query = context.supabase
    .from('products')
    .select('id, name, subtitle, price, status, stock_count, sold_count, created_at, category_id, is_visible, is_recommended, is_hot')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
  }

  if (status) {
    if (status === 'hidden') {
      query = query.eq('is_visible', false);
    } else {
      query = query.eq('status', status);
    }
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const [{ data, error }, { data: categories, error: categoryError }] = await Promise.all([
    query,
    context.supabase.from('shop_categories').select('id, name').eq('shop_id', shop.id).order('sort_order', { ascending: true }),
  ]);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (categoryError) {
    return { ok: false as const, message: categoryError.message };
  }

  return {
    ok: true as const,
    products: data || [],
    categories: categories || [],
    hasShop: true,
    filters: {
      keyword,
      status,
      categoryId,
    },
  };
}

export async function updateMerchantProductStatusAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const productId = String(formData.get('productId') || '').trim();
  const action = String(formData.get('action') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/products').trim() || '/merchant/products';

  if (!productId || !action) {
    return { ok: false as const, message: '缺少商品操作参数。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: product, error: productError } = await context.supabase
    .from('products')
    .select('id, shop_id, is_visible, is_recommended, is_hot')
    .eq('id', productId)
    .maybeSingle();

  if (productError || !product || product.shop_id !== shop.id) {
    return { ok: false as const, message: '商品不存在或无权限操作。' };
  }

  const payload: Record<string, unknown> = {};
  let successMessage = '商品状态已更新';

  if (action === 'activate') {
    payload.status = 'active';
    successMessage = '商品已上架';
  }
  if (action === 'deactivate') {
    payload.status = 'inactive';
    successMessage = '商品已下架';
  }
  if (action === 'toggle_visible') {
    payload.is_visible = !product.is_visible;
    successMessage = product.is_visible ? '商品已隐藏' : '商品已显示';
  }
  if (action === 'toggle_recommended') {
    payload.is_recommended = !product.is_recommended;
    successMessage = product.is_recommended ? '已取消推荐' : '已设为推荐';
  }
  if (action === 'toggle_hot') {
    payload.is_hot = !product.is_hot;
    successMessage = product.is_hot ? '已取消热卖' : '已设为热卖';
  }

  const { error } = await context.supabase.from('products').update(payload).eq('id', productId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, successMessage));
}

export async function duplicateMerchantProductAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const productId = String(formData.get('productId') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/products').trim() || '/merchant/products';
  if (!productId) {
    return { ok: false as const, message: '缺少商品 ID。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: product, error: productError } = await context.supabase
    .from('products')
    .select('shop_id, category_id, name, subtitle, summary, detail_html, usage_guide, notice_text, refund_policy, delivery_type, cover_url, price, min_purchase_qty, max_purchase_qty, is_visible, is_recommended, is_hot, need_contact, need_remark, status')
    .eq('id', productId)
    .maybeSingle();

  if (productError || !product || product.shop_id !== shop.id) {
    return { ok: false as const, message: '商品不存在或无权限复制。' };
  }

  const { error } = await context.supabase.from('products').insert({
    ...product,
    name: `${product.name} - 副本`,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, '商品复制成功'));
}

export async function getMerchantProductOptions() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      products: [],
      categories: [],
      hasShop: false,
    };
  }

  const [{ data: products, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
    context.supabase.from('products').select('id, name').eq('shop_id', shop.id).order('created_at', { ascending: false }),
    context.supabase.from('shop_categories').select('id, name').eq('shop_id', shop.id).order('sort_order', { ascending: true }),
  ]);

  if (productError) {
    return { ok: false as const, message: productError.message };
  }

  if (categoryError) {
    return { ok: false as const, message: categoryError.message };
  }

  return {
    ok: true as const,
    products: products || [],
    categories: categories || [],
    hasShop: true,
  };
}

export async function getMerchantProductDetail(productId: string) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: true as const, hasShop: false, product: null, categories: [] };
  }

  const [{ data: product, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
    context.supabase
      .from('products')
      .select('id, shop_id, category_id, name, subtitle, summary, detail_html, usage_guide, notice_text, refund_policy, delivery_type, cover_url, price, min_purchase_qty, max_purchase_qty, is_visible, is_recommended, is_hot, need_contact, need_remark, status')
      .eq('id', productId)
      .maybeSingle(),
    context.supabase.from('shop_categories').select('id, name').eq('shop_id', shop.id).order('sort_order', { ascending: true }),
  ]);

  if (productError) {
    return { ok: false as const, message: productError.message };
  }

  if (categoryError) {
    return { ok: false as const, message: categoryError.message };
  }

  if (!product || product.shop_id !== shop.id) {
    return { ok: false as const, message: '商品不存在或无权限查看。' };
  }

  return {
    ok: true as const,
    hasShop: true,
    product,
    categories: categories || [],
  };
}

export async function updateMerchantProductAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const productId = String(formData.get('productId') || '').trim();
  const categoryIdRaw = String(formData.get('categoryId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const subtitle = String(formData.get('subtitle') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const detailHtml = String(formData.get('detailHtml') || '').trim();
  const usageGuide = String(formData.get('usageGuide') || '').trim();
  const noticeText = String(formData.get('noticeText') || '').trim();
  const refundPolicy = String(formData.get('refundPolicy') || '').trim();
  const deliveryType = String(formData.get('deliveryType') || 'card_key').trim();
  const coverUrl = String(formData.get('coverUrl') || '').trim();
  const priceValue = Number(formData.get('price') || 0);
  const minPurchaseQty = Number(formData.get('minPurchaseQty') || 1);
  const maxPurchaseQty = Number(formData.get('maxPurchaseQty') || 1);
  const isVisible = formData.get('isVisible') === 'on';
  const isRecommended = formData.get('isRecommended') === 'on';
  const isHot = formData.get('isHot') === 'on';
  const needContact = formData.get('needContact') === 'on';
  const needRemark = formData.get('needRemark') === 'on';
  const status = String(formData.get('status') || 'active').trim();

  if (!productId || !name) {
    return { ok: false as const, message: '商品参数不完整。' };
  }

  if (!priceValue || Number.isNaN(priceValue) || priceValue <= 0) {
    return { ok: false as const, message: '商品价格必须大于 0。' };
  }

  if (minPurchaseQty <= 0 || maxPurchaseQty <= 0 || minPurchaseQty > maxPurchaseQty) {
    return { ok: false as const, message: '购买数量范围不合法。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: product, error: productError } = await context.supabase
    .from('products')
    .select('id, shop_id')
    .eq('id', productId)
    .maybeSingle();

  if (productError || !product || product.shop_id !== shop.id) {
    return { ok: false as const, message: '商品不存在或无权限编辑。' };
  }

  const { error } = await context.supabase
    .from('products')
    .update({
      category_id: categoryIdRaw || null,
      name,
      subtitle: subtitle || null,
      summary: summary || null,
      detail_html: detailHtml || null,
      usage_guide: usageGuide || null,
      notice_text: noticeText || null,
      refund_policy: refundPolicy || null,
      delivery_type: deliveryType,
      cover_url: coverUrl || null,
      price: priceValue,
      min_purchase_qty: minPurchaseQty,
      max_purchase_qty: maxPurchaseQty,
      is_visible: isVisible,
      is_recommended: isRecommended,
      is_hot: isHot,
      need_contact: needContact,
      need_remark: needRemark,
      status,
    })
    .eq('id', productId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/products');
  revalidatePath(`/merchant/products/${productId}/edit`);
  revalidatePath(`/links/${shop.id}`);
  return { ok: true as const, message: '商品已更新。' };
}

export async function createSingleMerchantInventoryAction(formData: FormData) {
  const productId = String(formData.get('productId') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const contentType = String(formData.get('contentType') || 'card_key').trim();
  const batchNo = String(formData.get('batchNo') || '').trim();

  const payload = new FormData();
  payload.set('productId', productId);
  payload.set('contentRaw', content);
  payload.set('contentType', contentType);
  payload.set('batchNo', batchNo);
  return await createMerchantInventoryAction(payload);
}

export async function invalidateMerchantInventoryAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const returnTo = String(formData.get('returnTo') || '/merchant/inventory').trim() || '/merchant/inventory';
  const inventoryId = String(formData.get('inventoryId') || '').trim();
  if (!inventoryId) {
    return { ok: false as const, message: '缺少库存 ID。' };
  }

  const { data: inventory, error: inventoryError } = await context.supabase
    .from('inventories')
    .select('id, product_id, status')
    .eq('id', inventoryId)
    .maybeSingle();

  if (inventoryError || !inventory) {
    return { ok: false as const, message: '库存不存在。' };
  }

  const { data: product, error: productError } = await context.supabase
    .from('products')
    .select('id, shop_id, stock_count')
    .eq('id', inventory.product_id)
    .maybeSingle();

  if (productError || !product) {
    return { ok: false as const, message: '商品不存在。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop || shop.id !== product.shop_id) {
    return { ok: false as const, message: '你没有权限操作该库存。' };
  }

  if (inventory.status !== 'available') {
    return { ok: false as const, message: '只有可用库存才能作废。' };
  }

  const { error } = await context.supabase.from('inventories').update({ status: 'invalid' }).eq('id', inventory.id);
  if (error) {
    return { ok: false as const, message: error.message };
  }

  await context.supabase
    .from('products')
    .update({ stock_count: Math.max(0, Number(product.stock_count || 0) - 1) })
    .eq('id', product.id);

  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, '库存已作废'));
}

export async function getMerchantInventoryDetail(inventoryId: string) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: inventory, error } = await context.supabase
    .from('inventories')
    .select('id, product_id, content_encrypted, content_preview, content_type, status, batch_no, created_at')
    .eq('id', inventoryId)
    .maybeSingle();

  if (error || !inventory) {
    return { ok: false as const, message: error?.message || '库存不存在。' };
  }

  const { data: product } = await context.supabase
    .from('products')
    .select('id, name, shop_id, stock_count')
    .eq('id', inventory.product_id)
    .maybeSingle();

  if (!product || product.shop_id !== shop.id) {
    return { ok: false as const, message: '你没有权限查看该库存。' };
  }

  return {
    ok: true as const,
    inventory,
    product,
  };
}

export async function updateMerchantInventoryAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const inventoryId = String(formData.get('inventoryId') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const contentType = String(formData.get('contentType') || 'card_key').trim();
  const batchNo = String(formData.get('batchNo') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/inventory').trim() || '/merchant/inventory';

  if (!inventoryId || !content) {
    return { ok: false as const, message: '库存参数不完整。' };
  }

  const detail = await getMerchantInventoryDetail(inventoryId);
  if (!detail.ok) {
    return detail;
  }

  if (detail.inventory.status !== 'available') {
    return { ok: false as const, message: '只有可用库存才能编辑。' };
  }

  const { error } = await context.supabase
    .from('inventories')
    .update({
      content_encrypted: content,
      content_preview: buildInventoryPreview(content),
      content_type: contentType,
      batch_no: batchNo || null,
    })
    .eq('id', inventoryId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/inventory');
  redirect(withSuccessMessage(returnTo, '库存保存成功'));
}

export async function getMerchantInventoryData(searchParams?: {
  productId?: string;
  status?: string;
  batchNo?: string;
}) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      hasShop: false,
      products: [],
      inventoryItems: [],
      summary: { available: 0, sold: 0, locked: 0, invalid: 0 },
      filters: {
        productId: searchParams?.productId || '',
        status: searchParams?.status || '',
        batchNo: searchParams?.batchNo || '',
      },
    };
  }

  const { data: products, error: productError } = await context.supabase
    .from('products')
    .select('id, name, stock_count')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  if (productError) {
    return { ok: false as const, message: productError.message };
  }

  const productIds = (products || []).map((item) => item.id);
  const productId = searchParams?.productId?.trim() || '';
  const status = searchParams?.status?.trim() || '';
  const batchNo = searchParams?.batchNo?.trim() || '';

  if (!productIds.length) {
    return {
      ok: true as const,
      hasShop: true,
      products: [],
      inventoryItems: [],
      summary: { available: 0, sold: 0, locked: 0, invalid: 0 },
      filters: { productId, status, batchNo },
    };
  }

  let query = context.supabase
    .from('inventories')
    .select('id, product_id, content_preview, content_type, status, batch_no, created_at, products(name)')
    .in('product_id', productIds)
    .order('created_at', { ascending: false })
    .limit(300);

  if (status) query = query.eq('status', status);
  if (productId) query = query.eq('product_id', productId);
  if (batchNo) query = query.ilike('batch_no', `%${batchNo}%`);

  const [{ data: inventoryItems, error: inventoryError }, allInventory] = await Promise.all([
    query,
    context.supabase.from('inventories').select('status').in('product_id', productIds),
  ]);

  if (inventoryError) {
    return { ok: false as const, message: inventoryError.message };
  }

  const summary = { available: 0, sold: 0, locked: 0, invalid: 0 };

  for (const item of allInventory.data || []) {
    if (item.status === 'available') summary.available += 1;
    if (item.status === 'sold') summary.sold += 1;
    if (item.status === 'locked') summary.locked += 1;
    if (item.status === 'invalid') summary.invalid += 1;
  }

  return {
    ok: true as const,
    hasShop: true,
    products: products || [],
    inventoryItems: inventoryItems || [],
    summary,
    filters: { productId, status, batchNo },
  };
}

export async function getMerchantDashboardGuide() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id, name, shop_code, is_open, announcement')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  const [categoryCountResult, productsResult, ordersResult] = shop
    ? await Promise.all([
        context.supabase.from('shop_categories').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id),
        context.supabase
          .from('products')
          .select('id, name, stock_count, sold_count, status')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false }),
        context.supabase
          .from('orders')
          .select('order_no, status, payable_amount, created_at, buyer_contact, product_snapshot')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ])
    : [{ count: 0 }, { data: [] as { id: string; name: string; stock_count: number | null; sold_count: number | null; status: string }[] }, { data: [] as { order_no: string; status: string; payable_amount: number | null; created_at: string; buyer_contact: string | null; product_snapshot: { name?: string } | null }[] }];

  const categoryCount = shop ? (categoryCountResult.count ?? 0) : 0;
  const products = productsResult.data || [];

  const productIds = (products || []).map((item) => item.id);
  const productCount = products?.length ?? 0;

  const inventorySummary = productIds.length
    ? await context.supabase
        .from('inventories')
        .select('status', { head: false })
        .in('product_id', productIds)
    : { data: [] as { status: string }[] };

  const inventoryRows = inventorySummary.data || [];
  const inventoryCount = inventoryRows.length;
  const availableInventoryCount = inventoryRows.filter((item) => item.status === 'available').length;
  const lowStockProducts = (products || [])
    .filter((item) => Number(item.stock_count || 0) <= 5)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      stockCount: Number(item.stock_count || 0),
      soldCount: Number(item.sold_count || 0),
    }));

  const orderRows = ordersResult.data || [];
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayOrders = orderRows.filter((item) => item.created_at.slice(0, 10) === todayDate);
  const paidStatuses = new Set(['paid', 'delivered']);
  const deliveredStatuses = new Set(['delivered']);
  const failedStatuses = new Set(['delivery_failed', 'cancelled', 'closed']);

  const totalSalesAmount = orderRows
    .filter((item) => paidStatuses.has(item.status))
    .reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);
  const todaySalesAmount = todayOrders
    .filter((item) => paidStatuses.has(item.status))
    .reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);

  const pendingTasks = [
    !shop ? '请先完善店铺设置，生成店铺编号和前台地址。' : null,
    shop && categoryCount === 0 ? '你还没有分类，建议先创建商品分类。' : null,
    shop && productCount === 0 ? '你还没有商品，请尽快发布商品。' : null,
    shop && inventoryCount === 0 ? '你还没有库存，请尽快导入库存。' : null,
    orderRows.some((item) => item.status === 'delivery_failed') ? '存在发货失败订单，请前往订单管理处理。' : null,
  ].filter(Boolean) as string[];

  return {
    ok: true as const,
    merchantName: context.merchantProfile.contact_name,
    shop,
    shopUrl: shop ? `${siteUrl}/links/${shop.shop_code}` : null,
    categoryCount,
    productCount,
    inventoryCount,
    availableInventoryCount,
    totalOrderCount: orderRows.length,
    todayOrderCount: todayOrders.length,
    totalSalesAmount,
    todaySalesAmount,
    deliveredOrderCount: orderRows.filter((item) => deliveredStatuses.has(item.status)).length,
    pendingPaymentCount: orderRows.filter((item) => item.status === 'pending_payment').length,
    failedOrderCount: orderRows.filter((item) => failedStatuses.has(item.status)).length,
    recentOrders: orderRows.slice(0, 6).map((item) => ({
      orderNo: item.order_no,
      status: item.status,
      amount: Number(item.payable_amount || 0),
      createdAt: item.created_at,
      buyerContact: item.buyer_contact,
      productName: item.product_snapshot?.name || '未知商品',
    })),
    lowStockProducts,
    pendingTasks,
    quickLinks: [
      { title: '店铺设置', description: '完善店铺资料与公告', href: '/merchant/shop' },
      { title: '发布商品', description: '新建并上架商品', href: '/merchant/products/new' },
      { title: '库存管理', description: '导入或查看库存', href: '/merchant/inventory' },
      { title: '订单管理', description: '查看订单与发货状态', href: '/merchant/orders' },
      { title: '商品管理', description: '管理商品列表与状态', href: '/merchant/products' },
      { title: '前台店铺', description: '查看买家访问页面', href: shop ? `${siteUrl}/links/${shop.shop_code}` : '/merchant/shop' },
    ],
    steps: [
      { title: '完善店铺设置', done: Boolean(shop), href: '/merchant/shop' },
      { title: '创建分类', done: categoryCount > 0, href: '/merchant/categories' },
      { title: '创建商品', done: productCount > 0, href: '/merchant/products/new' },
      { title: '导入库存', done: inventoryCount > 0, href: '/merchant/inventory' },
      { title: '访问前台店铺', done: Boolean(shop), href: shop ? `${siteUrl}/links/${shop.shop_code}` : '/merchant/shop' },
    ],
  };
}

export async function getMerchantOrders(searchParams?: {
  keyword?: string;
  status?: string;
  buyerContact?: string;
}) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      hasShop: false,
      orders: [],
      summary: { total: 0, pendingPayment: 0, delivered: 0, failed: 0 },
      filters: {
        keyword: searchParams?.keyword || '',
        status: searchParams?.status || '',
        buyerContact: searchParams?.buyerContact || '',
      },
    };
  }

  let query = context.supabase
    .from('orders')
    .select('id, order_no, status, buyer_contact, payable_amount, quantity, created_at, paid_at, delivered_at, delivery_type, delivery_result, remark, product_snapshot')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const keyword = searchParams?.keyword?.trim();
  const status = searchParams?.status?.trim();
  const buyerContact = searchParams?.buyerContact?.trim();

  if (keyword) {
    query = query.ilike('order_no', `%${keyword}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (buyerContact) {
    query = query.ilike('buyer_contact', `%${buyerContact}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const orders = data || [];
  return {
    ok: true as const,
    hasShop: true,
    orders,
    summary: {
      total: orders.length,
      pendingPayment: orders.filter((item) => item.status === 'pending_payment').length,
      delivered: orders.filter((item) => item.status === 'delivered').length,
      failed: orders.filter((item) => item.status === 'delivery_failed' || item.status === 'cancelled' || item.status === 'closed').length,
    },
    filters: {
      keyword: keyword || '',
      status: status || '',
      buyerContact: buyerContact || '',
    },
  };
}

export async function getMerchantFinanceOverview() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      hasShop: false,
      summary: { totalSales: 0, availableBalance: 0, withdrawnAmount: 0, pendingWithdrawAmount: 0, paidOrderCount: 0 },
      recentOrders: [],
      withdrawRecords: [],
    };
  }

  const { data: orders, error: orderError } = await context.supabase
    .from('orders')
    .select('order_no, status, payable_amount, created_at, paid_at')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (orderError) {
    return { ok: false as const, message: orderError.message };
  }

  const { data: withdrawRecords, error: withdrawError } = await context.supabase
    .from('merchant_withdrawals')
    .select('id, amount, account_name, account_no, channel, status, remark, created_at')
    .eq('merchant_id', context.merchantProfile.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (withdrawError && !String(withdrawError.message).includes('does not exist')) {
    return { ok: false as const, message: withdrawError.message };
  }

  const paidOrders = (orders || []).filter((item) => item.status === 'paid' || item.status === 'delivered');
  const totalSales = paidOrders.reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);
  const withdrawalRows = withdrawRecords || [];
  const withdrawnAmount = withdrawalRows.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingWithdrawAmount = withdrawalRows.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const availableBalance = Math.max(0, totalSales - withdrawnAmount - pendingWithdrawAmount);

  return {
    ok: true as const,
    hasShop: true,
    summary: {
      totalSales,
      availableBalance,
      withdrawnAmount,
      pendingWithdrawAmount,
      paidOrderCount: paidOrders.length,
    },
    recentOrders: paidOrders.slice(0, 8),
    withdrawRecords: withdrawalRows,
  };
}

export async function getMerchantOrderDetail(orderId: string) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: true as const, hasShop: false, order: null };
  }

  const { data: order, error } = await context.supabase
    .from('orders')
    .select('id, order_no, status, buyer_contact, payable_amount, quantity, created_at, paid_at, delivered_at, delivery_type, delivery_result, remark, product_snapshot, product_id')
    .eq('id', orderId)
    .eq('shop_id', shop.id)
    .maybeSingle();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (!order) {
    return { ok: false as const, message: '订单不存在或无权限查看。' };
  }

  return {
    ok: true as const,
    hasShop: true,
    order,
  };
}

export async function triggerMerchantOrderPaymentAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const orderId = String(formData.get('orderId') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/orders').trim() || '/merchant/orders';
  if (!orderId) {
    return { ok: false as const, message: '缺少订单 ID。' };
  }

  const detail = await getMerchantOrderDetail(orderId);
  if (!detail.ok || !detail.order) {
    return detail;
  }

  await processOrderPayment(detail.order.order_no);
  revalidatePath('/merchant/orders');
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath(`/order/${detail.order.order_no}`);
  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, '支付回调已触发'));
}

export async function closeMerchantOrderAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const orderId = String(formData.get('orderId') || '').trim();
  const reason = String(formData.get('reason') || '').trim() || '商家已手动关闭订单。';
  const returnTo = String(formData.get('returnTo') || '/merchant/orders').trim() || '/merchant/orders';

  if (!orderId) {
    return { ok: false as const, message: '缺少订单 ID。' };
  }

  const detail = await getMerchantOrderDetail(orderId);
  if (!detail.ok || !detail.order) {
    return detail;
  }

  await closeOrderAndRelease(orderId, reason);
  revalidatePath('/merchant/orders');
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath(`/order/${detail.order.order_no}`);
  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, '订单已关闭'));
}

export async function appendMerchantOrderRemarkAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const orderId = String(formData.get('orderId') || '').trim();
  const remark = String(formData.get('remark') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/orders').trim() || '/merchant/orders';

  if (!orderId || !remark) {
    return { ok: false as const, message: '请填写备注内容。' };
  }

  const detail = await getMerchantOrderDetail(orderId);
  if (!detail.ok || !detail.order) {
    return detail;
  }

  await appendOrderRemark(orderId, remark);
  revalidatePath('/merchant/orders');
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath(`/order/${detail.order.order_no}`);
  redirect(withSuccessMessage(returnTo, '订单备注已追加'));
}

export async function redeliverMerchantOrderAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const orderId = String(formData.get('orderId') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/merchant/orders').trim() || '/merchant/orders';
  if (!orderId) {
    return { ok: false as const, message: '缺少订单 ID。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: order, error: orderError } = await context.supabase
    .from('orders')
    .select('id, order_no, status, product_id, quantity, shop_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order || order.shop_id !== shop.id) {
    return { ok: false as const, message: '订单不存在或无权限处理。' };
  }

  if (!['paid', 'delivery_failed'].includes(order.status)) {
    return { ok: false as const, message: '当前订单状态不支持自动补发。' };
  }

  const { data: inventoryItems, error: inventoryError } = await context.supabase
    .from('inventories')
    .select('id, content_preview, content_encrypted, content_type')
    .eq('product_id', order.product_id)
    .eq('status', 'available')
    .order('created_at', { ascending: true })
    .limit(order.quantity);

  if (inventoryError) {
    return { ok: false as const, message: inventoryError.message };
  }

  if (!inventoryItems || inventoryItems.length < order.quantity) {
    await context.supabase
      .from('orders')
      .update({
        status: 'delivery_failed',
        delivery_result: [{ type: 'delivery_failed', preview: '库存不足，补发失败。', content: '库存不足，补发失败。' }],
      })
      .eq('id', order.id);

    revalidatePath('/merchant/orders');
    revalidatePath(`/merchant/orders/${orderId}`);
    redirect(withSuccessMessage(returnTo, '库存不足，无法补发'));
  }

  const deliveryResult = inventoryItems.map((item) => ({ type: item.content_type, preview: item.content_preview, content: item.content_encrypted }));
  const inventoryIds = inventoryItems.map((item) => item.id);

  const { error: inventoryUpdateError } = await context.supabase
    .from('inventories')
    .update({ status: 'sold', sold_order_id: order.id, sold_at: new Date().toISOString() })
    .in('id', inventoryIds);

  if (inventoryUpdateError) {
    return { ok: false as const, message: inventoryUpdateError.message };
  }

  const { error: orderUpdateError } = await context.supabase
    .from('orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString(), delivery_result: deliveryResult })
    .eq('id', order.id);

  if (orderUpdateError) {
    return { ok: false as const, message: orderUpdateError.message };
  }

  const { data: product } = await context.supabase.from('products').select('id, stock_count, sold_count').eq('id', order.product_id).maybeSingle();
  if (product) {
    await context.supabase
      .from('products')
      .update({ stock_count: Math.max(0, Number(product.stock_count || 0) - order.quantity), sold_count: Number(product.sold_count || 0) + order.quantity })
      .eq('id', product.id);
  }

  revalidatePath('/merchant/orders');
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(withSuccessMessage(returnTo, '订单已补发'));
}

export async function manualDeliverMerchantOrderAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const orderId = String(formData.get('orderId') || '').trim();
  const manualContent = String(formData.get('manualContent') || '').trim();

  if (!orderId || !manualContent) {
    return { ok: false as const, message: '请填写手动发货内容。' };
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return { ok: false as const, message: '请先完成店铺设置。' };
  }

  const { data: order, error } = await context.supabase
    .from('orders')
    .select('id, shop_id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order || order.shop_id !== shop.id) {
    return { ok: false as const, message: '订单不存在或无权限处理。' };
  }

  if (!['paid', 'delivery_failed', 'pending_payment'].includes(order.status)) {
    return { ok: false as const, message: '当前订单状态不支持手动发货。' };
  }

  const { error: updateError } = await context.supabase
    .from('orders')
    .update({
      status: 'delivered',
      paid_at: order.status === 'pending_payment' ? new Date().toISOString() : undefined,
      delivered_at: new Date().toISOString(),
      delivery_result: [{ type: 'manual_delivery', preview: manualContent, content: manualContent }],
    })
    .eq('id', order.id);

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  revalidatePath('/merchant/orders');
  revalidatePath(`/merchant/orders/${orderId}`);
  return { ok: true as const, message: '已手动发货。' };
}

export async function createMerchantWithdrawalAction(formData: FormData) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const amount = Number(formData.get('amount') || 0);
  const accountName = String(formData.get('accountName') || '').trim();
  const accountNo = String(formData.get('accountNo') || '').trim();
  const channel = String(formData.get('channel') || '').trim();
  const remark = String(formData.get('remark') || '').trim();

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return { ok: false as const, message: '提现金额必须大于 0。' };
  }

  if (!accountName || !accountNo || !channel) {
    return { ok: false as const, message: '请完整填写提现账户信息。' };
  }

  const overview = await getMerchantFinanceOverview();
  if (!overview.ok) {
    return overview;
  }

  if (amount > overview.summary.availableBalance) {
    return { ok: false as const, message: '提现金额不能超过可提现余额。' };
  }

  const { error } = await context.supabase.from('merchant_withdrawals').insert({
    merchant_id: context.merchantProfile.id,
    amount,
    account_name: accountName,
    account_no: accountNo,
    channel,
    remark: remark || null,
    status: 'pending',
  });

  if (error && !String(error.message).includes('does not exist')) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath('/merchant/finance');
  revalidatePath('/merchant/withdraw');
  return { ok: true as const, message: '提现申请已提交。' };
}

export async function getMerchantAftersales(searchParams?: {
  keyword?: string;
  status?: string;
}) {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      hasShop: false,
      records: [],
      summary: { total: 0, refundPending: 0, refunded: 0, deliveryFailed: 0 },
      filters: {
        keyword: searchParams?.keyword || '',
        status: searchParams?.status || '',
      },
    };
  }

  const keyword = searchParams?.keyword?.trim() || '';
  const status = searchParams?.status?.trim() || '';
  const aftersaleStatuses = ['refund_pending', 'refunded', 'delivery_failed'];

  let query = context.supabase
    .from('orders')
    .select('id, order_no, status, buyer_contact, payable_amount, created_at, paid_at, delivered_at, remark, product_snapshot')
    .eq('shop_id', shop.id)
    .in('status', status ? [status] : aftersaleStatuses)
    .order('created_at', { ascending: false })
    .limit(200);

  if (keyword) {
    query = query.or(`order_no.ilike.%${keyword}%,buyer_contact.ilike.%${keyword}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const records = data || [];
  return {
    ok: true as const,
    hasShop: true,
    records,
    summary: {
      total: records.length,
      refundPending: records.filter((item) => item.status === 'refund_pending').length,
      refunded: records.filter((item) => item.status === 'refunded').length,
      deliveryFailed: records.filter((item) => item.status === 'delivery_failed').length,
    },
    filters: {
      keyword,
      status,
    },
  };
}

export async function getMerchantAnalytics() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  if (!shop) {
    return {
      ok: true as const,
      hasShop: false,
      summary: { totalOrders: 0, paidOrders: 0, refundedOrders: 0, totalSales: 0, refundRate: 0 },
      dailySales: [],
      productRanking: [],
      statusDistribution: [],
    };
  }

  const { data: orders, error } = await context.supabase
    .from('orders')
    .select('status, payable_amount, created_at, paid_at, product_snapshot')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const rows = orders || [];
  const paidRows = rows.filter((item) => item.status === 'paid' || item.status === 'delivered');
  const refundedRows = rows.filter((item) => item.status === 'refunded' || item.status === 'refund_pending');
  const totalSales = paidRows.reduce((sum, item) => sum + Number(item.payable_amount || 0), 0);
  const refundRate = rows.length ? refundedRows.length / rows.length : 0;

  const salesMap = new Map<string, number>();
  for (const item of paidRows) {
    const dateKey = (item.paid_at || item.created_at || '').slice(0, 10);
    if (!dateKey) continue;
    salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + Number(item.payable_amount || 0));
  }

  const productMap = new Map<string, { name: string; amount: number; count: number }>();
  for (const item of paidRows) {
    const snapshot = item.product_snapshot as { name?: string } | null;
    const name = snapshot?.name || '未知商品';
    const current = productMap.get(name) || { name, amount: 0, count: 0 };
    current.amount += Number(item.payable_amount || 0);
    current.count += 1;
    productMap.set(name, current);
  }

  const statusMap = new Map<string, number>();
  for (const item of rows) {
    statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1);
  }

  return {
    ok: true as const,
    hasShop: true,
    summary: {
      totalOrders: rows.length,
      paidOrders: paidRows.length,
      refundedOrders: refundedRows.length,
      totalSales,
      refundRate,
    },
    dailySales: Array.from(salesMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, amount]) => ({ date, amount })),
    productRanking: Array.from(productMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 8),
    statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
  };
}

export async function getMerchantSystemOverview() {
  const context = await getCurrentMerchantContext();
  if (!context.ok) {
    return context;
  }

  const { data: shop } = await context.supabase
    .from('shops')
    .select('id, name, shop_code, is_open, created_at, status')
    .eq('merchant_id', context.merchantProfile.id)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const shopUrl = shop?.shop_code ? `${siteUrl}/links/${shop.shop_code}` : null;
  const merchantId = context.merchantProfile.id;
  const userId = context.user.id;

  return {
    ok: true as const,
    merchantProfile: context.merchantProfile,
    shop,
    shopUrl,
    apiInfo: {
      appId: `MER-${merchantId.slice(0, 8).toUpperCase()}`,
      accessKey: `AK_${userId.slice(0, 6).toUpperCase()}_${merchantId.slice(0, 6).toUpperCase()}`,
      secretHint: `${merchantId.slice(0, 4)}****${userId.slice(-4)}`,
      signMethod: 'HMAC-SHA256',
      callbackUrl: shopUrl ? `${shopUrl}/api/callback` : `${siteUrl}/merchant/open-api`,
    },
    securityInfo: {
      loginEmail: context.user.email || '-',
      reviewStatus: context.merchantProfile.review_status,
      shopStatus: shop?.is_open ? '营业中' : '暂停营业',
      passwordUpdatedTip: '如需修改密码，请通过登录页重置或后续接入修改密码流程。',
      riskTip: '建议开启独立收款设备、定期检查 API Key、限制后台账号共享。',
    },
    onboardingInfo: {
      merchantType: 'individual',
      contactName: context.merchantProfile.contact_name || '-',
      contactEmail: context.user.email || '-',
      reviewStatus: context.merchantProfile.review_status,
      shopCreated: Boolean(shop),
      shopName: shop?.name || '-',
      shopCreatedAt: shop?.created_at || null,
      materialChecklist: [
        { label: '联系人姓名', done: Boolean(context.merchantProfile.contact_name) },
        { label: '登录邮箱', done: Boolean(context.user.email) },
        { label: '店铺资料', done: Boolean(shop) },
        { label: '商品与库存', done: Boolean(shop) },
      ],
    },
  };
}
