/**
 * OpenAI Chat Completions 兼容协议。
 *
 * 覆盖：OpenAI 官方、智谱 GLM、通义 Qwen-VL、SiliconFlow、数科隆达、自定义。
 * 三家协议里它最常用，同时提供「视觉反推（流式）」和「文本 refine（流式）」两个调用方式。
 */
import type { ProviderConfig } from '../../types';
import type { FetchedImage } from '../../image';
import type { PromptStrategy } from '../../strategies';
import {
  REFINE_FETCH_TIMEOUT_MESSAGE,
  STREAM_FLUSH_INTERVAL_MS,
  describeRespFailure,
  isRefineFetchTimeoutError,
  isSseResponse,
  parseJsonResponse,
  readSseDataChunks,
  refineFetchAbortSignal,
} from '../http';
import { normalizeOpenAIBase } from '../url';
import {
  emitBufferedExtractProgress,
  emitBufferedRefineProgress,
  revealBufferedExtractProgress,
  revealBufferedRefineProgress,
  safeProgress,
  safeRefineProgress,
  type ExtractProgressFn,
  type RefineProgressFn,
} from '../types';

/** MiniMax M2.x：请求体拆分思考链，避免内联进 `delta.content`。仅 `id=minimax`，免误伤严格校验的其他厂商。 */
function minimaxReasoningSplitExtras(
  cfg: ProviderConfig,
): { reasoning_split: true } | Record<string, never> {
  if (cfg.id !== 'minimax') return {};
  if (!/^MiniMax-M2/i.test(cfg.model.trim())) return {};
  return { reasoning_split: true };
}

/** `reasoning_split` 未生效或旧网关仍内联思考时的兜底：去掉整段 redacted 思考块。 */
function stripRedactedThinking(text: string): string {
  const re = /<think>[\s\S]*?<\/redacted_thinking>/gi;
  return text.replace(re, '').trim();
}

/** 前置强约束（长策略下避免模型忽略末尾后缀）；仅发往 MiniMax API。 */
const MINIMAX_VISION_CONSTRAINT_PREFIX =
  '【多模态必读】本条 user 消息的 content 中已通过 image_url 附带参考图的像素（data URL）；请先把这些像素视为已提供的图像输入，必须先读图再输出。不得以任何理由声称「没看到图」「没有附带图片」「无法查看图像」。';

/** 句末再强调禁止 refusal 套话；与 PREFIX 合用，抵消长指令对约束的冲淡。仅发往 MiniMax API。 */
const MINIMAX_VISION_CONSTRAINT_SUFFIX =
  '\n\n【系统约束】同上：你必须直接依据这些 image_url 中的画面完成上文全部任务要求。禁止使用「请先上传」「我这边还没有看到图片」「抱歉，我未能看到附带的图片」「无法根据画面内容生成」「无法生成相应的提示词」等推脱或致歉类措辞；也不得要求用户另行上传。';

/** 发往模型的文本部分：`minimax` + 有图时为 PREFIX + 策略 instruction + SUFFIX（非 minimax、无图则原样返回）。 */
function effectiveMultimodalInstruction(
  cfg: ProviderConfig,
  imgs: FetchedImage[],
  instruction: string,
): string {
  if (cfg.id !== 'minimax' || imgs.length === 0) return instruction;
  return `${MINIMAX_VISION_CONSTRAINT_PREFIX}\n\n${instruction}${MINIMAX_VISION_CONSTRAINT_SUFFIX}`;
}

type OpenAIMultimodalPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/**
 * OpenAI 兼容多模态 user.content。
 * MiniMax：有图时 **先 image 后 text**（部分实现对方块顺序敏感）；其它厂商保持「文+图」。
 */
function buildOpenAIMultimodalUserContent(
  cfg: ProviderConfig,
  imgs: FetchedImage[],
  instruction: string,
): OpenAIMultimodalPart[] {
  const text = effectiveMultimodalInstruction(cfg, imgs, instruction);
  const imageParts: OpenAIMultimodalPart[] = imgs.map((img) => ({
    type: 'image_url',
    image_url: { url: img.dataUrl },
  }));
  const textPart: OpenAIMultimodalPart = { type: 'text', text };

  if (cfg.id === 'minimax' && imgs.length > 0) {
    return [...imageParts, textPart];
  }
  return [textPart, ...imageParts];
}

/** 拍平 OpenAI 风格 message.content / delta.content（字符串或多模态数组）。 */
function extractOpenAIContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c?.type === 'text' && c?.text ? c.text : '')).join('');
  }
  return '';
}

/** OpenAI 兼容流式单个 chunk 里的 `choices[0].delta`（MiniMax 额外带 `reasoning_details`）。 */
type OpenAIStreamDelta = {
  content?: string | Array<{ type?: string; text?: string }>;
  /** MiniMax `reasoning_split`：思考过程常在此递增，正式答案多在 `content`（可能晚很多才有字） */
  reasoning_details?: unknown;
};

/**
 * MiniMax 流式里 `reasoning_details` 多为累计 `text`；取最后一个非空 `text` 作为当前快照。
 */
function extractMiniMaxReasoningDeltaText(details: unknown): string {
  if (!Array.isArray(details)) return '';
  let last = '';
  for (const d of details) {
    if (d && typeof d === 'object' && 'text' in d) {
      const t = (d as { text?: string }).text;
      if (typeof t === 'string' && t.length > 0) last = t;
    }
  }
  return last;
}

export type OpenAISseAcc = {
  /** 发给面板的 partial：minimax 在无 content 时可退化为 reasoning 预览 */
  partialRaw: string;
  /** 最终返回值：minimax 仅用 `delta.content` 快照；不得混入 reasoning */
  answerRaw: string;
};

export type OpenAIStreamDeltaOptions = {
  /**
   * MiniMax M2 `reasoning_split` 时是否把思考链写入 partial。
   * extract 默认 true；refine 传 false，避免主编辑器闪出「修改要点」类思考文案。
   */
  exposeReasoningInPartial?: boolean;
};

/** `applyOpenAIStreamDelta` 返回值：无变化 / 仅 reasoning（未写入 partial）/ 已更新 partial 或 content */
export type OpenAIStreamDeltaResult = false | 'reasoning_only' | true;

/**
 * OpenAI 兼容流式：`delta.content` 与其它厂商为逐块增量 `+=`；
 * Minimax 的 `delta.content` 为**累计全文**覆盖；若长期只有 `reasoning_details` 则需用其驱动 partial。
 */
export function applyOpenAIStreamDelta(
  cfg: ProviderConfig,
  acc: OpenAISseAcc,
  delta: OpenAIStreamDelta | undefined,
  options?: OpenAIStreamDeltaOptions,
): OpenAIStreamDeltaResult {
  if (!delta) return false;
  const contentPiece = extractOpenAIContent(delta.content);
  const reasoningPiece = extractMiniMaxReasoningDeltaText(delta.reasoning_details);
  const exposeReasoning = options?.exposeReasoningInPartial !== false;

  if (cfg.id === 'minimax') {
    if (contentPiece) {
      acc.answerRaw = contentPiece;
      acc.partialRaw = contentPiece;
      return true;
    }
    if (reasoningPiece) {
      if (exposeReasoning) {
        acc.partialRaw = reasoningPiece;
        return true;
      }
      return 'reasoning_only';
    }
    return false;
  }

  if (!contentPiece) return false;
  acc.answerRaw += contentPiece;
  acc.partialRaw += contentPiece;
  return true;
}

export async function callOpenAICompatible(
  cfg: ProviderConfig,
  imgs: FetchedImage[],
  instruction: string,
  strategy: PromptStrategy,
  onProgress?: ExtractProgressFn,
  signal?: AbortSignal,
): Promise<string> {
  // 大部分兼容 OpenAI 的服务端都接受 url 形式的 image_url，
  // 但跨域 + 鉴权 + base64 更稳妥，这里统一转 base64。
  const url = `${normalizeOpenAIBase(cfg.baseUrl)}/chat/completions`;

  const content = buildOpenAIMultimodalUserContent(cfg, imgs, instruction);

  const body = {
    model: cfg.model,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
    temperature: strategy.temperature,
    max_tokens: strategy.maxTokens,
    stream: true,
    ...minimaxReasoningSplitExtras(cfg),
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  if (!resp.ok) {
    throw new Error(await describeRespFailure(resp, 'API'));
  }

  // 少数兼容端不真正支持 stream，会忽略 stream:true 直接回 JSON。
  // 这里按 content-type 判断，是 SSE 就走流式累积，否则当作 JSON 解析。
  if (!isSseResponse(resp)) {
    emitBufferedExtractProgress(onProgress);
    const json = await parseJsonResponse<{
      choices?: Array<{
        message?: { content?: string | Array<{ type?: string; text?: string }> };
      }>;
    }>(resp, 'API');
    const content = json?.choices?.[0]?.message?.content;
    const final = stripRedactedThinking(extractOpenAIContent(content));
    if (!final.trim()) throw new Error('返回内容为空，请检查模型是否支持视觉输入');
    await revealBufferedExtractProgress(onProgress, final, signal);
    return final;
  }

  const acc: OpenAISseAcc = { partialRaw: '', answerRaw: '' };
  let lastFlushAt = 0;
  let sawFirstChunk = false;
  for await (const data of readSseDataChunks(resp)) {
    if (data === '[DONE]') break;
    let json: { choices?: Array<{ delta?: OpenAIStreamDelta }> };
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    const deltaObj = json.choices?.[0]?.delta;
    if (applyOpenAIStreamDelta(cfg, acc, deltaObj) !== true) continue;
    const partialOut = stripRedactedThinking(acc.partialRaw);
    if (!sawFirstChunk) {
      sawFirstChunk = true;
      safeProgress(onProgress, { stage: 'streaming', partial: partialOut });
      lastFlushAt = Date.now();
      continue;
    }
    const now = Date.now();
    if (now - lastFlushAt >= STREAM_FLUSH_INTERVAL_MS) {
      lastFlushAt = now;
      safeProgress(onProgress, { stage: 'streaming', partial: partialOut });
    }
  }
  const out = stripRedactedThinking(acc.answerRaw);
  if (!out.trim()) throw new Error('返回内容为空，请检查模型是否支持视觉输入');
  // 收尾用正式答案刷新面板（minimax 在思考预览后应切到 content-only）
  safeProgress(onProgress, { stage: 'streaming', partial: out });
  return out;
}

/**
 * OpenAI 兼容协议的「纯文本」调用（用于 refine 链路）。
 *
 * 与 callOpenAICompatible 区别：
 *   - 不带 image_url
 *   - temperature 固定 0.7，强度无关 strategy（refine 的"调子"由 prompt 控制）
 *
 * 始终请求 stream:true + SSE；onProgress 仅控制是否向 UI 转发进度。
 */
export async function callOpenAICompatibleText(
  cfg: ProviderConfig,
  system: string,
  user: string,
  onProgress?: RefineProgressFn,
): Promise<string> {
  const url = `${normalizeOpenAIBase(cfg.baseUrl)}/chat/completions`;
  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
    ...minimaxReasoningSplitExtras(cfg),
  };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
    Accept: 'text/event-stream',
  };
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: refineFetchAbortSignal(),
    });
  } catch (err) {
    if (isRefineFetchTimeoutError(err)) {
      throw new Error(REFINE_FETCH_TIMEOUT_MESSAGE);
    }
    throw err;
  }
  if (!resp.ok) {
    throw new Error(await describeRespFailure(resp, 'API'));
  }

  if (onProgress) {
    safeRefineProgress(onProgress, { stage: 'streaming' });
  }

  // 中转节点忽略 stream:true 的退化场景：直接 JSON 解析并告知 UI。
  if (!isSseResponse(resp)) {
    emitBufferedRefineProgress(onProgress);
    const json = await parseJsonResponse<{
      choices?: Array<{
        message?: { content?: string | Array<{ type?: string; text?: string }> };
      }>;
    }>(resp, 'API');
    const content = json?.choices?.[0]?.message?.content;
    const final = stripRedactedThinking(extractOpenAIContent(content));
    if (!final.trim()) throw new Error('返回内容为空');
    await revealBufferedRefineProgress(onProgress, final);
    return final;
  }

  const acc: OpenAISseAcc = { partialRaw: '', answerRaw: '' };
  const streamOpts: OpenAIStreamDeltaOptions = { exposeReasoningInPartial: false };
  let lastFlushAt = 0;
  let sawFirstPartial = false;
  let emittedThinkingStage = false;
  for await (const data of readSseDataChunks(resp)) {
    if (data === '[DONE]') break;
    let json: { choices?: Array<{ delta?: OpenAIStreamDelta }> };
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    const deltaObj = json.choices?.[0]?.delta;
    const deltaResult = applyOpenAIStreamDelta(cfg, acc, deltaObj, streamOpts);
    if (deltaResult === 'reasoning_only') {
      if (!emittedThinkingStage) {
        emittedThinkingStage = true;
        safeRefineProgress(onProgress, { stage: 'streaming' });
      }
      continue;
    }
    if (!deltaResult) continue;
    const partialOut = stripRedactedThinking(acc.partialRaw);
    if (!sawFirstPartial) {
      sawFirstPartial = true;
      safeRefineProgress(onProgress, { stage: 'streaming', partial: partialOut });
      lastFlushAt = Date.now();
      continue;
    }
    const now = Date.now();
    if (now - lastFlushAt >= STREAM_FLUSH_INTERVAL_MS) {
      lastFlushAt = now;
      safeRefineProgress(onProgress, { stage: 'streaming', partial: partialOut });
    }
  }
  const out = stripRedactedThinking(acc.answerRaw);
  if (!out.trim()) throw new Error('返回内容为空');
  safeRefineProgress(onProgress, { stage: 'streaming', partial: out });
  return out;
}
