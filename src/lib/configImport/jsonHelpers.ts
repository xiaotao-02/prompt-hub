import { KEY_SYNONYMS } from './maps';

export function buildLowerMap(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k.toLowerCase()] = v;
  }
  return out;
}

/**
 * 在对象 raw 上按一组同义词键名找出第一个非空字符串值。
 *
 * 大小写不敏感（key 比较时统一小写），并且会顺便去掉首尾空白。
 */
export function pickStr(raw: Record<string, unknown>, keys: string[]): string {
  const lowerMap = buildLowerMap(raw);
  for (const k of keys) {
    const v = lowerMap[k.toLowerCase()];
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

export function pickFirst(raw: Record<string, unknown>, keys: string[]): unknown {
  const lowerMap = buildLowerMap(raw);
  for (const k of keys) {
    const v = lowerMap[k.toLowerCase()];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/**
 * 修最常见的两类手抖 JSON：
 *   - 单引号字符串：`{ 'key': 'value' }` → `{ "key": "value" }`
 *   - 末尾多逗号：`{ "a": 1, }` → `{ "a": 1 }`
 *
 * 不追求覆盖所有非法 JSON，仅作"善意尽力"补救，目的是让大量从聊天 / 文档里
 * 复制出来的近似 JSON 也能成功导入。修不动就让上层报原始 JSON.parse 错误。
 */
export function softFixJson(s: string): string {
  let t = s.trim();
  // 把单引号的对象/字符串转成双引号（粗略）。注意：会破坏字符串字面里真正的单引号，
  // 但对绝大多数 API key / url 没影响。
  if (!t.startsWith('{') && !t.startsWith('[')) return t;
  if (/'/.test(t) && !/"/.test(t)) {
    t = t.replace(/'/g, '"');
  }
  // 删除对象/数组结尾多余逗号
  t = t.replace(/,(\s*[}\]])/g, '$1');
  return t;
}

/**
 * 粗判一个 Key 是否像 shell / 文档里的占位符（让 UI 提示用户替换，而不是默默存进去）。
 * 不做夸张匹配，只覆盖最常见的几种写法：`$XXX` / `<...>` / `YOUR_*_KEY` / `sk-xxxx`（全 x）。
 */
export function looksLikePlaceholder(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  if (k.startsWith('$')) return true;
  if (k.startsWith('<') && k.endsWith('>')) return true;
  if (/^(your|my|example|placeholder)[_-]/i.test(k)) return true;
  if (/^sk-x{4,}$/i.test(k)) return true;
  if (/^x{6,}$/i.test(k)) return true;
  return false;
}

/**
 * 剥掉常见的"包装层"，让 raw 指向真正的配置对象。
 *
 * 例如：
 *   { data: { provider: ..., apiKey: ... } }    → { provider, apiKey, ... }
 *   { config: {...} } / { settings: {...} } 同理
 *
 * 有些客户端会再包一层 `result.data`，所以最多向下钻 3 层避免死循环。
 */
export function unwrap(parsed: unknown): unknown {
  let cur: unknown = parsed;
  for (let i = 0; i < 3; i++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    // 对象本身已经像配置（含 apiKey 同义词或 providers / _type）就停止
    if (pickFirst(obj, KEY_SYNONYMS.apiKey) !== undefined || 'providers' in obj || '_type' in obj) {
      return obj;
    }
    const nextKey = ['data', 'config', 'settings', 'result', 'payload'].find(
      (k) => Object.prototype.hasOwnProperty.call(obj, k) && obj[k] && typeof obj[k] === 'object',
    );
    if (!nextKey) break;
    cur = obj[nextKey];
  }
  return cur;
}
