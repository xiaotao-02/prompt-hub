import { formatUsd } from '../format';
import type { ProviderQuotaSnapshot, QuotaAdapterContext } from '../types';
import {
  baseSnapshot,
  errorSnapshot,
  fetchJson,
  resolveOrigin,
  unsupportedSnapshot,
} from './helpers';

/** New API 默认：500_000 内部单位 ≈ $1（与控制台美元展示一致） */
export const NEWAPI_QUOTA_PER_USD = 500_000;

const SHUKELONGDA_DEFAULT_ORIGIN = 'https://ai.shukelongda.cn';

interface NewapiTokenUsage {
  name?: string;
  total_granted?: number;
  total_used?: number;
  total_available?: number;
  unlimited_quota?: boolean;
  expires_at?: number;
}

export interface NewapiTokenQuotaOptions {
  /** baseUrl 缺失或解析失败时的回退 origin */
  defaultOrigin: string;
  /** true：404 / 响应格式异常 → unsupported；false：→ error */
  softUnsupported?: boolean;
}

function quotaToUsd(units: number): number {
  return units / NEWAPI_QUOTA_PER_USD;
}

function parseErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const msg = (data as { message?: string }).message;
  return typeof msg === 'string' ? msg : undefined;
}

function formatMismatch(ctx: QuotaAdapterContext, soft: boolean): ProviderQuotaSnapshot {
  return soft ? unsupportedSnapshot(ctx) : errorSnapshot(ctx, '响应格式异常');
}

/** NewAPI / OneAPI 类中转：`GET {origin}/api/usage/token` */
export async function fetchNewapiTokenQuotaCore(
  ctx: QuotaAdapterContext,
  options: NewapiTokenQuotaOptions,
): Promise<ProviderQuotaSnapshot> {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const origin = resolveOrigin(ctx.baseUrl, options.defaultOrigin);
  const res = await fetchJson(`${origin}/api/usage/token`, ctx.apiKey.trim());
  const soft = options.softUnsupported === true;

  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    if (res.status === 404) {
      return soft ? unsupportedSnapshot(ctx) : errorSnapshot(ctx, '暂不支持插件内查询');
    }

    try {
      const errBody = JSON.parse(res.text) as unknown;
      const msg = parseErrorMessage(errBody);
      if (msg?.toLowerCase().includes('token not found')) {
        return errorSnapshot(ctx, '令牌不存在或已删除');
      }
      if (msg) return errorSnapshot(ctx, msg);
    } catch {
      // ignore parse failure
    }

    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  const root = res.data as { code?: boolean; success?: boolean; data?: NewapiTokenUsage };
  const d = root.data;
  if (!d) return formatMismatch(ctx, soft);

  if (d.unlimited_quota) {
    const namePart = d.name ? `${d.name} · ` : '';
    const used =
      d.total_used != null && Number.isFinite(d.total_used)
        ? `已用 ${formatUsd(quotaToUsd(d.total_used))}`
        : undefined;
    return baseSnapshot(ctx, {
      status: 'ok',
      label: '无限额度',
      detail: used ? `${namePart}${used}` : d.name,
    });
  }

  const available = d.total_available;
  const granted = d.total_granted;
  const used = d.total_used;

  if (available == null || !Number.isFinite(available)) {
    return formatMismatch(ctx, soft);
  }

  const remainingUsd = quotaToUsd(available);
  const grantedUsd = granted != null && Number.isFinite(granted) ? quotaToUsd(granted) : undefined;
  const usedUsd =
    used != null && Number.isFinite(used)
      ? quotaToUsd(used)
      : grantedUsd != null
        ? quotaToUsd(Math.max(0, (granted ?? 0) - available))
        : undefined;

  const detailParts: string[] = [];
  if (usedUsd != null && grantedUsd != null) {
    detailParts.push(`已用 ${formatUsd(usedUsd)} / 限额 ${formatUsd(grantedUsd)}`);
  } else if (grantedUsd != null) {
    detailParts.push(`限额 ${formatUsd(grantedUsd)}`);
  }
  if (d.name) detailParts.push(d.name);

  return baseSnapshot(ctx, {
    status: 'ok',
    label: formatUsd(remainingUsd),
    detail: detailParts.length > 0 ? detailParts.join(' · ') : undefined,
    lowBalance: available < NEWAPI_QUOTA_PER_USD,
  });
}

export async function fetchNewapiTokenQuota(ctx: QuotaAdapterContext) {
  return fetchNewapiTokenQuotaCore(ctx, {
    defaultOrigin: SHUKELONGDA_DEFAULT_ORIGIN,
    softUnsupported: false,
  });
}
