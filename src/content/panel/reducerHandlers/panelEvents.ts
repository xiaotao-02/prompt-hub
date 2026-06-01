import type {
  ExtractStage,
  OneClickRefineRandomness,
  PromptVersion,
  RefineStage,
  StrategyId,
  StreamDeliveryMode,
} from '@/lib/types';
import type { PanelRefineJob, PanelState } from '../state';

export interface ExtractProgressPatch {
  stage?: ExtractStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
  strategy?: StrategyId;
  provider?: string;
  model?: string;
  oneClickRefineRandomness?: OneClickRefineRandomness;
}

export type PanelEvent =
  | {
      type: 'extract.progress';
      streamRequestId: string;
      patch: ExtractProgressPatch;
    }
  | {
      type: 'extract.result';
      streamRequestId: string;
      result: {
        prompt: string;
        provider?: string;
        model?: string;
      };
    }
  | {
      type: 'extract.error';
      streamRequestId: string;
      error: string;
    }
  | { type: 'ui.strategy'; strategy: StrategyId }
  | { type: 'ui.oneClickRefineRandomness'; level: OneClickRefineRandomness }
  | { type: 'ui.toggleVersionsOpen'; open?: boolean }
  | {
      type: 'ui.toggleRefineOpen';
      open?: boolean;
      refineInstruction?: string;
    }
  | {
      type: 'ui.setDraft';
      draft: string;
      selectedVersionId?: string | null;
    }
  | { type: 'ui.setRefineInstruction'; instruction: string }
  | { type: 'ui.setRefineError'; error: string }
  | { type: 'ui.selectVersionId'; selectedVersionId: string }
  | { type: 'ui.loadVersion'; draft: string; selectedVersionId: string }
  | {
      type: 'versions.synced';
      versions: PromptVersion[];
      prompt: string;
      draft: string;
      selectedVersionId?: string;
    }
  | {
      type: 'versions.updated';
      prompt: string;
      draft: string;
      versions: PromptVersion[];
      selectedVersionId?: string;
      versionsOpen?: boolean;
    }
  | {
      type: 'refine.enqueue';
      job: PanelRefineJob;
      refineInstruction: string;
    }
  | { type: 'refine.dequeue'; jobId: string; refineError?: string }
  | {
      type: 'refine.complete';
      jobId: string;
      prompt: string;
      versionId?: string;
      prevSelectedVersionId?: string;
    }
  | { type: 'reference.setUrls'; imageUrls: string[]; imageUrl: string }
  | {
      type: 'history.prefetch';
      sessionRequestId: string;
      prefetchStorageId: string;
      versions: PromptVersion[];
      prompt: string;
    }
  | {
      type: 'history.ready';
      sessionRequestId: string;
      persistedHistoryId: string;
      versions: PromptVersion[];
      prompt: string;
    }
  | {
      type: 'refine.progress';
      refineJobId?: string;
      stage?: RefineStage;
      partial?: string;
      streamMode?: StreamDeliveryMode;
    };

export type PanelStateTransition =
  | {
      changed: true;
      state: PanelState;
      lightExtract?: boolean;
      shouldSyncVersions?: boolean;
      shouldMergePendingAppendUrls?: boolean;
    }
  | { changed: false; state: PanelState | null };
