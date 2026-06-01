import { extractPrompt } from '@/lib/api';
import { fetchImageAsBase64, makeStorageThumbnail } from '@/lib/image';
import { getSettings } from '@/lib/storage';
import { ensureLibraryReady } from '@/lib/storage/history';
import { getByDedupeKey, naturalDedupeKey, toPublicHistory } from '@/lib/storage/historyDb';
import type { ExtractFocus, RuntimeMessage, VideoSegmentMeta } from '@/lib/types';
import { normalizeReferenceList } from '@/lib/referenceImages';
import type { StrategyId } from '@/lib/strategies-meta';
import { postToTab } from './tabMessaging';
import { persistHistory } from './history';

const extractionGenerationByTabId = new Map<number, number>();

export function clearTabExtractionGeneration(tabId: number): void {
  extractionGenerationByTabId.delete(tabId);
}

function beginTabExtractionGeneration(tabId: number): number {
  const next = (extractionGenerationByTabId.get(tabId) ?? 0) + 1;
  extractionGenerationByTabId.set(tabId, next);
  return next;
}

function extractionStillCurrent(tabId: number, generation: number): boolean {
  return extractionGenerationByTabId.get(tabId) === generation;
}

export function parsePayloadVideoSegment(raw: unknown): VideoSegmentMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const startSec =
    typeof o.startSec === 'number' ? o.startSec : Number.parseFloat(String(o.startSec ?? ''));
  const endSec =
    typeof o.endSec === 'number' ? o.endSec : Number.parseFloat(String(o.endSec ?? ''));
  if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) return undefined;

  let frameTimesSec: number[] | undefined;
  const ftsRaw = o.frameTimesSec;
  if (Array.isArray(ftsRaw)) {
    const nums = ftsRaw
      .map((x) => (typeof x === 'number' ? x : Number.parseFloat(String(x ?? ''))))
      .filter((n) => Number.isFinite(n));
    if (nums.length > 0) frameTimesSec = nums;
  }

  return frameTimesSec ? { startSec, endSec, frameTimesSec } : { startSec, endSec };
}

async function prefetchLibraryVersionsForExtract(
  tabId: number,
  requestId: string,
  imageUrls: string[],
  prefetchStillValid?: () => boolean,
): Promise<string[] | undefined> {
  try {
    await ensureLibraryReady();
    const thumbs = await Promise.all(imageUrls.map((u) => makeStorageThumbnail(u)));
    const dedupePayload =
      thumbs.length > 1
        ? { imageUrl: thumbs[0] || '', thumbnail: thumbs[0] || '', imageUrls: thumbs }
        : { imageUrl: thumbs[0] || '', thumbnail: thumbs[0] || '' };
    const key = naturalDedupeKey(dedupePayload);
    if (key) {
      const row = await getByDedupeKey(key);
      if (row) {
        const item = toPublicHistory(row);
        if (!prefetchStillValid || prefetchStillValid()) {
          postToTab(tabId, {
            type: 'HISTORY_PREFETCH',
            payload: {
              requestId,
              storageId: item.id,
              versions: item.versions,
              prompt: item.prompt,
            },
          });
        }
      }
    }
    return thumbs;
  } catch {
    return undefined;
  }
}

export async function runExtraction(params: {
  tabId: number;
  imageUrls: string[];
  pageUrl: string;
  pageTitle: string;
  requestId?: string;
  strategyOverride?: StrategyId;
  extractFocus?: ExtractFocus;
  videoSegment?: VideoSegmentMeta;
}): Promise<void> {
  const imageUrls = normalizeReferenceList(params.imageUrls);
  if (imageUrls.length === 0) return;
  const imageUrl = imageUrls[0]!;
  const { tabId, pageUrl, pageTitle, strategyOverride, extractFocus, videoSegment } = params;
  const requestId = params.requestId || crypto.randomUUID();
  const runGeneration = beginTabExtractionGeneration(tabId);
  const postTab = (message: RuntimeMessage) => {
    if (!extractionStillCurrent(tabId, runGeneration)) return;
    postToTab(tabId, message);
  };

  const settingsPromise = getSettings();
  const imagePromise = Promise.all(imageUrls.map((u) => fetchImageAsBase64(u)));
  imagePromise.catch(() => undefined);

  let thumbnailForPersistPromise: Promise<string[] | undefined> = Promise.resolve(undefined);

  postTab({
    type: 'EXTRACT_PENDING',
    payload: {
      requestId,
      imageUrl,
      ...(imageUrls.length > 1 ? { imageUrls } : {}),
    },
  });

  void settingsPromise.then(
    (settings) => {
      const activeProvider = settings.activeProvider;
      const activeModel = settings.providers[activeProvider]?.model;
      postTab({
        type: 'EXTRACT_PROGRESS',
        payload: {
          requestId,
          strategy: strategyOverride ?? settings.promptStrategy,
          provider: activeProvider,
          model: activeModel,
          oneClickRewriteRandomness: settings.oneClickRewriteRandomness,
        },
      });
      if (settings.saveHistory) {
        thumbnailForPersistPromise = prefetchLibraryVersionsForExtract(
          tabId,
          requestId,
          imageUrls,
          () => extractionStillCurrent(tabId, runGeneration),
        );
      }
    },
    () => undefined,
  );

  let imageReady = false;
  imagePromise.then(
    () => {
      imageReady = true;
    },
    () => {
      imageReady = true;
    },
  );
  setTimeout(() => {
    if (imageReady) return;
    if (!extractionStillCurrent(tabId, runGeneration)) return;
    postTab({
      type: 'EXTRACT_PROGRESS',
      payload: { requestId, stage: 'fetching' },
    });
  }, 80);

  try {
    const [rawSettings, prefetched] = await Promise.all([settingsPromise, imagePromise]);
    const settings = strategyOverride
      ? { ...rawSettings, promptStrategy: strategyOverride }
      : rawSettings;
    const result = await extractPrompt({
      imageUrls,
      settings,
      prefetched,
      extractFocus,
      videoSegment,
      onProgress: (ev) => {
        postTab({
          type: 'EXTRACT_PROGRESS',
          payload: {
            requestId,
            stage: ev.stage,
            partial: ev.partial,
            streamMode: ev.streamMode,
          },
        });
      },
    });

    postTab({
      type: 'EXTRACT_RESULT',
      payload: {
        requestId,
        ok: true,
        prompt: result.prompt,
        provider: result.provider,
        model: result.model,
        style: result.style,
      },
    });


    if (settings.saveHistory) {
      const precomputedThumbnails = await thumbnailForPersistPromise;
      void persistHistory({
        requestId,
        imageUrls,
        prompt: result.prompt,
        provider: result.provider,
        model: result.model,
        style: result.style,
        pageUrl,
        pageTitle,
        strategy: settings.promptStrategy,
        precomputedThumbnails,
      }).then((stored) => {
        if (!stored || !extractionStillCurrent(tabId, runGeneration)) return;
        postTab({
          type: 'HISTORY_READY',
          payload: {
            requestId,
            actualId: stored.id,
            versions: stored.versions,
            prompt: stored.prompt,
          },
        });
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    postTab({
      type: 'EXTRACT_ERROR',
      payload: { requestId, ok: false, error: message },
    });
  }
}
