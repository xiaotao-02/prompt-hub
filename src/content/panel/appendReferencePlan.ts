import { appendReferenceUrl, normalizeReferenceList } from '@/lib/referenceImages';
import { panelExtractJobs, panelReferenceUrls, type PanelState } from './state';

export function shouldEnqueueAppendReference(cur: PanelState | null): boolean {
  return !!cur && (cur.status === 'loading' || panelExtractJobs(cur).length > 0);
}

/**
 * 给定当前面板状态与待追加 URL，计算下一帧 compose 状态（不触发 render）。
 */
export function buildComposeAfterAppendReference(
  cur: PanelState | null,
  imageUrl: string,
  sessionRequestId: string,
): PanelState {
  const url = imageUrl.trim();
  const listFromSingle = normalizeReferenceList([url]);
  const firstFromSingle = listFromSingle[0] || '';

  if (!cur) {
    return {
      sessionRequestId,
      imageUrl: firstFromSingle,
      imageUrls: listFromSingle,
      status: 'compose',
    };
  }

  if (cur.status === 'success' || cur.status === 'error') {
    const next = appendReferenceUrl(panelReferenceUrls(cur), url);
    return {
      sessionRequestId,
      imageUrl: next[0] || cur.imageUrl,
      imageUrls: next,
      status: 'compose',
      strategy: cur.strategy,
      oneClickRefineRandomness: cur.oneClickRefineRandomness,
    };
  }

  if (cur.status === 'compose') {
    const next = appendReferenceUrl(panelReferenceUrls(cur), url);
    return {
      ...cur,
      imageUrls: next,
      imageUrl: next[0] || cur.imageUrl,
    };
  }

  return {
    sessionRequestId,
    imageUrl: firstFromSingle,
    imageUrls: listFromSingle,
    status: 'compose',
    strategy: cur.strategy,
    oneClickRefineRandomness: cur.oneClickRefineRandomness,
  };
}
