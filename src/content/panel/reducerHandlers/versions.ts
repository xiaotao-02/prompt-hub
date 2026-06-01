import type { PromptVersion } from '@/lib/types';
import type { PanelState } from '../state';
import type { PanelStateTransition } from './panelEvents';

export function applyVersionsSynced(
  state: PanelState,
  payload: {
    versions: PromptVersion[];
    prompt: string;
    draft: string;
    selectedVersionId?: string;
  },
): PanelStateTransition {
  return {
    changed: true,
    state: {
      ...state,
      versions: payload.versions,
      prompt: payload.prompt,
      draft: payload.draft,
      selectedVersionId: payload.selectedVersionId,
    },
  };
}

export function applyVersionsUpdated(
  state: PanelState,
  payload: {
    prompt: string;
    draft: string;
    versions: PromptVersion[];
    selectedVersionId?: string;
    versionsOpen?: boolean;
  },
): PanelStateTransition {
  return {
    changed: true,
    state: {
      ...state,
      prompt: payload.prompt,
      draft: payload.draft,
      versions: payload.versions,
      selectedVersionId: payload.selectedVersionId,
      versionsOpen: payload.versionsOpen ?? true,
    },
  };
}
