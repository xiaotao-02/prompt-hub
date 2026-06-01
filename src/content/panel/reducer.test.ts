import { describe, expect, it } from 'vitest';
import { extractStreamSentinelForJob } from '@/lib/streamVersionSentinels';
import type { PanelState } from './state';
import { panelReducer } from './panelReducer';

function baseState(patch: Partial<PanelState> = {}): PanelState {
  return {
    sessionRequestId: 'request-1',
    imageUrl: 'https://example.com/a.png',
    imageUrls: ['https://example.com/a.png'],
    status: 'loading',
    extractJobs: [{ streamRequestId: 'request-1', startedAt: 1 }],
    stage: 'calling',
    startedAt: 1,
    ...patch,
  };
}

describe('panelReducer extract transitions', () => {
  it('patches the tracked extract job progress', () => {
    const transition = panelReducer(baseState(), {
      type: 'extract.progress',
      streamRequestId: 'request-1',
      patch: {
        stage: 'streaming',
        partial: 'half prompt',
        provider: 'openai',
        model: 'gpt-image',
      },
    });

    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.lightExtract).toBe(true);
    expect(transition.state.provider).toBe('openai');
    expect(transition.state.model).toBe('gpt-image');
    expect(transition.state.extractJobs?.[0]).toMatchObject({
      streamRequestId: 'request-1',
      stage: 'streaming',
      partial: 'half prompt',
    });
  });

  it('turns a tracked extract result into success state', () => {
    const selectedVersionId = extractStreamSentinelForJob('request-1');
    const transition = panelReducer(baseState({ selectedVersionId }), {
      type: 'extract.result',
      streamRequestId: 'request-1',
      result: { prompt: 'final prompt', provider: 'minimax', model: 'MiniMax-VL-01' },
    });

    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.shouldSyncVersions).toBe(true);
    expect(transition.shouldMergePendingAppendUrls).toBe(true);
    expect(transition.state).toMatchObject({
      status: 'success',
      prompt: 'final prompt',
      draft: 'final prompt',
      provider: 'minimax',
      model: 'MiniMax-VL-01',
      selectedVersionId: undefined,
      extractJobs: undefined,
    });
  });

  it('turns the last empty loading extract failure into error state', () => {
    const transition = panelReducer(baseState(), {
      type: 'extract.error',
      streamRequestId: 'request-1',
      error: 'boom',
    });

    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.shouldMergePendingAppendUrls).toBe(true);
    expect(transition.state.status).toBe('error');
    expect(transition.state.error).toBe('boom');
  });

  it('keeps loading state when another extract job is still running', () => {
    const transition = panelReducer(
      baseState({
        extractJobs: [
          { streamRequestId: 'request-1', startedAt: 1 },
          { streamRequestId: 'request-2', startedAt: 2 },
        ],
      }),
      {
        type: 'extract.error',
        streamRequestId: 'request-1',
        error: 'boom',
      },
    );

    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.shouldMergePendingAppendUrls).toBe(false);
    expect(transition.state.status).toBe('loading');
    expect(transition.state.extractJobs).toEqual([{ streamRequestId: 'request-2', startedAt: 2 }]);
  });

  it('ignores stale extract events', () => {
    const transition = panelReducer(baseState(), {
      type: 'extract.progress',
      streamRequestId: 'stale',
      patch: { partial: 'ignored' },
    });

    expect(transition.changed).toBe(false);
  });
});

describe('panelReducer ui transitions', () => {
  it('toggles versions sidebar open state', () => {
    const transition = panelReducer(
      { ...baseState(), status: 'success', prompt: 'p', versionsOpen: false },
      { type: 'ui.toggleVersionsOpen' },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.versionsOpen).toBe(true);
  });

  it('updates strategy without touching unrelated fields', () => {
    const transition = panelReducer(
      { ...baseState(), status: 'success', prompt: 'p', strategy: 'classic' },
      { type: 'ui.strategy', strategy: 'v030' },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.strategy).toBe('v030');
    expect(transition.state.prompt).toBe('p');
  });

  it('tracks draft edits and clears stale version selection', () => {
    const transition = panelReducer(
      {
        ...baseState(),
        status: 'success',
        prompt: 'canonical',
        draft: 'canonical',
        selectedVersionId: 'v1',
        versions: [{ id: 'v1', prompt: 'canonical', createdAt: 1, source: 'extracted' }],
      },
      { type: 'ui.setDraft', draft: 'edited', selectedVersionId: null },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.draft).toBe('edited');
    expect(transition.state.selectedVersionId).toBeUndefined();
  });
});

describe('panelReducer reference and history transitions', () => {
  it('reference.setUrls updates imageUrls', () => {
    const transition = panelReducer(baseState(), {
      type: 'reference.setUrls',
      imageUrls: ['https://a.test/1.png', 'https://a.test/2.png'],
      imageUrl: 'https://a.test/1.png',
    });
    expect(transition.changed).toBe(true);
    if (transition.changed) {
      expect(transition.state.imageUrls).toHaveLength(2);
    }
  });

  it('history.prefetch sets prefetchStorageId and versions', () => {
    const transition = panelReducer(baseState({ status: 'loading', sessionRequestId: 'req-1' }), {
      type: 'history.prefetch',
      sessionRequestId: 'req-1',
      prefetchStorageId: 'db-1',
      versions: [{ id: 'v1', prompt: 'p', versionNo: 1, createdAt: 1, source: 'extracted' }],
      prompt: 'p',
    });
    expect(transition.changed).toBe(true);
    if (transition.changed) {
      expect(transition.state.prefetchStorageId).toBe('db-1');
      expect(transition.state.versions).toHaveLength(1);
    }
  });

  it('refine.progress patches matching job', () => {
    const transition = panelReducer(
      baseState({
        refineJobs: [
          {
            jobId: 'j1',
            kind: 'instructed',
            startedAt: 1,
            refineBaselinePrompt: 'base',
            partial: 'old',
          },
        ],
      }),
      { type: 'refine.progress', refineJobId: 'j1', partial: 'new' },
    );
    expect(transition.changed).toBe(true);
    if (transition.changed) {
      expect(transition.state.refineJobs?.[0]?.partial).toBe('new');
    }
  });
});

describe('panelReducer refine transitions', () => {
  it('enqueues a refine job and opens versions sidebar', () => {
    const transition = panelReducer(
      { ...baseState(), status: 'success', prompt: 'baseline', draft: 'baseline' },
      {
        type: 'refine.enqueue',
        job: {
          jobId: 'job-1',
          kind: 'instructed',
          stage: 'calling',
          startedAt: 1,
          refineBaselinePrompt: 'baseline',
          refineInstructionSnapshot: 'make it shorter',
        },
        refineInstruction: 'make it shorter',
      },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.refineJobs).toHaveLength(1);
    expect(transition.state.versionsOpen).toBe(true);
    expect(transition.state.selectedVersionId).toBe('__pe_refine_stream__:job-1');
  });

  it('completes a refine job into success prompt state', () => {
    const transition = panelReducer(
      {
        ...baseState(),
        status: 'success',
        prompt: 'old',
        draft: 'old',
        refineJobs: [
          {
            jobId: 'job-1',
            kind: 'instructed',
            startedAt: 1,
            refineBaselinePrompt: 'old',
          },
        ],
        selectedVersionId: '__pe_refine_stream__:job-1',
      },
      {
        type: 'refine.complete',
        jobId: 'job-1',
        prompt: 'new prompt',
        versionId: 'v-new',
        prevSelectedVersionId: '__pe_refine_stream__:job-1',
      },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.prompt).toBe('new prompt');
    expect(transition.state.draft).toBe('new prompt');
    expect(transition.state.refineJobs).toBeUndefined();
    expect(transition.state.selectedVersionId).toBe('v-new');
  });

  it('removes a failed refine job and stores the error', () => {
    const transition = panelReducer(
      {
        ...baseState(),
        status: 'success',
        prompt: 'p',
        refineJobs: [
          {
            jobId: 'job-1',
            kind: 'instructed',
            startedAt: 1,
            refineBaselinePrompt: 'p',
          },
        ],
      },
      { type: 'refine.dequeue', jobId: 'job-1', refineError: 'network down' },
    );
    expect(transition.changed).toBe(true);
    if (!transition.changed) return;
    expect(transition.state.refineJobs).toBeUndefined();
    expect(transition.state.refineError).toBe('network down');
  });
});
