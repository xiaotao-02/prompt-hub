import { PROVIDERS } from '../providers';
import type { AppSettings, ProviderId } from '../types';
import { looksLikePlaceholder } from './jsonHelpers';
import { mergeOneProvider } from './merge';
import { ENV_VAR_TO_PROVIDER } from './maps';
import type { ImportResult } from './types';

/** 裸粘贴密钥时的长度边界（启发式，略宽于常见厂商）。 */
const BARE_KEY_MIN_LEN = 12;
const BARE_KEY_MAX_LEN = 512;

type BareKeyHintKind = 'prefix' | 'env' | 'active';

function isProbablyApiKeyToken(s: string): boolean {
  const t = s.trim();
  if (t.length < BARE_KEY_MIN_LEN || t.length > BARE_KEY_MAX_LEN) return false;
  if (/[\s]/.test(t)) return false;
  if (/[{}[\]"]/.test(t)) return false;
  // 排除整段 URL（避免把 endpoint 误当 Key）
  if (/^https?:\/\//i.test(t)) return false;
  return true;
}

function stripQuotes(s: string): string {
  let t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/** `export FOO=bar` / `FOO=bar`；值部分去掉行尾 # 注释与引号 */
function parseEnvAssignmentLine(line: string): { name: string; value: string } | null {
  const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) return null;
  let v = m[2].trim();
  const hashIdx = v.search(/\s+#/);
  if (hashIdx >= 0) v = v.slice(0, hashIdx).trim();
  v = stripQuotes(v);
  if (!v) return null;
  return { name: m[1], value: v };
}

function tryAuthHeaderLine(line: string): string | null {
  let m = line.match(/^\s*Authorization:\s*Bearer\s+(\S+)/i);
  if (m) return m[1];
  m = line.match(/^\s*x-api-key:\s*(\S+)/i);
  if (m) return m[1];
  m = line.match(/^\s*x-goog-api-key:\s*(\S+)/i);
  if (m) return m[1];
  m = line.match(/^\s*Bearer\s+(\S+)$/i);
  if (m) return m[1];
  return null;
}

/**
 * `API Key: sk-...` / `密钥：...` — 仅在右侧 token Key 时采纳。
 */
function tryLabelColonKeyLine(line: string): string | null {
  const idx = line.indexOf(':');
  if (idx <= 0) return null;
  const left = line.slice(0, idx).trim();
  const right = line.slice(idx + 1).trim();
  if (!left || !right) return null;
  // 避免误伤 URL
  if (/^https?$/i.test(left)) return null;
  const tok = stripQuotes(right);
  if (isProbablyApiKeyToken(tok)) return tok;
  return null;
}

/**
 * 从原始粘贴块中提取「最像 API Key」的一段；无法提取则返回 null（交给 JSON 分支）。
 */
function extractBareApiKey(raw: string): { key: string; envVarName: string | null } | null {
  const trimmedBlock = raw.trim();
  const lines = trimmedBlock.split(/\r?\n/).map((l) => l.trim());
  const nonEmptyLines = lines.filter((l) => l.length > 0);
  const toScan = nonEmptyLines.length > 0 ? nonEmptyLines : [trimmedBlock];

  for (const line of toScan) {
    if (line.startsWith('#')) continue;

    const env = parseEnvAssignmentLine(line);
    if (env && isProbablyApiKeyToken(env.value)) {
      return { key: env.value, envVarName: env.name };
    }

    const hdr = tryAuthHeaderLine(line);
    if (hdr) {
      const k = stripQuotes(hdr);
      if (isProbablyApiKeyToken(k)) return { key: k, envVarName: null };
    }

    const labeled = tryLabelColonKeyLine(line);
    if (labeled) return { key: labeled, envVarName: null };

    const whole = stripQuotes(line);
    if (isProbablyApiKeyToken(whole)) return { key: whole, envVarName: null };
  }

  return null;
}

/** 按密钥形态推断厂商（特异性高的前缀优先）。启发式，不保证覆盖所有中转 key。 */
function matchProviderKeyPrefix(key: string): ProviderId | null {
  if (key.startsWith('sk-ant-api') || key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('sk-or-v1-')) return 'openrouter';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('sk-proj-') || key.startsWith('sk-svcacct-')) return 'openai';
  return null;
}

function resolveProviderForBareKey(
  key: string,
  envVarName: string | null,
  base: AppSettings,
): { pid: ProviderId; hintKind: BareKeyHintKind } | { error: string } {
  const fromPrefix = matchProviderKeyPrefix(key);
  if (fromPrefix) return { pid: fromPrefix, hintKind: 'prefix' };

  const fromEnv = envVarName ? ENV_VAR_TO_PROVIDER[envVarName.toUpperCase()] : undefined;
  if (fromEnv) return { pid: fromEnv, hintKind: 'env' };

  const active = base.activeProvider;
  if (active !== 'custom') return { pid: active, hintKind: 'active' };

  const customUrl = (base.providers.custom?.baseUrl || '').trim();
  const placeholder = PROVIDERS.custom.defaultBaseUrl;
  if (!customUrl || customUrl === placeholder) {
    return {
      error:
        '仅粘贴 API Key 时无法从密钥本身识别厂商，且当前为「自定义」且 baseUrl 仍为占位地址。\n' +
        '请先在下方「模型供应商」选中具体厂商后再粘贴 Key，或粘贴带 baseUrl 的 JSON / curl。',
    };
  }
  return { pid: 'custom', hintKind: 'active' };
}

/**
 * @returns 有结果则总是返回 ImportResult；无法判定为裸 Key 场景时返回 null 以继续尝试 JSON。
 */
export function tryImportBareApiKey(base: AppSettings, raw: string): ImportResult | null {
  const extracted = extractBareApiKey(raw);
  if (!extracted) return null;

  if (looksLikePlaceholder(extracted.key)) {
    return {
      ok: false,
      error:
        `已识别为单独的 API Key 输入，但内容看起来像占位符（示例密钥）。\n` +
        '请粘贴控制台中的真实 Key，或使用 JSON / curl 导入。',
    };
  }

  const resolved = resolveProviderForBareKey(extracted.key, extracted.envVarName, base);
  if ('error' in resolved) return { ok: false, error: resolved.error };

  const next = mergeOneProvider(base, resolved.pid, { apiKey: extracted.key });
  const meta = PROVIDERS[resolved.pid];
  let hint: string;
  if (resolved.hintKind === 'prefix') {
    hint = `已根据密钥格式识别为「${meta.label}」并写入默认官方端点。`;
  } else if (resolved.hintKind === 'env') {
    hint = `已根据变量名「${extracted.envVarName}」识别为「${meta.label}」并导入。`;
  } else {
    hint = `已写入当前选中的「${meta.label}」；未检测到专属密钥前缀时以您在下方的供应商选择为准。`;
  }
  return { ok: true, settings: next, hint };
}
