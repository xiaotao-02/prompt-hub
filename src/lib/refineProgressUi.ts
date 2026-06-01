import type { RefineStage, StreamDeliveryMode } from '@/lib/types';
import { parseRefineJobSentinel, REFINE_STREAM_VERSION_ID } from '@/lib/streamVersionSentinels';

export const BUFFERED_STREAM_HINT = '当前接口未返回流式响应，正在等待完整结果…';

export function formatElapsed(ms: number): string {
  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  return `${Math.floor(s)}s`;
}

/** refine 阶段下进度条的视觉百分比。比 extract 短一档，所以直接给两个固定值。 */
export function refineStageProgress(stage: RefineStage | undefined, hasPartial: boolean): number {
  if (hasPartial) return 0.78;
  if (stage === 'streaming') return 0.55;
  return 0.42;
}

/** refine 阶段下进度条下方的 hint 文案。 */
export function refineStageHint(
  stage: RefineStage | undefined,
  hasPartial: boolean,
  streamMode?: StreamDeliveryMode,
): string {
  if (hasPartial) return '正在接收模型回复…';
  if (streamMode === 'buffered') return BUFFERED_STREAM_HINT;
  if (stage === 'streaming') return '模型思考中…';
  return '正在调用大模型…';
}

export type RefineJobForUi = {
  jobId: string;
  partial?: string;
  stage?: RefineStage;
  streamMode?: StreamDeliveryMode;
  startedAt?: number;
};

/** refine 侧栏进度条：优先当前选中的占位 job，否则第一条。 */
export function pickRefineJobForUi<T extends RefineJobForUi>(
  jobs: readonly T[],
  selectedVersionId?: string | null,
): T | undefined {
  if (jobs.length === 0) return undefined;
  const jid = parseRefineJobSentinel(selectedVersionId ?? undefined);
  if (jid) {
    const hit = jobs.find((j) => j.jobId === jid);
    if (hit) return hit;
  }
  if (selectedVersionId === REFINE_STREAM_VERSION_ID) {
    return jobs[0];
  }
  return jobs[0];
}
