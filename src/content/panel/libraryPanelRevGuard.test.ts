import { describe, expect, it } from 'vitest';
import type { PanelState } from './state';
import {
  libraryPanelPromptInSync,
  shouldScheduleLibraryPanelStabilize,
  shouldSuppressLibraryPanelRevRefresh,
  suppressLibraryPanelRevRefresh,
  versionsSnapshotEqual,
} from './libraryPanelRevGuard';

describe('libraryPanelRevGuard', () => {
  it('suppressLibraryPanelRevRefresh blocks until window expires', () => {
    suppressLibraryPanelRevRefresh(50_000);
    expect(shouldSuppressLibraryPanelRevRefresh()).toBe(true);
  });

  it('versionsSnapshotEqual compares id and versionNo order', () => {
    const a = [
      { id: 'a', versionNo: 2, prompt: 'p', createdAt: 1, source: 'edited' as const },
      { id: 'b', versionNo: 1, prompt: 'q', createdAt: 0, source: 'edited' as const },
    ];
    const b = [
      { id: 'a', versionNo: 2, prompt: 'other', createdAt: 1, source: 'edited' as const },
      { id: 'b', versionNo: 1, prompt: 'q', createdAt: 0, source: 'edited' as const },
    ];
    expect(versionsSnapshotEqual(a, b)).toBe(true);
    expect(versionsSnapshotEqual(a, [b[1], b[0]])).toBe(false);
  });

  it('libraryPanelPromptInSync matches prompt and version snapshot', () => {
    const state = {
      sessionRequestId: 'h1',
      imageUrl: '',
      imageUrls: [],
      status: 'success',
      prompt: 'hello',
      versions: [{ id: 'v1', versionNo: 1, prompt: 'hello', createdAt: 1, source: 'edited' }],
    } satisfies PanelState;
    expect(
      libraryPanelPromptInSync(state, {
        prompt: 'hello',
        versions: state.versions,
      }),
    ).toBe(true);
    expect(libraryPanelPromptInSync(state, { prompt: 'other', versions: state.versions })).toBe(
      false,
    );
  });

  it('shouldScheduleLibraryPanelStabilize skips pure version reorder', () => {
    const base = {
      sessionRequestId: 'h1',
      imageUrl: '',
      imageUrls: [],
      status: 'success',
      prompt: 'same',
      draft: 'same',
      versionsOpen: true,
      refineOpen: true,
      versions: [{ id: 'v1', versionNo: 1, prompt: 'same', createdAt: 1, source: 'edited' }],
    } satisfies PanelState;
    const reordered = {
      ...base,
      versions: [
        { id: 'v2', versionNo: 2, prompt: 'same', createdAt: 2, source: 'restored' as const },
      ],
    };
    expect(shouldScheduleLibraryPanelStabilize(base, reordered)).toBe(false);
    expect(shouldScheduleLibraryPanelStabilize(base, { ...base, draft: 'same longer' })).toBe(true);
  });
});
