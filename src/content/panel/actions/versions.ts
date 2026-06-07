import {
  appendPromptVersionFromExtension,
  removePromptVersionFromExtension,
  restorePromptVersionFromExtension,
} from '@/content/extensionBridge';
import {
  EXTRACT_STREAM_VERSION_ID,
  REFINE_STREAM_VERSION_ID,
  extractStreamSentinelForJob,
  refineStreamSentinelForJob,
  parseExtractJobSentinel,
  parseRefineJobSentinel,
} from '@/lib/streamVersionSentinels';
import {
  getCachedVersionsListDensity,
  setVersionsListDensity,
  toggleVersionsListDensity,
} from '@/lib/versionsListDensity';
import { expandPanelForSidebar, collapsePanelForSidebar } from '../geometry';
import { loadingEditorDisplayedText, successEditorDisplayedText } from '../editorText';
import {
  currentState,
  panel,
  libraryStorageId,
  matchesExtractStreamRequest,
  panelHasActiveRefine,
  panelRefineJobs,
  panelExtractJobs,
} from '../state';
import { commitPanelEvent } from '../dispatchPanel';
import { renderPanelFromState } from '../panelRenderBridge';
import { flashCopied, fallbackCopy } from '../copyFeedback';
import { updateDirtyChromeImmediate } from '../dirtyChrome';
import { applyVersionsListDensityUi, patchVersionList } from '../versionListUi';
import { armVersionListFlip, scrollVersionsListToTopInPanel } from '../hooks/useVersionListFlip';
import { suppressLibraryPanelRevRefresh } from '../libraryPanelRevGuard';
import { syncVersions } from '../versionsSync';
import type { DataActionHandler } from './types';

export const handleToggleVersionsDensity: DataActionHandler = ({ root }) => {
  const next = toggleVersionsListDensity(getCachedVersionsListDensity());
  void setVersionsListDensity(next).then(() => {
    const actionRoot = root.isConnected ? root : (panel ?? root);
    applyVersionsListDensityUi(actionRoot);
    patchVersionList();
  });
};

export const handleToggleVersions: DataActionHandler = () => {
  const nextState = commitPanelEvent({ type: 'ui.toggleVersionsOpen' });
  if (!nextState) return;
  const next = !!nextState.versionsOpen;

  if (next) expandPanelForSidebar();
  else collapsePanelForSidebar();

  renderPanelFromState(nextState);
};

export const handleSave: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const draft = state.draft ?? state.prompt ?? '';
  if (draft === state.prompt) return;
  void appendPromptVersionFromExtension(libraryStorageId(state), draft, 'edited').then(
    (updated) => {
      if (!updated || !currentState || currentState.sessionRequestId !== state.sessionRequestId)
        return;
      const wasOpen = currentState.versionsOpen;
      commitPanelEvent({
        type: 'versions.updated',
        prompt: updated.prompt,
        draft: updated.prompt,
        versions: updated.versions,
        selectedVersionId: updated.versions[0]?.id,
        versionsOpen: true,
      });
      if (!wasOpen) expandPanelForSidebar();
      renderPanelFromState(currentState!);
      flashCopied(el, '已保存 ✔');
    },
  );
};

export const handleCopyVersion: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const vid = el.dataset.versionId;
  const v = state.versions?.find((x) => x.id === vid);
  if (!v) return;
  navigator.clipboard
    .writeText(v.prompt)
    .then(() => flashCopied(el))
    .catch(() => fallbackCopy(v.prompt, el));
};

export const handleLoadOrSelectVersion: DataActionHandler = ({ root, el }) => {
  const state = currentState;
  if (!state) return;
  const vid = el.dataset.versionId;
  if (!currentState || !vid) return;

  const refineJid = parseRefineJobSentinel(vid);
  if (refineJid && panelRefineJobs(state).some((j) => j.jobId === refineJid)) {
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: vid });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) ta.value = successEditorDisplayedText(next);
    updateDirtyChromeImmediate();
    return;
  }

  const extractSid = parseExtractJobSentinel(vid);
  if (extractSid && matchesExtractStreamRequest(state, extractSid)) {
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: vid });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) {
      ta.value =
        state.status === 'success'
          ? successEditorDisplayedText(next)
          : loadingEditorDisplayedText(next);
    }
    updateDirtyChromeImmediate();
    return;
  }

  if (vid === REFINE_STREAM_VERSION_ID && panelHasActiveRefine(state)) {
    const first = panelRefineJobs(state)[0]?.jobId;
    const selId = first ? refineStreamSentinelForJob(first) : vid;
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: selId });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) ta.value = successEditorDisplayedText(next);
    updateDirtyChromeImmediate();
    return;
  }

  if (vid === EXTRACT_STREAM_VERSION_ID && panelExtractJobs(state).length > 0) {
    const first = panelExtractJobs(state)[0]?.streamRequestId;
    const selId = first ? extractStreamSentinelForJob(first) : vid;
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: selId });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) {
      ta.value =
        state.status === 'success'
          ? successEditorDisplayedText(next)
          : loadingEditorDisplayedText(next);
    }
    updateDirtyChromeImmediate();
    return;
  }

  const v = state.versions?.find((x) => x.id === vid);
  if (!v) return;

  if (panelHasActiveRefine(state)) {
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: vid });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) ta.value = v.prompt;
    updateDirtyChromeImmediate();
    return;
  }

  if (state.status === 'loading') {
    const next = commitPanelEvent({ type: 'ui.selectVersionId', selectedVersionId: vid });
    if (!next) return;
    const actionRoot = root.isConnected ? root : (panel ?? root);
    const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
    if (ta) ta.value = v.prompt;
    updateDirtyChromeImmediate();
    return;
  }

  commitPanelEvent({ type: 'ui.loadVersion', draft: v.prompt, selectedVersionId: vid });
  const actionRoot = root.isConnected ? root : (panel ?? root);
  const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
  if (ta) ta.value = v.prompt;
  updateDirtyChromeImmediate();
};

export const handleRestoreVersion: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const vid = el.dataset.versionId;
  if (!vid) return;
  void restorePromptVersionFromExtension(libraryStorageId(state), vid).then((updated) => {
    if (!updated || !currentState || currentState.sessionRequestId !== state.sessionRequestId)
      return;
    const wasOpen = currentState.versionsOpen;
    commitPanelEvent({
      type: 'versions.updated',
      prompt: updated.prompt,
      draft: updated.prompt,
      versions: updated.versions,
      selectedVersionId: updated.versions[0]?.id,
      versionsOpen: true,
    });
    if (!wasOpen) expandPanelForSidebar();
    suppressLibraryPanelRevRefresh();
    armVersionListFlip();
    renderPanelFromState(currentState!);
    scrollVersionsListToTopInPanel(panel);
    flashCopied(el, '已恢复 ✔');
  });
};

export const handleDeleteVersion: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const vid = el.dataset.versionId;
  if (!vid) return;
  if ((state.versions?.length || 0) <= 1) return;
  const isCurrent = state.versions?.[0]?.id === vid;
  const msg = isCurrent
    ? '确定删除「当前版本」吗？删除后将由下一条版本自动顶替为新的当前版本，此操作不可撤销'
    : '确定删除该版本吗？此操作不可撤销';
  if (!confirm(msg)) return;
  void removePromptVersionFromExtension(libraryStorageId(state), vid).then((updated) => {
    if (!currentState || currentState.sessionRequestId !== state.sessionRequestId) return;
    if (updated && isCurrent) {
      commitPanelEvent({
        type: 'versions.updated',
        prompt: updated.prompt,
        draft: updated.prompt,
        versions: updated.versions,
        selectedVersionId: updated.versions[0]?.id,
        versionsOpen: true,
      });
      renderPanelFromState(currentState!);
      flashCopied(el, '已切换到下一版本 ✔');
      return;
    }
    void syncVersions();
  });
};
