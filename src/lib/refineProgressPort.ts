import type { RefineStage, StreamDeliveryMode } from '@/lib/types';

/** Options / Popup ↔ MV3 service worker：AI 调整流式进度专用 Port（与 REFINE_PROMPT sendMessage 分离）。 */
export const PROMPT_HUB_REFINE_PROGRESS_PORT = 'prompt-hub-refine-progress';

export type RefineProgressPortPayload = {
  historyId: string;
  refineJobId?: string;
  stage?: RefineStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
};

export const REFINE_PROGRESS_PORT_KIND = 'REFINE_PROGRESS' as const;

export type RefineProgressPortEnvelope = {
  kind: typeof REFINE_PROGRESS_PORT_KIND;
  payload: RefineProgressPortPayload;
};
