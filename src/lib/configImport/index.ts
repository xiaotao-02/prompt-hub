/**
 * 「一键配置」导入解析。
 *
 * 用户从各种来源粘进来的内容格式都不一样：
 *
 *   - **curl 命令**（厂商文档 / Playground 里最常见的复制对象）：
 *       curl https://api.openai.com/v1/chat/completions \
 *         -H "Authorization: Bearer sk-..." -H "Content-Type: application/json" \
 *         -d '{ "model": "gpt-4o-mini", ... }'
 *       Google Gemini 的 `X-goog-api-key` / Anthropic 的 `x-api-key` 同样适配。
 *
 *   - **JSON 配置串**，又分多种亚种：
 *       a. 本插件「复制当前配置」吐出的精简片段          { provider, apiKey, baseUrl, model }
 *       b. 本插件早期导出的完整 settings                 { providers: { openai: {...}, ... } }
 *       c. NewAPI / OneAPI / OneHub 渠道连接信息         { _type, key, url } 或字段名各异
 *       d. Cherry Studio / ChatBox / NextChat / LobeChat 的导出片段
 *       e. 用户从某家平台 Dashboard 复制的 .env 风格      { OPENAI_API_KEY: "...", OPENAI_BASE_URL: "..." }
 *       f. 嵌套了一层 wrapper                              { data: {...} } / { config: {...} }
 *
 * 这里把"格式识别 + 字段同义词归一化 + provider 模糊匹配"集中到一处，
 * 让 UI 层（ApiQuickSetup）只负责调用与展示提示。
 *
 * 设计原则：
 * 1. 宁可识别成 `custom` 也别报错 —— 用户已经把 Key 都贴进来了，强制让用户改
 *    JSON 再来一次的体验最差。
 * 2. 永远尝试根据 url 反推真实 provider，避免一律落到 `custom` 后用户还要再
 *    到下方「模型供应商」里手动切一次。
 * 3. 若已回落 `custom` 但配置里带有 **model** 字段，可用模型 id 做弱推断
 *    （见 `providerIdFromModel.ts`），减轻 NewAPI / 反代域名无法识别时误选「自定义」的问题。
 * 4. 错误信息要可读：粘了什么、解析到了什么字段、为什么仍然不行，都要点出来。
 */

import type { AppSettings } from '../types';
import { tryImportBareApiKey } from './bareKey';
import { tryParseCurl } from './curlParse';
import { importChannelConn } from './importModes/channelConn';
import { importMultiProvider } from './importModes/multiProvider';
import { importSingleProvider } from './importModes/singleProvider';
import { KEY_SYNONYMS } from './maps';
import { looksLikePlaceholder, pickFirst, softFixJson, unwrap } from './jsonHelpers';
import type { ImportResult } from './types';

export { matchProviderByModel } from '../providerIdFromModel';
export type { ImportResult } from './types';
export {
  ensureOpenAIBase,
  matchProviderByUrl,
  resolveProviderAlias,
  trimUrlToVersionBase,
} from './providerResolve';

/**
 * 解析任意配置文本（JSON 或 curl 命令）并合并到现有 AppSettings。
 *
 * 这是 UI 层最希望调用的"开盒即用"接口：拿到字符串、给我下一份 settings 或一句
 * 人话错误。内部按以下顺序尝试：
 *
 *   0. 文本以 `curl` 开头？解析为标准片段 { provider, apiKey, baseUrl, model }
 *   0.5 看似裸 API Key（非 JSON 顶层）？单行 / Bearer / .env / 多行取首条
 *   1. JSON.parse；失败时尝试容忍尾逗号 / 单引号等常见手抖
 *   2. 顶层 unwrap（剥掉 `data` / `config` / `settings` / `result` 这层壳）
 *   3. 如果是数组 → 取第一项 / 第一项有 apiKey 的
 *   4. 三种模式分发：单 provider / 多 provider / NewAPI 渠道连接
 *   5. 都不像？只要找得到 apiKey 就走"按 url 反推 provider 的兜底"
 */
export function importFromText(base: AppSettings, raw: string): ImportResult {
  const text = (raw || '').trim();
  if (!text) {
    return { ok: false, error: '请先粘贴 API Key、一段 JSON 配置或 curl 命令。' };
  }

  // —— 0. curl 命令（厂商文档最常见的复制对象）
  if (/^\s*curl\b/i.test(text)) {
    const curlObj = tryParseCurl(text);
    if (!curlObj) {
      return {
        ok: false,
        error:
          '识别到 curl 命令，但未能从中解析出 API Key。\n' +
          '请确认命令包含以下任一鉴权字段：\n' +
          '  · Authorization: Bearer <key>（OpenAI / DeepSeek / 千问 等）\n' +
          '  · x-api-key: <key>（Anthropic Claude）\n' +
          '  · X-goog-api-key: <key>（Google Gemini）\n' +
          '  · URL 参数 ?key=<key>',
      };
    }
    if (looksLikePlaceholder(String(curlObj.apiKey || ''))) {
      return {
        ok: false,
        error:
          `已从 curl 中解析出 API Key，但它看起来是占位符（"${curlObj.apiKey}"）。\n` +
          '请把命令里的 $YOUR_API_KEY / <YOUR_KEY> 替换为真实 Key 后再导入。',
      };
    }
    return applyImportedConfig(base, curlObj);
  }

  // —— 0.5 裸 API Key（单行粘贴 / Bearer / .env 一行 / 多行里取第一条像 Key 的内容）
  const trimmedStart = text.trimStart();
  if (!trimmedStart.startsWith('{') && !trimmedStart.startsWith('[')) {
    const bare = tryImportBareApiKey(base, text);
    if (bare) return bare;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // 常见手抖：单引号、尾逗号
    try {
      parsed = JSON.parse(softFixJson(text));
    } catch (e) {
      return {
        ok: false,
        error: `JSON 解析失败：${e instanceof Error ? e.message : String(e)}\n（可粘贴单独 API Key；若粘贴 curl 请确保以 "curl " 开头）`,
      };
    }
  }

  const obj = unwrap(parsed);
  if (!obj || typeof obj !== 'object') {
    return { ok: false, error: 'JSON 顶层必须是对象、数组或常见 wrapper 之一。' };
  }

  return applyImportedConfig(base, obj as Record<string, unknown>);
}

/**
 * 合并已经 parse 完的对象。ApiQuickSetup 之外（例如未来 popup 的导入入口）也可以
 * 直接调用这个版本。
 */
export function applyImportedConfig(base: AppSettings, raw: Record<string, unknown>): ImportResult {
  // —— 1. NewAPI / OneAPI 「渠道连接」信息（保留 _type 显式判别 + 字段宽松）
  if (raw._type === 'newapi_channel_conn' || raw._type === 'oneapi_channel_conn') {
    return importChannelConn(base, raw);
  }

  // —— 2. 多 provider 整体（providers 为对象 map 或数组）
  if (raw.providers && (typeof raw.providers === 'object' || Array.isArray(raw.providers))) {
    return importMultiProvider(base, raw);
  }

  // —— 3. 顶层就是数组（一些导出是 `[ {provider, apiKey, ...}, {...} ]`）
  if (Array.isArray(raw)) {
    const first = (raw as unknown[]).find(
      (x) =>
        x && typeof x === 'object' && pickFirst(x as Record<string, unknown>, KEY_SYNONYMS.apiKey),
    );
    if (first) return applyImportedConfig(base, first as Record<string, unknown>);
    return { ok: false, error: 'JSON 是数组，但其中没有任何带 apiKey 的对象。' };
  }

  // —— 4. 单 provider 片段（最常见）
  return importSingleProvider(base, raw);
}
