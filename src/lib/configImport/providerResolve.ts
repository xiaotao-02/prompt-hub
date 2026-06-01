import { PROVIDER_LIST } from '../providers';
import type { ProviderId } from '../types';
import { HOST_RULES, PROVIDER_ALIASES, VALID_IDS } from './maps';

/**
 * 把 NewAPI 渠道里粘出来的 url 归一化成 OpenAI 兼容的 baseUrl。
 *
 * - 站点根地址（pathname `/` 或空）自动补 `/v1`
 * - 已带路径段（如 `…/v1`、`…/api/paas/v4`、`…/compatible-mode/v1`）保持不动
 * - 大写 `/V1` / `/V2` 自动小写化
 *
 * 注意：仅 OpenAI 兼容协议适用。Anthropic / Gemini 各自有不同的 path 习惯，
 * 调用方应在 pid === anthropic / gemini 时绕过本函数。
 */
export function ensureOpenAIBase(raw: string): string {
  const trimmed = (raw || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/V(\d+)/g, '/v$1');
  try {
    const u = new URL(trimmed);
    if (u.pathname === '' || u.pathname === '/') {
      return `${u.origin}/v1`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * 按 hostname 关键字 / 全等映射，把外部 url 反推到一个内置 provider。
 *
 * 与"全等比较"相比，关键字子串匹配能识别用户搭建的反代域名，例如：
 *   - `gw.openrouter.example.com` → openrouter
 *   - `proxy.deepseek.tld`        → deepseek
 *
 * 匹配不到时返回 null，调用方可以回落到 `custom`。
 */
export function matchProviderByUrl(url: string): ProviderId | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  for (const rule of HOST_RULES) {
    if (host.includes(rule.keyword)) return rule.id;
  }
  // 兜底：和某个内置 provider 的 host 全等
  for (const p of PROVIDER_LIST) {
    if (p.id === 'custom') continue;
    try {
      const phost = new URL(p.defaultBaseUrl).hostname.toLowerCase();
      if (phost === host) return p.id;
    } catch {
      continue;
    }
  }
  return null;
}

/** 把 provider 字段写法（kimi / volcengine / silicon / Pixtral …）归一到内置 id。 */
export function resolveProviderAlias(raw: string): ProviderId | null {
  const k = (raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!k) return null;
  if (VALID_IDS.has(k as ProviderId)) return k as ProviderId;
  if (k in PROVIDER_ALIASES) return PROVIDER_ALIASES[k];
  // 再退一步：去掉常见后缀 `-api` / `-ai` 再试一次
  const stripped = k
    .replace(/[-_]?ai$/, '')
    .replace(/[-_]?api$/, '')
    .replace(/[-_]?official$/, '');
  if (stripped !== k) {
    if (VALID_IDS.has(stripped as ProviderId)) return stripped as ProviderId;
    if (stripped in PROVIDER_ALIASES) return PROVIDER_ALIASES[stripped];
  }
  return null;
}

/**
 * 把一个完整请求 URL 截断成 SDK 风格的 baseUrl。
 *
 * 主策略：找到 path 中最后一个版本号段（`/v1` / `/v2` / `/v1beta` / `/v3alpha` …），
 * 保留到该段为止。这条规则在主流厂商上都成立：
 *   - `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
 *     → `https://generativelanguage.googleapis.com/v1beta`
 *   - `https://api.openai.com/v1/chat/completions`     → `https://api.openai.com/v1`
 *   - `https://api.anthropic.com/v1/messages`          → `https://api.anthropic.com/v1`
 *   - `https://open.bigmodel.cn/api/paas/v4/chat/...`  → `https://open.bigmodel.cn/api/paas/v4`
 *   - `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
 *     → `https://dashscope.aliyuncs.com/compatible-mode/v1`
 *
 * 兜底策略：若 URL 中没有 vN 段（罕见），就从末尾开始剥常见 endpoint 关键字
 * （chat / messages / completions / embeddings …）直到剩下的部分像 base。
 */
export function trimUrlToVersionBase(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split('/').filter(Boolean);

    let lastIdx = -1;
    for (let i = 0; i < segs.length; i++) {
      if (/^v\d+(?:beta|alpha|preview)?$/i.test(segs[i])) lastIdx = i;
    }
    if (lastIdx >= 0) {
      const keep = segs.slice(0, lastIdx + 1).join('/');
      return `${u.origin}/${keep}`;
    }

    const ENDPOINT_SEGS = new Set([
      'chat',
      'completions',
      'messages',
      'embeddings',
      'responses',
      'images',
      'audio',
      'files',
      'fine_tuning',
      'fine-tuning',
      'moderations',
      'batches',
      'threads',
      'assistants',
      'generate',
      'generations',
      'rerank',
      'rerankings',
      'classify',
    ]);
    let cut = segs.length;
    while (cut > 0) {
      const tail = segs[cut - 1].toLowerCase().split(':')[0];
      if (ENDPOINT_SEGS.has(tail) || tail === 'models') {
        cut--;
        continue;
      }
      break;
    }
    const keep = segs.slice(0, cut).join('/');
    return keep ? `${u.origin}/${keep}` : u.origin;
  } catch {
    return url;
  }
}
