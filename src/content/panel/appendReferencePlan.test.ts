import { describe, expect, it } from 'vitest';
import type { PanelState } from './state';
import {
  buildComposeAfterAppendReference,
  shouldEnqueueAppendReference,
} from './appendReferencePlan';

function baseState(patch: Partial<PanelState> = {}): PanelState {
  return {
    sessionRequestId: 'req-1',
    imageUrl: 'https://example.com/a.png',
    imageUrls: ['https://example.com/a.png'],
    status: 'compose',
    ...patch,
  };
}

describe('appendReferencePlan', () => {
  it('shouldEnqueueAppendReference when loading or extract jobs active', () => {
    expect(shouldEnqueueAppendReference(baseState({ status: 'loading' }))).toBe(true);
    expect(
      shouldEnqueueAppendReference(
        baseState({
          status: 'success',
          extractJobs: [{ streamRequestId: 'x', startedAt: 1 }],
        }),
      ),
    ).toBe(true);
    expect(shouldEnqueueAppendReference(baseState({ status: 'compose' }))).toBe(false);
    expect(shouldEnqueueAppendReference(null)).toBe(false);
  });

  it('buildComposeAfterAppendReference opens compose with single url when panel closed', () => {
    const next = buildComposeAfterAppendReference(null, 'https://example.com/b.png', 'new-id');
    expect(next).toEqual({
      sessionRequestId: 'new-id',
      imageUrl: 'https://example.com/b.png',
      imageUrls: ['https://example.com/b.png'],
      status: 'compose',
    });
  });

  it('buildComposeAfterAppendReference merges urls in compose state', () => {
    const cur = baseState({
      imageUrls: ['https://example.com/a.png'],
      imageUrl: 'https://example.com/a.png',
    });
    const next = buildComposeAfterAppendReference(cur, 'https://example.com/b.png', 'new-id');
    expect(next.sessionRequestId).toBe('req-1');
    expect(next.imageUrls).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
    expect(next.status).toBe('compose');
  });

  it('buildComposeAfterAppendReference merges urls from success state into compose', () => {
    const cur = baseState({
      status: 'success',
      prompt: 'old prompt',
      draft: 'old prompt',
      versions: [{ id: 'v1', prompt: 'old prompt', createdAt: 1, source: 'extracted' }],
      strategy: 'v036',
      oneClickRefineRandomness: 'moderate',
    });
    const next = buildComposeAfterAppendReference(cur, 'https://example.com/b.png', 'new-id');
    expect(next).toEqual({
      sessionRequestId: 'new-id',
      imageUrl: 'https://example.com/a.png',
      imageUrls: ['https://example.com/a.png', 'https://example.com/b.png'],
      status: 'compose',
      strategy: 'v036',
      oneClickRefineRandomness: 'moderate',
    });
    expect(next).not.toHaveProperty('prompt');
    expect(next).not.toHaveProperty('versions');
  });

  it('buildComposeAfterAppendReference merges urls from error state into compose', () => {
    const cur = baseState({
      status: 'error',
      error: 'boom',
      imageUrls: ['https://example.com/a.png'],
    });
    const next = buildComposeAfterAppendReference(cur, 'https://example.com/b.png', 'new-id');
    expect(next.status).toBe('compose');
    expect(next.imageUrls).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
    expect(next).not.toHaveProperty('error');
  });
});
