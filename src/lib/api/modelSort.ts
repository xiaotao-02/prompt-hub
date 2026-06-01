export interface ModelListEntry {
  id: string;
  created?: number;
}

const FAMILY_SUFFIXES = [
  '-openai-compact',
  '-compact',
  '-mini',
  '-turbo',
  '-preview',
  '-latest',
] as const;

/** 模型 id 首段作为类型键，如 gpt-5.4-mini → gpt */
export function modelType(id: string): string {
  return id.split('-')[0] || id;
}

/** 去掉常见变体后缀得到 family，如 gpt-5.4-mini → gpt-5.4 */
export function modelFamily(id: string): string {
  let family = id;
  for (const suffix of FAMILY_SUFFIXES) {
    if (family.endsWith(suffix)) {
      family = family.slice(0, -suffix.length);
      break;
    }
  }
  return family;
}

function compareNewestFirst(a: ModelListEntry, b: ModelListEntry): number {
  const createdA = a.created ?? 0;
  const createdB = b.created ?? 0;
  if (createdA !== createdB) return createdB - createdA;
  return b.id.localeCompare(a.id);
}

/** 组内 id 倒序排最前的条目（无 created 时作为组间排序 proxy） */
function newestIdInGroup(entries: ModelListEntry[]): string {
  const sorted = [...entries].sort((a, b) => b.id.localeCompare(a.id));
  return sorted[0]?.id ?? '';
}

/** 组内「最新」排序键：max(created)，无 created 时返回 0 */
function groupNewestKey(entries: ModelListEntry[]): number {
  return Math.max(...entries.map((e) => e.created ?? 0));
}

function compareGroups(a: ModelListEntry[], b: ModelListEntry[]): number {
  const keyA = groupNewestKey(a);
  const keyB = groupNewestKey(b);
  if (keyA !== keyB && (keyA > 0 || keyB > 0)) return keyB - keyA;
  return newestIdInGroup(b).localeCompare(newestIdInGroup(a));
}

function dedupeEntries(entries: ModelListEntry[]): ModelListEntry[] {
  const map = new Map<string, ModelListEntry>();
  for (const e of entries) {
    if (!e.id) continue;
    const exist = map.get(e.id);
    if (!exist || (e.created ?? 0) > (exist.created ?? 0)) {
      map.set(e.id, e);
    }
  }
  return [...map.values()];
}

/**
 * 按模型类型分组，组间/组内/family 内均新→旧排序。
 * 优先使用 API 的 created 时间戳，缺失时回退到 id 倒序。
 */
export function sortModelsGroupedNewestFirst(entries: ModelListEntry[]): string[] {
  const unique = dedupeEntries(entries);
  if (unique.length === 0) return [];

  const byType = new Map<string, ModelListEntry[]>();
  for (const e of unique) {
    const t = modelType(e.id);
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(e);
  }

  const sortedTypes = [...byType.entries()].sort((a, b) => compareGroups(a[1], b[1]));

  const result: string[] = [];
  for (const [, typeEntries] of sortedTypes) {
    const byFamily = new Map<string, ModelListEntry[]>();
    for (const e of typeEntries) {
      const f = modelFamily(e.id);
      if (!byFamily.has(f)) byFamily.set(f, []);
      byFamily.get(f)!.push(e);
    }

    const sortedFamilies = [...byFamily.entries()].sort((a, b) => compareGroups(a[1], b[1]));

    for (const [, famEntries] of sortedFamilies) {
      famEntries.sort(compareNewestFirst);
      result.push(...famEntries.map((e) => e.id));
    }
  }
  return result;
}
