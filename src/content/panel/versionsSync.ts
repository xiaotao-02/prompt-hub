import { getHistoryItemFromExtension } from '@/content/extensionBridge';
import { EXTRACT_STREAM_VERSION_ID, REFINE_STREAM_VERSION_ID } from '@/lib/streamVersionSentinels';
import { currentState, libraryStorageId, panelExtractJobs, panelHasActiveRefine } from './state';
import { commitPanelEvent } from './dispatchPanel';
import { patchVersionList } from './versionListUi';

export async function syncVersions(): Promise<void> {
  try {
    const st = currentState;
    if (!st) return;
    const storageId = libraryStorageId(st);
    const item = await getHistoryItemFromExtension(storageId);
    if (!item) return;
    const stNow = currentState;
    if (!stNow) return;
    let nextSel = stNow.selectedVersionId;
    if (
      nextSel &&
      nextSel !== REFINE_STREAM_VERSION_ID &&
      nextSel !== EXTRACT_STREAM_VERSION_ID &&
      !nextSel.startsWith(`${REFINE_STREAM_VERSION_ID}:`) &&
      !nextSel.startsWith(`${EXTRACT_STREAM_VERSION_ID}:`) &&
      !item.versions.some((v) => v.id === nextSel)
    ) {
      nextSel = undefined;
    }
    const preserveRefine =
      panelHasActiveRefine(stNow) &&
      !!nextSel &&
      (nextSel === REFINE_STREAM_VERSION_ID || nextSel.startsWith(`${REFINE_STREAM_VERSION_ID}:`));
    const preserveExtract =
      panelExtractJobs(stNow).length > 0 &&
      !!nextSel &&
      (nextSel === EXTRACT_STREAM_VERSION_ID ||
        nextSel.startsWith(`${EXTRACT_STREAM_VERSION_ID}:`));
    const nextDraft = stNow.draft ?? item.prompt;
    if (!preserveRefine && !preserveExtract && !nextSel) {
      nextSel =
        nextDraft === item.prompt
          ? item.versions[0]?.id
          : item.versions.find((v) => v.prompt === nextDraft)?.id;
    }
    commitPanelEvent({
      type: 'versions.synced',
      versions: item.versions,
      prompt: item.prompt,
      draft: nextDraft,
      selectedVersionId: nextSel,
    });
    patchVersionList();
  } catch (err) {
    console.warn('[PromptHub] syncVersions failed', err);
  }
}
