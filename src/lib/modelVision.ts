import { PROVIDERS } from './providers';
import { getProviderVisionCatalog } from './providerVisionCatalog';
import {
  getProviderDefiniteNoVision,
  getProviderLikelyVision,
  GLOBAL_DEFINITE_NO_VISION,
  GLOBAL_LIKELY_CHAT_VISION,
} from './providerVisionFamilies';
import type { ProviderId } from './types';

export type ModelVisionSupport = 'vision' | 'no_vision' | 'unknown';
export type VisionClassifySource = 'api' | 'rule' | 'heuristic' | 'static';
export type VisionConfidence = 'high' | 'low';

export interface ClassifiedModel {
  id: string;
  vision: ModelVisionSupport;
  source: VisionClassifySource;
  confidence: VisionConfidence;
}

export interface ModelVisionApiHint {
  inputModalities?: string[];
}

export interface ProviderVisionDisplay {
  vision: string[];
  noVision: string[];
  unknown: string[];
  visionTotal: number;
  noVisionTotal: number;
  unknownTotal: number;
  source: 'discovered' | 'static' | 'mixed';
}

/** platform 公开 id「上游ID/模型名」→ 短模型名（遗留格式兼容） */
export function platformModelDisplayName(modelId: string): string {
  const slash = modelId.indexOf('/');
  return slash > 0 ? modelId.slice(slash + 1) : modelId;
}

/** 将遗留「厂商ID/模型名」迁移为短模型名 */
export function migratePlatformModelId(modelId: string | undefined): string | undefined {
  if (!modelId?.trim()) return modelId;
  return platformModelDisplayName(modelId.trim());
}

const VISION_RANK: Record<ModelVisionSupport, number> = {
  vision: 2,
  unknown: 1,
  no_vision: 0,
};

/** 合并拉取/缓存中的 platform 模型列表：短名去重，识图标注取最优 */
export function dedupePlatformDiscoveredModels(
  models: string[],
  visionById: Record<string, ModelVisionSupport> = {},
): { models: string[]; visionById: Record<string, ModelVisionSupport> } {
  const order: string[] = [];
  const seen = new Set<string>();
  const mergedVision: Record<string, ModelVisionSupport> = {};

  for (const raw of models) {
    const id = platformModelDisplayName(raw);
    if (!id) continue;
    const support = visionById[raw] ?? visionById[id];
    const prev = mergedVision[id];
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
      if (support) mergedVision[id] = support;
    } else if (support && (!prev || VISION_RANK[support] > VISION_RANK[prev])) {
      mergedVision[id] = support;
    }
  }

  return { models: order, visionById: mergedVision };
}

function matchesAny(id: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(id));
}

function withConfidence(
  id: string,
  vision: ModelVisionSupport,
  source: VisionClassifySource,
  confidence: VisionConfidence,
): ClassifiedModel {
  return { id, vision, source, confidence };
}

function applyProviderDefiniteRules(
  providerId: ProviderId,
  modelId: string,
): ClassifiedModel | null {
  const id = modelId.trim();
  if (!id) return null;

  const providerNo = getProviderDefiniteNoVision(providerId);
  if (matchesAny(id, providerNo)) {
    return withConfidence(id, 'no_vision', 'rule', 'high');
  }

  const providerYes = getProviderLikelyVision(providerId);
  if (matchesAny(id, providerYes)) {
    return withConfidence(id, 'vision', 'rule', 'high');
  }

  if (providerId === 'minimax') {
    if (/^MiniMax-VL/i.test(id)) {
      return withConfidence(id, 'vision', 'rule', 'high');
    }
  }

  return null;
}

function applyApiHint(modelId: string, hint?: ModelVisionApiHint): ClassifiedModel | null {
  if (!hint?.inputModalities?.length) return null;
  const hasImage = hint.inputModalities.some((m) => m.toLowerCase() === 'image');
  return withConfidence(modelId, hasImage ? 'vision' : 'no_vision', 'api', 'high');
}

function applyGlobalDefiniteNoVision(modelId: string): ClassifiedModel | null {
  if (matchesAny(modelId, GLOBAL_DEFINITE_NO_VISION)) {
    return withConfidence(modelId, 'no_vision', 'heuristic', 'high');
  }
  return null;
}

function applyLikelyChatVision(modelId: string): ClassifiedModel | null {
  if (matchesAny(modelId, GLOBAL_LIKELY_CHAT_VISION)) {
    return withConfidence(modelId, 'vision', 'heuristic', 'low');
  }
  return null;
}

function applyStaticCatalog(providerId: ProviderId, modelId: string): ClassifiedModel | null {
  const catalog = getProviderVisionCatalog(providerId);
  const lower = modelId.toLowerCase();
  if (catalog.visionExamples.some((e) => e.toLowerCase() === lower)) {
    return withConfidence(modelId, 'vision', 'static', 'low');
  }
  if (catalog.nonVisionExamples.some((e) => e.toLowerCase() === lower)) {
    return withConfidence(modelId, 'no_vision', 'static', 'low');
  }
  return null;
}

/**
 * 是否应在有参考图时拦截反推（仅高置信 no_vision）。
 */
export function shouldBlockExtract(classified: ClassifiedModel): boolean {
  return classified.vision === 'no_vision' && classified.confidence === 'high';
}

/**
 * 判断单个模型是否支持识图（参考图 image_url 反推）。
 */
export function classifyModel(
  providerId: ProviderId,
  modelId: string,
  apiHint?: ModelVisionApiHint,
): ClassifiedModel {
  const id = modelId.trim();
  if (!id) {
    return withConfidence(modelId, 'unknown', 'heuristic', 'low');
  }

  const providerRule = applyProviderDefiniteRules(providerId, id);
  if (providerRule) return providerRule;

  const api = applyApiHint(id, apiHint);
  if (api) return api;

  const globalNo = applyGlobalDefiniteNoVision(id);
  if (globalNo) return globalNo;

  const likely = applyLikelyChatVision(id);
  if (likely) return likely;

  const staticMatch = applyStaticCatalog(providerId, id);
  if (staticMatch) return staticMatch;

  return withConfidence(id, 'unknown', 'heuristic', 'low');
}

export function classifyModelList(
  providerId: ProviderId,
  ids: string[],
  apiHintsById?: Record<string, ModelVisionApiHint>,
): ClassifiedModel[] {
  return ids.map((id) => classifyModel(providerId, id, apiHintsById?.[id]));
}

export function buildVisionById(
  providerId: ProviderId,
  ids: string[],
  apiHintsById?: Record<string, ModelVisionApiHint>,
): Record<string, ModelVisionSupport> {
  const map: Record<string, ModelVisionSupport> = {};
  for (const id of ids) {
    map[id] = classifyModel(providerId, id, apiHintsById?.[id]).vision;
  }
  return map;
}

/** 始终按当前规则重算（升级后旧缓存也会更新）。 */
export function ensureVisionById(
  providerId: ProviderId,
  ids: string[],
  _existing?: Record<string, ModelVisionSupport>,
): Record<string, ModelVisionSupport> {
  if (!ids.length) return {};
  return buildVisionById(providerId, ids);
}

export function partitionByVision(
  ids: string[],
  visionById: Record<string, ModelVisionSupport>,
): { vision: string[]; noVision: string[]; unknown: string[] } {
  const vision: string[] = [];
  const noVision: string[] = [];
  const unknown: string[] = [];
  for (const id of ids) {
    const v = visionById[id];
    if (v === 'vision') vision.push(id);
    else if (v === 'no_vision') noVision.push(id);
    else unknown.push(id);
  }
  return { vision, noVision, unknown };
}

const DISPLAY_TRUNCATE = 4;

function truncateList(items: string[], max = DISPLAY_TRUNCATE): { shown: string[]; rest: number } {
  if (items.length <= max) return { shown: items, rest: 0 };
  return { shown: items.slice(0, max), rest: items.length - max };
}

/**
 * 供设置页供应商卡片：合并静态示例与端点实列。
 */
export function getProviderVisionDisplay(
  providerId: ProviderId,
  discoveredIds?: string[],
  visionById?: Record<string, ModelVisionSupport>,
): ProviderVisionDisplay & {
  visionShown: string[];
  noVisionShown: string[];
  unknownShown: string[];
  visionRest: number;
  noVisionRest: number;
  unknownRest: number;
} {
  const catalog = getProviderVisionCatalog(providerId);

  if (discoveredIds && discoveredIds.length > 0) {
    const map = visionById ?? buildVisionById(providerId, discoveredIds);
    const { vision, noVision, unknown } = partitionByVision(discoveredIds, map);
    const v = truncateList(vision);
    const n = truncateList(noVision);
    const u = truncateList(unknown);
    return {
      vision,
      noVision,
      unknown,
      visionTotal: vision.length,
      noVisionTotal: noVision.length,
      unknownTotal: unknown.length,
      source: 'discovered',
      visionShown: v.shown,
      noVisionShown: n.shown,
      unknownShown: u.shown,
      visionRest: v.rest,
      noVisionRest: n.rest,
      unknownRest: u.rest,
    };
  }

  const v = truncateList(catalog.visionExamples);
  const n = truncateList(catalog.nonVisionExamples);
  return {
    vision: catalog.visionExamples,
    noVision: catalog.nonVisionExamples,
    unknown: [],
    visionTotal: catalog.visionExamples.length,
    noVisionTotal: catalog.nonVisionExamples.length,
    unknownTotal: 0,
    source: 'static',
    visionShown: v.shown,
    noVisionShown: n.shown,
    unknownShown: [],
    visionRest: v.rest,
    noVisionRest: n.rest,
    unknownRest: 0,
  };
}

export function getRecommendedVisionModel(providerId: ProviderId): string {
  const catalog = getProviderVisionCatalog(providerId);
  if (catalog.visionExamples[0]) return catalog.visionExamples[0];
  return PROVIDERS[providerId].defaultModel;
}

export function isVisionCapableModel(
  providerId: ProviderId,
  modelId: string,
  visionById?: Record<string, ModelVisionSupport>,
): boolean {
  if (visionById?.[modelId] === 'vision') return true;
  if (visionById?.[modelId] === 'no_vision') return false;
  const c = classifyModel(providerId, modelId);
  return c.vision === 'vision' || c.vision === 'unknown';
}
