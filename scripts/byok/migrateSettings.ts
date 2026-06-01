import type { ProviderId } from '../../src/lib/types/domain.js';

/** BYOK 构建：将已移除的 platform 或未知 id 回退为 openai */
export function coerceByokProviderId(
  id: unknown,
  validIds: ReadonlySet<string>,
  fallback: ProviderId = 'openai',
): ProviderId {
  if (typeof id !== 'string') return fallback;
  if (id === 'platform') return fallback;
  if (validIds.has(id)) return id as ProviderId;
  return fallback;
}
