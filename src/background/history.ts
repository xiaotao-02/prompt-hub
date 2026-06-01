import { addHistory } from '@/lib/storage';
import { naturalDedupeKey } from '@/lib/storage/historyDb';
import { makeStorageThumbnail } from '@/lib/image';
import type { HistoryItem } from '@/lib/types';
import type { StrategyId } from '@/lib/strategies-meta';

const persistHistoryTailByKey = new Map<string, Promise<HistoryItem | undefined>>();

export async function persistHistory(params: {
  requestId: string;
  imageUrls: string[];
  prompt: string;
  provider: HistoryItem['provider'];
  model: string;
  style: HistoryItem['style'];
  pageUrl: string;
  pageTitle: string;
  strategy?: StrategyId;
  precomputedThumbnails?: string[];
}): Promise<HistoryItem | undefined> {
  try {
    const now = Date.now();
    const thumbs =
      params.precomputedThumbnails &&
      params.precomputedThumbnails.length === params.imageUrls.length
        ? params.precomputedThumbnails
        : await Promise.all(params.imageUrls.map((u) => makeStorageThumbnail(u)));
    const primary = thumbs[0] || '';
    const item: HistoryItem = {
      id: params.requestId,
      imageUrl: primary,
      thumbnail: primary,
      ...(thumbs.length > 1 ? { imageUrls: thumbs } : {}),
      prompt: params.prompt,
      provider: params.provider,
      model: params.model,
      style: params.style,
      pageUrl: params.pageUrl,
      pageTitle: params.pageTitle,
      createdAt: now,
      updatedAt: now,
      strategy: params.strategy,
      versions: [
        {
          id: params.requestId + ':v0',
          prompt: params.prompt,
          versionNo: 0,
          createdAt: now,
          source: 'extracted',
          meta: {
            provider: params.provider,
            model: params.model,
            style: params.style,
            strategy: params.strategy,
          },
        },
      ],
    };
    const dedupeKey = naturalDedupeKey(item);
    const queueKey = dedupeKey || params.requestId;
    const prev = persistHistoryTailByKey.get(queueKey) ?? Promise.resolve(undefined);
    const mine = prev.catch(() => undefined).then(() => addHistory(item));
    persistHistoryTailByKey.set(queueKey, mine);
    return await mine;
  } catch (err) {
    console.debug('[PromptHub] persist history failed', err);
    return undefined;
  }
}
