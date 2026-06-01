import { matchProviderByUrl, trimUrlToVersionBase } from './providerResolve';

/**
 * 把一段 curl 命令解析成「单 provider 导入片段」对象，可以直接交给
 * {@link applyImportedConfig} 走后续的 provider 识别 / 合并流程。
 *
 * 支持：
 *   - 多行续行：bash `\` / PowerShell 反引号 ` / cmd `^`
 *   - 引号风格：单引号 / 双引号 / 无引号；双引号内识别 `\"` 转义
 *   - Header：`-H "K: V"` / `--header 'K: V'`
 *   - URL：第一个非选项的 https 串，或显式 `--url`
 *   - 鉴权（按优先级）：Authorization Bearer → Authorization → X-Api-Key →
 *     X-Goog-Api-Key → URL 参数 ?key= / ?api-key=
 *   - 模型：Gemini 从 URL `/models/<m>:<verb>` 取；OpenAI/Anthropic 从 body 的 `model` 字段取
 *
 * 解析失败（缺 url / 缺 key）返回 null，让调用方走 JSON 兜底或报错。
 */
export function tryParseCurl(text: string): Record<string, unknown> | null {
  // 先把各种续行方式都合并成单行，避免 shell 词法器要处理换行。
  const joined = text
    .replace(/\\\r?\n/g, ' ')
    .replace(/`\r?\n/g, ' ')
    .replace(/\^\r?\n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();
  const tokens = tokenizeShell(joined);
  if (!tokens.length || !/^curl$/i.test(tokens[0])) return null;

  let url = '';
  const headers: Record<string, string> = {};
  let body = '';

  // 这些选项后面会跟一个值，需要跳过一格避免被当成 URL。
  const VALUE_OPTS = new Set([
    '-X',
    '--request',
    '-u',
    '--user',
    '-b',
    '--cookie',
    '-A',
    '--user-agent',
    '-e',
    '--referer',
    '-o',
    '--output',
    '--cacert',
    '--cert',
    '--key',
    '--proxy',
    '-x',
    '--connect-timeout',
    '--max-time',
    '--resolve',
    '--cookie-jar',
  ]);

  for (let i = 1; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk === '-H' || tk === '--header') {
      const v = tokens[++i] ?? '';
      const colon = v.indexOf(':');
      if (colon > 0) {
        headers[v.slice(0, colon).trim().toLowerCase()] = v.slice(colon + 1).trim();
      }
    } else if (
      tk === '-d' ||
      tk === '--data' ||
      tk === '--data-raw' ||
      tk === '--data-binary' ||
      tk === '--data-ascii' ||
      tk === '--data-urlencode'
    ) {
      body = tokens[++i] ?? '';
    } else if (tk === '--url') {
      url = tokens[++i] ?? '';
    } else if (VALUE_OPTS.has(tk)) {
      i++; // 跳过一个值
    } else if (tk.startsWith('-')) {
      // 其它布尔/未知短选项：忽略
      continue;
    } else if (!url && /^https?:\/\//i.test(tk)) {
      url = tk;
    }
  }

  if (!url) return null;

  // —— 1. 鉴权提取
  let apiKey = '';
  const auth = headers['authorization'];
  if (auth) {
    const m = /^bearer\s+(.+)$/i.exec(auth);
    apiKey = (m ? m[1] : auth).trim();
  }
  if (!apiKey) {
    apiKey =
      headers['x-goog-api-key'] ||
      headers['x-api-key'] ||
      headers['api-key'] ||
      headers['x-auth-token'] ||
      '';
  }

  // —— 2. URL 查询参数里的 key（Google 老风格）+ 把 key 参数清掉用于后续切 baseUrl
  let cleanUrl = url;
  try {
    const u = new URL(url);
    if (!apiKey) {
      apiKey =
        u.searchParams.get('key') ||
        u.searchParams.get('api-key') ||
        u.searchParams.get('apikey') ||
        u.searchParams.get('access_token') ||
        '';
    }
    u.searchParams.delete('key');
    u.searchParams.delete('api-key');
    u.searchParams.delete('apikey');
    u.searchParams.delete('access_token');
    cleanUrl = u.toString();
  } catch {
    /* 不是合法 URL 就保持原样，下面 trim 也能容错 */
  }

  if (!apiKey) return null;

  const pid = matchProviderByUrl(cleanUrl);
  const baseUrl = trimUrlToVersionBase(cleanUrl);

  // —— 3. model 提取
  let model = '';
  // Gemini: /v1beta/models/<model>:<verb>
  const geminiModel = /\/models\/([^/:?]+)(?::|$|\/)/i.exec(cleanUrl);
  if (geminiModel) model = geminiModel[1];
  // OpenAI / Anthropic / 其它 OpenAI 兼容：从 body JSON 里读 model
  if (!model && body) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const m = (parsed as Record<string, unknown>).model;
        if (typeof m === 'string' && m.trim()) model = m.trim();
      }
    } catch {
      /* body 不是 JSON 就放弃，不影响其它字段 */
    }
  }

  const out: Record<string, unknown> = { apiKey };
  if (baseUrl) out.baseUrl = baseUrl;
  if (model) out.model = model;
  if (pid) out.provider = pid;
  return out;
}

/**
 * 朴素的 POSIX shell 词法器：识别单引号 / 双引号 / 反斜杠转义，把命令行切成 token 数组。
 *
 * 仅覆盖 curl 命令里出现的写法，不实现变量展开 / glob / 重定向等更复杂的语法。
 */
function tokenizeShell(line: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let started = false; // 用来区分"空 token"和"空引号字符串"
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) {
        quote = null;
        continue;
      }
      // 仅在双引号内识别反斜杠转义（单引号内一切原样保留，POSIX 行为）
      if (quote === '"' && c === '\\' && i + 1 < line.length) {
        cur += line[++i];
        continue;
      }
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      started = true;
      continue;
    }
    if (c === '\\' && i + 1 < line.length) {
      cur += line[++i];
      started = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (started) tokens.push(cur);
      cur = '';
      started = false;
      continue;
    }
    cur += c;
    started = true;
  }
  if (started) tokens.push(cur);
  return tokens;
}
