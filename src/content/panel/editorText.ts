import {
  REFINE_STREAM_VERSION_ID,
  EXTRACT_STREAM_VERSION_ID,
  extractStreamDisplayedBody,
  refineStreamDisplayedBody,
  parseExtractJobSentinel,
  parseRefineJobSentinel,
} from '@/lib/streamVersionSentinels';
import type { PanelState } from './state';
import { panelExtractJobs, panelHasActiveRefine } from './state';

/** success 态主编辑器展示用：区分 AI 调整流式 vs 预览某条历史版本。 */
export function successEditorDisplayedText(state: PanelState): string {
  const draft = state.draft ?? state.prompt ?? '';
  const sel = state.selectedVersionId;

  if (parseExtractJobSentinel(sel ?? undefined) && panelExtractJobs(state).length > 0) {
    return extractStreamDisplayedBody({ ...state, selectedVersionId: sel });
  }
  if (
    (parseRefineJobSentinel(sel ?? undefined) || sel === REFINE_STREAM_VERSION_ID) &&
    panelHasActiveRefine(state)
  ) {
    return refineStreamDisplayedBody({ ...state, selectedVersionId: sel });
  }

  if (!panelHasActiveRefine(state)) {
    return draft;
  }

  if (sel && sel !== REFINE_STREAM_VERSION_ID && !sel.startsWith(`${REFINE_STREAM_VERSION_ID}:`)) {
    const v = state.versions?.find((x) => x.id === sel);
    if (v) return v.prompt;
  }
  return refineStreamDisplayedBody(state);
}

/** loading（重新生成/反推流式）态主编辑器：区分流式 vs 预览历史版本。 */
export function loadingEditorDisplayedText(state: PanelState): string {
  if (state.status === 'loading') {
    const sel = state.selectedVersionId;
    if (
      sel &&
      sel !== EXTRACT_STREAM_VERSION_ID &&
      !sel.startsWith(`${EXTRACT_STREAM_VERSION_ID}:`)
    ) {
      const v = state.versions?.find((x) => x.id === sel);
      if (v) return v.prompt;
    }
    return extractStreamDisplayedBody(state);
  }
  if (panelExtractJobs(state).length > 0) {
    return extractStreamDisplayedBody(state);
  }
  return state.partial ?? '';
}
