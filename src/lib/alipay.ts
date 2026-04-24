import crypto from 'node:crypto';

export type AlipayPagePayParams = {
  orderNo: string;
  amount: number;
  subject: string;
  notifyUrl?: string;
  returnUrl?: string;
  quitUrl?: string;
};

type AlipayTradeStatus = 'WAIT_BUYER_PAY' | 'TRADE_CLOSED' | 'TRADE_SUCCESS' | 'TRADE_FINISHED';

type AlipayConfig = {
  appId: string;
  privateKey: string;
  publicKey: string;
  gateway?: string;
};

type VerifyPayload = Record<string, string>;

const DEFAULT_GATEWAY = 'https://openapi.alipay.com/gateway.do';
const SIGN_TYPE = 'RSA2';
const CHARSET = 'utf-8';
const VERSION = '1.0';
const FORMAT = 'JSON';

function getConfig(): AlipayConfig {
  const appId = process.env.ALIPAY_APP_ID || '';
  const privateKey = normalizePem(process.env.ALIPAY_APP_PRIVATE_KEY || '');
  const publicKey = normalizePem(process.env.ALIPAY_PUBLIC_KEY || '');
  const gateway = process.env.ALIPAY_GATEWAY || DEFAULT_GATEWAY;

  if (!appId || !privateKey || !publicKey) {
    throw new Error('缺少支付宝支付配置，请检查 ALIPAY_APP_ID / ALIPAY_APP_PRIVATE_KEY / ALIPAY_PUBLIC_KEY。');
  }

  return { appId, privateKey, publicKey, gateway };
}

function normalizePem(value: string) {
  let pem = value.replace(/\\n/g, '\n').trim();

  if (!pem.startsWith('-----')) {
    const isPrivate = pem.length > 500;
    const label = isPrivate ? 'RSA PRIVATE KEY' : 'PUBLIC KEY';
    const body = pem.replace(/[\r\n\s]/g, '');
    const lines = body.match(/.{1,64}/g) || [];
    pem = `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
  }

  return pem;
}

function formatTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function sortEntries(record: Record<string, string>) {
  return Object.entries(record)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right));
}

function buildSignContent(record: Record<string, string>) {
  return sortEntries(record)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function sign(content: string, privateKey: string) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(content, CHARSET);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

function verify(content: string, signature: string, publicKey: string) {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(content, CHARSET);
  verifier.end();
  return verifier.verify(publicKey, signature, 'base64');
}

export function buildAlipayPagePayUrl(params: AlipayPagePayParams) {
  const config = getConfig();

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.page.pay',
    format: FORMAT,
    charset: CHARSET,
    sign_type: SIGN_TYPE,
    timestamp: formatTimestamp(),
    version: VERSION,
    notify_url: params.notifyUrl || '',
    return_url: params.returnUrl || '',
    biz_content: JSON.stringify({
      out_trade_no: params.orderNo,
      total_amount: params.amount.toFixed(2),
      subject: params.subject,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    }),
  };

  const signContent = buildSignContent(requestParams);
  requestParams.sign = sign(signContent, config.privateKey);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(requestParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  return `${config.gateway}?${query.toString()}`;
}

export function buildAlipayWapPayUrl(params: AlipayPagePayParams) {
  const config = getConfig();

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.wap.pay',
    format: FORMAT,
    charset: CHARSET,
    sign_type: SIGN_TYPE,
    timestamp: formatTimestamp(),
    version: VERSION,
    notify_url: params.notifyUrl || '',
    return_url: params.returnUrl || '',
    biz_content: JSON.stringify({
      out_trade_no: params.orderNo,
      total_amount: params.amount.toFixed(2),
      subject: params.subject,
      product_code: 'QUICK_WAP_WAY',
      quit_url: params.quitUrl || params.returnUrl || '',
    }),
  };

  const signContent = buildSignContent(requestParams);
  requestParams.sign = sign(signContent, config.privateKey);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(requestParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  return `${config.gateway}?${query.toString()}`;
}

export function verifyAlipayNotify(params: VerifyPayload) {
  const config = getConfig();
  const signature = params.sign || '';

  if (!signature) {
    return false;
  }

  const payload = { ...params };
  delete payload.sign;
  delete payload.sign_type;
  const signContent = buildSignContent(payload);
  return verify(signContent, signature, config.publicKey);
}

export function isAlipayTradeSuccess(status: string | null | undefined): status is AlipayTradeStatus {
  return status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED';
}
