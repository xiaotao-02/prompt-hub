import { isExtensionContextValid } from '@/content/extensionBridge';
import type { RefineResponse } from '@/lib/types';
import {
  currentState,
  libraryStorageId,
  panelRefineJobs,
  type PanelRefineJob,
  type PanelState,
  MAX_PARALLEL_PANEL_REFINES,
  panelActions,
} from './state';
import { commitPanelEvent } from './dispatchPanel';
import { expandPanelForSidebar } from './geometry';
import { syncVersions } from './versionsSync';

function renderPanel(...args: Parameters<typeof panelActions.renderPanel>) {
  return panelActions.renderPanel(...args);
}

export function beginPanelRefineSession(
  sessionState: PanelState,
  baseline: string,
  instruction: string,
  refineInstructionSnapshot: string,
): void {
  if (panelRefineJobs(sessionState).length >= MAX_PARALLEL_PANEL_REFINES) return;

  const jobId = crypto.randomUUID();
  const kind: PanelRefineJob['kind'] = refineInstructionSnapshot.trim() ? 'instructed' : 'oneClick';
  const job: PanelRefineJob = {
    jobId,
    kind,
    stage: 'calling',
    partial: undefined,
    startedAt: Date.now(),
    refineBaselinePrompt: baseline,
    refineInstructionSnapshot: refineInstructionSnapshot || undefined,
  };

  const requestIdSnapshot = sessionState.sessionRequestId;
  commitPanelEvent({
    type: 'refine.enqueue',
    job,
    refineInstruction: refineInstructionSnapshot,
  });
  renderPanel(currentState!);

  if (!isExtensionContextValid()) {
    commitPanelEvent({
      type: 'refine.dequeue',
      jobId,
      refineError: '扩展已更新，请刷新页面',
    });
    renderPanel(currentState!);
    return;
  }

  try {
    chrome.runtime.sendMessage(
      {
        type: 'REFINE_PROMPT',
        payload: {
          historyId: libraryStorageId(sessionState),
          instruction,
          current: baseline,
          refineJobId: jobId,
        },
      },
      (resp: RefineResponse | undefined) => {
        if (!currentState || currentState.sessionRequestId !== requestIdSnapshot) return;
        const rid = resp?.ok ? (resp.refineJobId ?? jobId) : jobId;
        if (chrome.runtime.lastError || !resp) {
          commitPanelEvent({
            type: 'refine.dequeue',
            jobId: rid,
            refineError: chrome.runtime.lastError?.message || '后台未响应，请稍后再试',
          });
          renderPanel(currentState);
          return;
        }
        if (!resp.ok) {
          commitPanelEvent({
            type: 'refine.dequeue',
            jobId: rid,
            refineError: resp.error,
          });
          renderPanel(currentState);
          return;
        }
        const prevSel = currentState.selectedVersionId;
        const wasOpen = currentState.versionsOpen;
        commitPanelEvent({
          type: 'refine.complete',
          jobId: rid,
          prompt: resp.prompt,
          versionId: resp.versionId,
          prevSelectedVersionId: prevSel,
        });
        if (!wasOpen) expandPanelForSidebar();
        void syncVersions();
        renderPanel(currentState!);
      },
    );
  } catch {
    commitPanelEvent({
      type: 'refine.dequeue',
      jobId,
      refineError: '扩展已更新，请刷新页面',
    });
    renderPanel(currentState!);
  }
}
