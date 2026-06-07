/**
 * 拉取 provider 的模型列表（GET /models）。
 *
 * 大多数中转 / 官方端点都暴露了 `GET /models` 接口，用来枚举该 Key 下可用的模型 id。
 * 这里按 provider 类型走对应的协议；返回去重 + 分组新→旧排序后的列表及识图标注。
 */
import { buildVisionById } from '../modelVision';
import type { ModelVisionSupport } from '../modelVision';
import { resolveProviderApiKey } from '../api/resolveProviderApiKey';
import type { ProviderConfig, ProviderId } from '../types';
import { sortModelsGroupedNewestFirst, type ModelListEntry } from './modelSort';
import { describeRespFailure, parseJsonResponse } from './http';
import { normalizeOpenAIBase, trimSlash } from './url';

export interface ModelListResult {
  ids: string[];
  visionById: Record<string, ModelVisionSupport>;
  /** 含 created 的原始条目，供自动推荐排序使用 */
  entries: ModelListEntry[];
  /** 去重后的 owned_by，供 Provider 推断用 */
  ownedByValues?: string[];
}

interface OpenRouterModelRow {
  id?: string;
  name?: string;
  created?: number;
  owned_by?: string;
  architecture?: { input_modalities?: string[] };
  /** 平台聚合 API 扩展字段 */
  vision?: boolean | null;
  upstream?: string;
  upstreamLabel?: string;
}

export async function listModels(
  cfg: ProviderConfig,
  providerId: ProviderId,
): Promise<ModelListResult> {
  if (!cfg.baseUrl) throw new Error('请先填写 Base URL');

  const cfgWithKey = { ...cfg, apiKey: await resolveProviderApiKey(providerId, cfg) };

  if (providerId === 'gemini') {
    if (!cfgWithKey.apiKey) throw new Error('请先填写 API Key');
    const url = `${trimSlash(cfgWithKey.baseUrl)}/models?key=${encodeURIComponent(cfgWithKey.apiKey)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(await describeRespFailure(resp, 'Gemini'));
    const json = await parseJsonResponse<{
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    }>(resp, 'Gemini');
    const list = (json.models ?? [])
      .filter(
        (m) =>
          !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'),
      )
      .map((m) => (m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
    const ids = sortModelsGroupedNewestFirst(list.map((id) => ({ id })));
    return {
      ids,
      visionById: buildVisionById(providerId, ids),
      entries: list.map((id) => ({ id })),
    };
  }

  const baseUrl =
    providerId === 'anthropic'
      ? trimSlash(cfgWithKey.baseUrl)
      : normalizeOpenAIBase(cfgWithKey.baseUrl);
  const url = `${baseUrl}/models`;
  const headers: Record<string, string> = {};
  if (providerId === 'anthropic') {
    headers['x-api-key'] = cfgWithKey.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (cfgWithKey.apiKey) {
    headers['Authorization'] = `Bearer ${cfgWithKey.apiKey}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(await describeRespFailure(resp, '模型列表'));

  const json = await parseJsonResponse<{
    data?: OpenRouterModelRow[];
    models?: OpenRouterModelRow[];
  }>(resp, '模型列表');

  const arr = json.data ?? json.models ?? [];
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('端点返回了空模型列表，请确认 baseUrl 与 API Key 是否正确');
  }

  const apiHintsById: Record<string, { inputModalities?: string[] }> = {};
  const ownedBySet = new Set<string>();
  const backendVisionById: Record<string, ModelVisionSupport> = {};
  const entries = arr
    .map((m) => {
      const id = m.id || m.name || '';
      if (m.architecture?.input_modalities?.length) {
        apiHintsById[id] = { inputModalities: m.architecture.input_modalities };
      }
      if (typeof m.vision === 'boolean') {
        backendVisionById[id] = m.vision ? 'vision' : 'no_vision';
      }
      if (typeof m.owned_by === 'string' && m.owned_by.trim()) {
        ownedBySet.add(m.owned_by.trim());
      }
      return {
        id,
        created: typeof m.created === 'number' ? m.created : undefined,
      };
    })
    .filter((m) => m.id);

  const ids = sortModelsGroupedNewestFirst(entries);
  const visionById =
    Object.keys(backendVisionById).length > 0
      ? { ...buildVisionById(providerId, ids, apiHintsById), ...backendVisionById }
      : buildVisionById(providerId, ids, apiHintsById);

  const ownedByValues = ownedBySet.size > 0 ? [...ownedBySet] : undefined;
  return { ids, visionById, entries, ownedByValues };
}
