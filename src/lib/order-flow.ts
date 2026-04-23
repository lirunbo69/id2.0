import { createServiceRoleSupabaseClient } from '@/lib/supabase';

export const AUTO_DELIVERY_TYPES = ['card_key', 'account_password', 'link', 'custom_text'] as const;
const RESERVE_TIMEOUT_MINUTES = 30;

type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>;

export function isAutoDeliveryType(deliveryType: string | null | undefined) {
  return AUTO_DELIVERY_TYPES.includes(String(deliveryType || '') as (typeof AUTO_DELIVERY_TYPES)[number]);
}

async function getOrderByOrderNo(supabase: ServiceClient, orderNo: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, status, product_id, quantity, delivery_type, created_at')
    .eq('order_no', orderNo)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || '订单不存在。');
  }

  return data;
}

async function getOrderById(supabase: ServiceClient, orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, status, product_id, quantity, delivery_type, created_at')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || '订单不存在。');
  }

  return data;
}

async function increaseProductStock(supabase: ServiceClient, productId: string, quantity: number) {
  const { data: product } = await supabase.from('products').select('id, stock_count').eq('id', productId).maybeSingle();
  if (product) {
    await supabase.from('products').update({ stock_count: Number(product.stock_count || 0) + quantity }).eq('id', product.id);
  }
}

async function decreaseProductStock(supabase: ServiceClient, productId: string, quantity: number) {
  const { data: product } = await supabase.from('products').select('id, stock_count').eq('id', productId).maybeSingle();
  if (product) {
    await supabase.from('products').update({ stock_count: Math.max(0, Number(product.stock_count || 0) - quantity) }).eq('id', product.id);
  }
}

async function increaseProductSoldCount(supabase: ServiceClient, productId: string, quantity: number) {
  const { data: product } = await supabase.from('products').select('id, sold_count').eq('id', productId).maybeSingle();
  if (product) {
    await supabase.from('products').update({ sold_count: Number(product.sold_count || 0) + quantity }).eq('id', product.id);
  }
}

export async function releaseOrderReservation(orderId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: items, error } = await supabase
    .from('inventories')
    .select('id, product_id')
    .eq('sold_order_id', orderId)
    .eq('status', 'locked');

  if (error) {
    throw new Error(error.message);
  }

  if (!items?.length) {
    return 0;
  }

  await supabase.from('inventories').update({ status: 'available', sold_order_id: null, sold_at: null }).in('id', items.map((item) => item.id));

  const grouped = new Map<string, number>();
  for (const item of items) {
    grouped.set(item.product_id, (grouped.get(item.product_id) || 0) + 1);
  }

  for (const [productId, count] of grouped) {
    await increaseProductStock(supabase, productId, count);
  }

  return items.length;
}

export async function reserveInventoryForOrder(orderId: string, productId: string, quantity: number) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: availableItems, error } = await supabase
    .from('inventories')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'available')
    .order('created_at', { ascending: true })
    .limit(quantity);

  if (error) {
    throw new Error(error.message);
  }

  if (!availableItems || availableItems.length < quantity) {
    return false;
  }

  const inventoryIds = availableItems.map((item) => item.id);
  const { error: updateError } = await supabase
    .from('inventories')
    .update({ status: 'locked', sold_order_id: orderId, sold_at: null })
    .in('id', inventoryIds);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await decreaseProductStock(supabase, productId, quantity);
  return true;
}

export async function releaseExpiredPendingOrders() {
  const supabase = createServiceRoleSupabaseClient();
  const expireBefore = new Date(Date.now() - RESERVE_TIMEOUT_MINUTES * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_no, delivery_type, status, created_at')
    .eq('status', 'pending_payment')
    .lt('created_at', expireBefore)
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  for (const order of orders || []) {
    if (isAutoDeliveryType(order.delivery_type)) {
      await releaseOrderReservation(order.id);
    }

    await supabase
      .from('orders')
      .update({
        status: 'closed',
        delivery_result: [{ type: 'timeout_closed', preview: '订单超时未支付，系统已自动关闭。', content: '订单超时未支付，系统已自动关闭。' }],
      })
      .eq('id', order.id);
  }

  return (orders || []).length;
}

export async function processOrderPayment(orderNo: string) {
  const supabase = createServiceRoleSupabaseClient();
  await releaseExpiredPendingOrders();

  const order = await getOrderByOrderNo(supabase, orderNo);

  if (order.status === 'delivered') {
    return { ok: true as const, status: 'delivered' };
  }

  if (order.status === 'closed' || order.status === 'cancelled') {
    return { ok: false as const, message: '订单已关闭或已取消。' };
  }

  if (order.status === 'pending_payment') {
    await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);
  }

  if (!isAutoDeliveryType(order.delivery_type)) {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        delivery_result: [{ type: 'manual_notice', preview: '该订单为人工发货，请等待商家处理。', content: '该订单为人工发货，请等待商家处理。' }],
      })
      .eq('id', order.id);
    return { ok: true as const, status: 'paid' };
  }

  let { data: reservedItems, error: reservedError } = await supabase
    .from('inventories')
    .select('id, content_encrypted, content_preview, content_type')
    .eq('sold_order_id', order.id)
    .eq('status', 'locked')
    .order('created_at', { ascending: true });

  if (reservedError) {
    throw new Error(reservedError.message);
  }

  if (!reservedItems || reservedItems.length < order.quantity) {
    await releaseOrderReservation(order.id);
    const reserved = await reserveInventoryForOrder(order.id, order.product_id, order.quantity);
    if (!reserved) {
      await supabase
        .from('orders')
        .update({
          status: 'delivery_failed',
          delivery_result: [{ type: 'delivery_failed', preview: '库存不足，自动发货失败，请联系商家处理。', content: '库存不足，自动发货失败，请联系商家处理。' }],
        })
        .eq('id', order.id);
      return { ok: false as const, message: '库存不足，自动发货失败。' };
    }

    const retry = await supabase
      .from('inventories')
      .select('id, content_encrypted, content_preview, content_type')
      .eq('sold_order_id', order.id)
      .eq('status', 'locked')
      .order('created_at', { ascending: true });

    if (retry.error) {
      throw new Error(retry.error.message);
    }

    reservedItems = retry.data || [];
  }

  const inventoryIds = reservedItems.slice(0, order.quantity).map((item) => item.id);
  const deliveryResult = reservedItems.slice(0, order.quantity).map((item) => ({ type: item.content_type, preview: item.content_preview, content: item.content_encrypted }));

  await supabase.from('inventories').update({ status: 'sold', sold_at: new Date().toISOString() }).in('id', inventoryIds);
  await supabase
    .from('orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString(), delivery_result: deliveryResult })
    .eq('id', order.id);
  await increaseProductSoldCount(supabase, order.product_id, order.quantity);

  return { ok: true as const, status: 'delivered' };
}

export async function closeOrderAndRelease(orderId: string, reason = '订单已关闭。') {
  const supabase = createServiceRoleSupabaseClient();
  const order = await getOrderById(supabase, orderId);
  await releaseOrderReservation(order.id);
  await supabase
    .from('orders')
    .update({ status: 'closed', delivery_result: [{ type: 'closed', preview: reason, content: reason }] })
    .eq('id', order.id);
}

export async function appendOrderRemark(orderId: string, remark: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: order, error } = await supabase.from('orders').select('id, remark').eq('id', orderId).maybeSingle();
  if (error || !order) {
    throw new Error(error?.message || '订单不存在。');
  }

  const mergedRemark = [order.remark, remark].filter(Boolean).join('\n');
  await supabase.from('orders').update({ remark: mergedRemark }).eq('id', order.id);
}
