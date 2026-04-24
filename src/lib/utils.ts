export function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(value);
}

export function formatBeijingDateTime(value: string | number | Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

export function resolveSiteUrl(options?: {
  configuredSiteUrl?: string | null;
  host?: string | null;
  protocol?: string | null;
}) {
  const configuredSiteUrl = (options?.configuredSiteUrl || '').trim().replace(/\/$/, '');
  const host = (options?.host || '').trim();
  const protocol = (options?.protocol || '').trim() || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const requestOrigin = host ? `${protocol}://${host}`.replace(/\/$/, '') : '';

  if (!configuredSiteUrl) {
    return requestOrigin;
  }

  const configuredIsLocal = /localhost|127\.0\.0\.1/.test(configuredSiteUrl);
  const requestIsLocal = /localhost|127\.0\.0\.1/.test(requestOrigin);

  if (configuredIsLocal && requestIsLocal && requestOrigin) {
    return requestOrigin;
  }

  return configuredSiteUrl;
}
