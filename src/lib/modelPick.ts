import { sortModelsGroupedNewestFirst, type ModelListEntry } from './api/modelSort';
import { partitionByVision, type ModelVisionSupport } from './modelVision';
import { resolveEffectiveRefineProvider } from './providerRoles';
import { GLOBAL_DEFINITE_NO_VISION } from './providerVisionFamilies';
import { PROVIDERS } from './providers';
import type { AppSettings, ProviderId } from './types';

export type ModelPickPurpose = 'vision' | 'text';

const TEXT_FAST_HINTS = [/mini/i, /haiku/i, /flash/i, /turbo/i, /lite/i];
/** 同族内优先完整版而非变体（列表已按新→旧，取第一个非变体） */
const VISION_VARIANT_SUFFIXES = [/-mini$/i, /-compact$/i, /-turbo$/i, /-lite$/i];
/** 无 dated snapshot 时优先稳定 alias */
const VISION_STABLE_ALIAS = /-latest$/i;

function sortDiscoveredIds(ids: string[], entries?: ModelListEntry[]): string[] {
  if (entries && entries.length > 0) {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return sortModelsGroupedNewestFirst(ids.map((id) => byId.get(id) ?? { id }));
  }
  return sortModelsGroupedNewestFirst(ids.map((id) => ({ id })));
}

function pickNewestVisionModel(visionIds: string[]): string | null {
  if (visionIds.length === 0) return null;
  const stableLatest = visionIds.find((id) => VISION_STABLE_ALIAS.test(id));
  if (stableLatest) return stableLatest;
  for (const id of visionIds) {
    if (!VISION_VARIANT_SUFFIXES.some((pattern) => pattern.test(id))) return id;
  }
  return visionIds[0] ?? null;
}

function matchesAny(id: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(id));
}

function pickPreferredFromSorted(ids: string[], hints: RegExp[]): string | null {
  if (ids.length === 0) return null;
  for (const hint of hints) {
    const found = ids.find((id) => hint.test(id));
    if (found) return found;
  }
  return ids[0] ?? null;
}

function isDefiniteNoVision(id: string): boolean {
  return matchesAny(id, GLOBAL_DEFINITE_NO_VISION);
}

/** 当前 model 是否为占位或未出现在本次拉取列表中，需要自动替换。 */
export function isUnresolvedModel(
  providerId: ProviderId,
  model: string,
  discoveredIds: string[],
): boolean {
  const trimmed = model.trim();
  if (!trimmed) return true;
  if (discoveredIds.length > 0 && discoveredIds.includes(trimmed)) return false;
  if (trimmed === PROVIDERS[providerId].defaultModel) return true;
  if (trimmed === 'your-model') return true;
  if (discoveredIds.length > 0 && !discoveredIds.includes(trimmed)) return true;
  return false;
}

export interface ModelPickOptions {
  purpose: ModelPickPurpose;
  /** 端点 /models 返回的 created 时间戳，用于更精确的新→旧排序 */
  entries?: ModelListEntry[];
}

/**
 * 从端点拉取的模型列表中挑选默认项。
 * - vision：识图反推，在已排序列表中取最新的可识图模型（vision → unknown）
 * - text：AI 调整，排除 embed/tts 等，优先 mini/haiku/flash
 */
export function pickDefaultModelFromDiscovered(
  _providerId: ProviderId,
  ids: string[],
  visionById: Record<string, ModelVisionSupport>,
  options: ModelPickOptions,
): string | null {
  if (ids.length === 0) return null;

  const sorted = sortDiscoveredIds(ids, options.entries);

  if (options.purpose === 'vision') {
    const { vision, unknown } = partitionByVision(sorted, visionById);
    if (vision.length > 0) return pickNewestVisionModel(vision);
    if (unknown.length > 0) return unknown[0] ?? null;
    const fallback = sorted.filter(
      (id) => visionById[id] !== 'no_vision' && !isDefiniteNoVision(id),
    );
    // 兜底：哪怕全部 no_vision，也选最新的一个，避免残留 your-model 占位
    return fallback[0] ?? sorted[0] ?? null;
  }

  const eligible = sorted.filter((id) => !isDefiniteNoVision(id));
  const pool = eligible.length > 0 ? eligible : sorted;
  return pickPreferredFromSorted(pool, TEXT_FAST_HINTS);
}

export interface ApplyAutoModelPickOptions {
  entries?: ModelListEntry[];
  /** 登录/显式配置后强制覆盖已有有效模型 */
  force?: boolean;
}

/** 拉取或已有缓存列表后，将占位/失效 model 写入合适默认项。 */
export function applyAutoModelPickToDraft(
  draft: AppSettings,
  effectivePid: ProviderId,
  ids: string[],
  visionById: Record<string, ModelVisionSupport>,
  purpose: ModelPickPurpose,
  options?: ApplyAutoModelPickOptions,
): { draft: AppSettings; hint: string | null } {
  if (ids.length === 0) return { draft, hint: null };

  const slot = draft.providers[effectivePid];
  if (!slot) return { draft, hint: null };

  const picked = pickDefaultModelFromDiscovered(effectivePid, ids, visionById, {
    purpose,
    entries: options?.entries,
  });
  if (!picked) return { draft, hint: null };

  const force = options?.force === true;
  if (!force && !isUnresolvedModel(effectivePid, slot.model, ids)) {
    return { draft, hint: null };
  }
  if (picked === slot.model.trim()) {
    return { draft, hint: null };
  }

  let next: AppSettings = {
    ...draft,
    providers: {
      ...draft.providers,
      [effectivePid]: { ...slot, model: picked },
    },
  };

  const purposeLabel = purpose === 'vision' ? '最新识图' : '文本';
  const hint = `已按端点列表自动选择${purposeLabel}模型「${picked}」`;

  const refinePid = resolveEffectiveRefineProvider(next);
  const explicitRefine = next.refineModel?.trim();
  const shouldSyncRefine =
    refinePid === effectivePid &&
    explicitRefine &&
    (force || isUnresolvedModel(effectivePid, explicitRefine, ids));
  if (shouldSyncRefine && explicitRefine !== picked) {
    next = { ...next, refineModel: picked };
  }

  return { draft: next, hint };
}

/** 自动拉取模型列表成功后，当前 model 仍为占位/失效时高亮【拉取模型】按钮。 */
export function shouldHighlightFetchModelsButton(
  providerId: ProviderId,
  model: string,
  discoveredIds: string[],
  options?: { fetching?: boolean },
): boolean {
  if (options?.fetching) return false;
  if (discoveredIds.length === 0) return false;
  return isUnresolvedModel(providerId, model, discoveredIds);
}
