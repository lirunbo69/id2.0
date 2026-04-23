import { NextRequest, NextResponse } from 'next/server';

import { isAlipayTradeSuccess, verifyAlipayNotify } from '@/lib/alipay';
import { processOrderPayment, releaseExpiredPendingOrders } from '@/lib/order-flow';

function getParamValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, getParamValue(value)]),
    );

    const orderNo = String(payload.out_trade_no || payload.order_no || '').trim();
    const tradeStatus = String(payload.trade_status || '').trim();

    if (!orderNo) {
      return new NextResponse('missing order_no', { status: 400 });
    }

    if (!verifyAlipayNotify(payload)) {
      return new NextResponse('invalid sign', { status: 401 });
    }

    if (!isAlipayTradeSuccess(tradeStatus)) {
      return new NextResponse('success');
    }

    await releaseExpiredPendingOrders();
    const result = await processOrderPayment(orderNo);

    if (!result.ok) {
      return new NextResponse(result.message || 'payment process failed', { status: 400 });
    }

    return new NextResponse('success');
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : '支付回调处理失败。' },
      { status: 500 },
    );
  }
}
