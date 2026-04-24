'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { buildAlipayPagePayUrl } from '@/lib/alipay';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAutoDeliveryType, processOrderPayment, releaseExpiredPendingOrders, reserveInventoryForOrder } from '@/lib/order-flow';
import { resolveSiteUrl } from '@/lib/utils';

function makeOrderNo() {
  const now = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const suffix = Math.random().toString().slice(2, 8);
  return `QX${timestamp}${suffix}`;
}

function makeQueryToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

async function getSiteUrl() {
  const headerStore = await headers();
  return resolveSiteUrl({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    host: headerStore.get('x-forwarded-host') || headerStore.get('host'),
    protocol: headerStore.get('x-forwarded-proto'),
  });
}

async function getOrderPaymentSnapshot(orderNo: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('order_no, status, payable_amount, product_snapshot')
    .eq('order_no', orderNo)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || '订单不存在。');
  }

  return data;
}

async function getAvailableInventoryCount(productId: string) {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from('inventories')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('status', 'available');

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function simulatePayOrderAction(formData: FormData) {
  const orderNo = String(formData.get('orderNo') || '').trim();
  if (!orderNo) throw new Error('缺少订单号。');

  await processOrderPayment(orderNo);

  revalidatePath(`/order/${orderNo}`);
  revalidatePath('/merchant/orders');
  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(`/order/${orderNo}`);
}

export async function initiateAlipayPaymentAction(formData: FormData) {
  const orderNo = String(formData.get('orderNo') || '').trim();
  if (!orderNo) throw new Error('缺少订单号。');

  const order = await getOrderPaymentSnapshot(orderNo);
  if (order.status !== 'pending_payment') {
    redirect(`/order/${orderNo}`);
  }

  const productSnapshot = (order.product_snapshot || {}) as { name?: string };
  const siteUrl = await getSiteUrl();
  const payUrl = buildAlipayPagePayUrl({
    orderNo: order.order_no,
    amount: Number(order.payable_amount || 0),
    subject: productSnapshot.name || `千寻订单 ${order.order_no}`,
    notifyUrl: `${siteUrl}/api/payment/callback`,
    returnUrl: `${siteUrl}/order/${order.order_no}`,
  });

  redirect(payUrl);
}

export async function queryOrderAction(formData: FormData) {
  const orderNo = String(formData.get('orderNo') || '').trim();
  const queryToken = String(formData.get('queryToken') || '').trim();
  const supabase = await createServerSupabaseClient();

  await releaseExpiredPendingOrders();

  if (!orderNo || !queryToken) {
    throw new Error('请输入订单号和查询密钥。');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_no')
    .eq('order_no', orderNo)
    .eq('query_token', queryToken)
    .maybeSingle();

  if (error || !data) {
    throw new Error('订单号或查询密钥不正确。');
  }

  redirect(`/order/${orderNo}`);
}

export async function getPublicShopData(shopCode: string) {
  const supabase = await createServerSupabaseClient();
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, shop_code, name, intro, announcement, contact_qq, contact_wechat, contact_telegram, customer_service_url, is_open, status, rating, order_count, logo_url, banner_url')
    .eq('shop_code', shopCode)
    .maybeSingle();

  if (shopError || !shop) {
    return { ok: false as const, message: '店铺不存在。' };
  }

  const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
    supabase.from('shop_categories').select('id, name, sort_order').eq('shop_id', shop.id).eq('is_active', true).order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, subtitle, price, stock_count, sold_count, summary, cover_url, category_id, delivery_type, need_contact, need_remark')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .eq('is_visible', true)
      .order('created_at', { ascending: false }),
  ]);

  if (categoryError) return { ok: false as const, message: categoryError.message };
  if (productError) return { ok: false as const, message: productError.message };

  return { ok: true as const, shop, categories: categories || [], products: products || [] };
}

export async function getPublicProductDetail(shopCode: string, productId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: shop, error: shopError } = await supabase.from('shops').select('id, shop_code, name, is_open, announcement').eq('shop_code', shopCode).maybeSingle();
  if (shopError || !shop) return { ok: false as const, message: '店铺不存在。' };

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, subtitle, price, stock_count, sold_count, summary, detail_html, usage_guide, refund_policy, notice_text, delivery_type, min_purchase_qty, max_purchase_qty, cover_url, category_id, need_contact, need_remark')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .maybeSingle();

  if (error || !product) return { ok: false as const, message: '商品不存在。' };
  return { ok: true as const, shop, product };
}

export async function createOrderAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await releaseExpiredPendingOrders();

  const shopCode = String(formData.get('shopCode') || '').trim();
  const productId = String(formData.get('productId') || '').trim();
  const quantity = Number(formData.get('quantity') || 1);
  const buyerContact = String(formData.get('buyerContact') || '').trim();
  const remark = String(formData.get('remark') || '').trim();

  if (!shopCode || !productId) throw new Error('缺少商品信息。');
  if (!quantity || quantity <= 0) throw new Error('购买数量不合法。');

  const { data: shop, error: shopError } = await supabase.from('shops').select('id, merchant_id, shop_code, is_open').eq('shop_code', shopCode).maybeSingle();
  if (shopError || !shop) throw new Error('店铺不存在。');
  if (!shop.is_open) throw new Error('店铺当前未营业。');

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, subtitle, price, sold_count, delivery_type, min_purchase_qty, max_purchase_qty, need_contact, need_remark')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .maybeSingle();

  if (productError || !product) throw new Error('商品不存在。');
  if (quantity < product.min_purchase_qty || quantity > product.max_purchase_qty) throw new Error('购买数量超出限制。');
  if (product.need_contact && !buyerContact) throw new Error('该商品要求填写联系方式。');
  if (product.need_remark && !remark) throw new Error('该商品要求填写备注信息。');

  const availableInventoryCount = isAutoDeliveryType(product.delivery_type)
    ? await getAvailableInventoryCount(product.id)
    : Number.MAX_SAFE_INTEGER;

  if (isAutoDeliveryType(product.delivery_type) && availableInventoryCount < quantity) {
    throw new Error('当前库存不足，无法创建订单。');
  }

  const { data: userData } = await supabase.auth.getUser();
  const buyerId = userData.user?.id || null;
  const unitPrice = Number(product.price);
  const totalAmount = unitPrice * quantity;
  const orderNo = makeOrderNo();
  const queryToken = makeQueryToken();

  const { data: insertedOrder, error } = await supabase
    .from('orders')
    .insert({
      order_no: orderNo,
      shop_id: shop.id,
      merchant_id: shop.merchant_id,
      buyer_id: buyerId,
      buyer_contact: buyerContact || null,
      product_id: product.id,
      product_snapshot: { name: product.name, subtitle: product.subtitle, price: product.price, delivery_type: product.delivery_type },
      unit_price: unitPrice,
      quantity,
      total_amount: totalAmount,
      discount_amount: 0,
      payable_amount: totalAmount,
      status: 'pending_payment',
      delivery_type: product.delivery_type,
      remark: remark || null,
      query_token: queryToken,
    })
    .select('id')
    .maybeSingle();

  if (error || !insertedOrder) throw new Error(error?.message || '创建订单失败。');

  if (isAutoDeliveryType(product.delivery_type)) {
    const reserved = await reserveInventoryForOrder(insertedOrder.id, product.id, quantity);
    if (!reserved) {
      await supabase
        .from('orders')
        .update({
          status: 'closed',
          delivery_result: [{ type: 'reserve_failed', preview: '库存已被抢光，订单未能锁定库存。', content: '库存已被抢光，订单未能锁定库存。' }],
        })
        .eq('id', insertedOrder.id);
      throw new Error('库存已被抢光，请刷新后重试。');
    }
  }

  revalidatePath(`/order/${orderNo}`);
  revalidatePath('/merchant/inventory');
  revalidatePath('/merchant/products');
  redirect(`/order/${orderNo}`);
}

export async function createOrderAndReturnAction(
  _prevState: { ok: boolean; message: string; orderNo?: string; amount?: number; productName?: string; quantity?: number; queryToken?: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string; orderNo?: string; amount?: number; productName?: string; quantity?: number; queryToken?: string }> {
  const supabase = await createServerSupabaseClient();
  await releaseExpiredPendingOrders();

  const shopCode = String(formData.get('shopCode') || '').trim();
  const productId = String(formData.get('productId') || '').trim();
  const quantity = Number(formData.get('quantity') || 1);
  const buyerContact = String(formData.get('buyerContact') || '').trim();
  const remark = String(formData.get('remark') || '').trim();

  if (!shopCode || !productId) return { ok: false, message: '缺少商品信息。' };
  if (!quantity || quantity <= 0) return { ok: false, message: '购买数量不合法。' };

  try {
    const { data: shop, error: shopError } = await supabase.from('shops').select('id, merchant_id, shop_code, is_open').eq('shop_code', shopCode).maybeSingle();
    if (shopError || !shop) return { ok: false, message: '店铺不存在。' };
    if (!shop.is_open) return { ok: false, message: '店铺当前未营业。' };

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, subtitle, price, sold_count, delivery_type, min_purchase_qty, max_purchase_qty, need_contact, need_remark')
      .eq('id', productId)
      .eq('shop_id', shop.id)
      .maybeSingle();

    if (productError || !product) return { ok: false, message: '商品不存在。' };
    if (quantity < product.min_purchase_qty || quantity > product.max_purchase_qty) return { ok: false, message: '购买数量超出限制。' };
    if (product.need_contact && !buyerContact) return { ok: false, message: '该商品要求填写联系方式。' };
    if (product.need_remark && !remark) return { ok: false, message: '该商品要求填写备注信息。' };

    const availableInventoryCount = isAutoDeliveryType(product.delivery_type)
      ? await getAvailableInventoryCount(product.id)
      : Number.MAX_SAFE_INTEGER;

    if (isAutoDeliveryType(product.delivery_type) && availableInventoryCount < quantity) {
      return { ok: false, message: '当前库存不足，无法创建订单。' };
    }

    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData.user?.id || null;
    const unitPrice = Number(product.price);
    const totalAmount = unitPrice * quantity;
    const orderNo = makeOrderNo();
    const queryToken = makeQueryToken();

    const { data: insertedOrder, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        shop_id: shop.id,
        merchant_id: shop.merchant_id,
        buyer_id: buyerId,
        buyer_contact: buyerContact || null,
        product_id: product.id,
        product_snapshot: { name: product.name, subtitle: product.subtitle, price: product.price, delivery_type: product.delivery_type },
        unit_price: unitPrice,
        quantity,
        total_amount: totalAmount,
        discount_amount: 0,
        payable_amount: totalAmount,
        status: 'pending_payment',
        delivery_type: product.delivery_type,
        remark: remark || null,
        query_token: queryToken,
      })
      .select('id')
      .maybeSingle();

    if (error || !insertedOrder) return { ok: false, message: error?.message || '创建订单失败。' };

    if (isAutoDeliveryType(product.delivery_type)) {
      const reserved = await reserveInventoryForOrder(insertedOrder.id, product.id, quantity);
      if (!reserved) {
        await supabase
          .from('orders')
          .update({
            status: 'closed',
            delivery_result: [{ type: 'reserve_failed', preview: '库存已被抢光，订单未能锁定库存。', content: '库存已被抢光，订单未能锁定库存。' }],
          })
          .eq('id', insertedOrder.id);
        return { ok: false, message: '库存已被抢光，请刷新后重试。' };
      }
    }

    revalidatePath(`/order/${orderNo}`);
    revalidatePath('/merchant/inventory');
    revalidatePath('/merchant/products');

    return {
      ok: true,
      message: '',
      orderNo,
      amount: totalAmount,
      productName: product.name,
      quantity,
      queryToken,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '创建订单失败。' };
  }
}

export async function getAlipayPayUrl(orderNo: string, amount: number, subject: string) {
  const siteUrl = await getSiteUrl();
  const hasAlipayConfig = !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_APP_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY);
  if (!hasAlipayConfig) return null;

  return buildAlipayPagePayUrl({
    orderNo,
    amount,
    subject,
    notifyUrl: `${siteUrl}/api/payment/callback`,
    returnUrl: `${siteUrl}/order/${orderNo}`,
  });
}

export async function getOrderDetail(orderNo: string) {
  const supabase = await createServerSupabaseClient();
  await releaseExpiredPendingOrders();

  const { data, error } = await supabase
    .from('orders')
    .select('order_no, status, buyer_contact, unit_price, quantity, total_amount, payable_amount, paid_at, delivered_at, remark, delivery_type, delivery_result, product_snapshot, created_at, query_token')
    .eq('order_no', orderNo)
    .maybeSingle();

  if (error || !data) return { ok: false as const, message: '订单不存在。' };
  return { ok: true as const, order: data };
}
