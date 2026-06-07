import { normalizeReferenceList } from '@/lib/referenceImages';
import type { ExtractFocus, RefineResponse, StrategyId } from '@/lib/types';
import { parsePayloadVideoSegment, runExtraction } from '@/background/extraction';
import { runRefine } from '@/background/refine';
import type { MessageHandler } from './types';

export const handleExtractionMessage: MessageHandler = (message, sender, sendResponse) => {
  if (message?.type === 'REFINE_PROMPT') {
    const payload = (message.payload ?? {}) as {
      historyId?: string;
      instruction?: string;
      current?: string;
      refineJobId?: string;
    };
    const { historyId, instruction, current, refineJobId } = payload;
    if (!historyId || !instruction || typeof current !== 'string') {
      sendResponse({ ok: false, error: '参数缺失' } satisfies RefineResponse);
      return true;
    }
    runRefine(historyId, current, instruction, sender.tab?.id, refineJobId)
      .then((res) => sendResponse(res))
      .catch((e) => {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        } satisfies RefineResponse);
      });
    return true;
  }

  if (message?.type === 'EXTRACT_PROMPT') {
    const payload = (message.payload ?? {}) as {
      imageUrls?: string[];
      imageUrl?: string;
      pageUrl?: string;
      pageTitle?: string;
      requestId?: string;
      /** @deprecated 旧面板字段，兼容一个发布周期 */
      sessionRequestId?: string;
      strategyOverride?: StrategyId;
      extractFocus?: string;
      videoSegment?: unknown;
    };
    const tabId = sender.tab?.id;
    const imageUrls = normalizeReferenceList(
      payload.imageUrls?.length ? payload.imageUrls : payload.imageUrl ? [payload.imageUrl] : [],
    );
    if (!tabId || imageUrls.length === 0) {
      sendResponse({ ok: false, error: 'invalid params' });
      return true;
    }
    const { pageUrl, pageTitle, strategyOverride, extractFocus: rawFocus } = payload;
    const requestId = payload.requestId ?? payload.sessionRequestId;
    const extractFocus: ExtractFocus | undefined =
      rawFocus === 'material' || rawFocus === 'style' ? rawFocus : undefined;
    const videoSegment = parsePayloadVideoSegment(payload.videoSegment);
    runExtraction({
      tabId,
      imageUrls,
      pageUrl: pageUrl || sender.tab?.url || '',
      pageTitle: pageTitle || sender.tab?.title || '',
      requestId,
      strategyOverride,
      extractFocus,
      videoSegment,
    });
    sendResponse({ ok: true });
    return true;
  }

  return undefined;
};
