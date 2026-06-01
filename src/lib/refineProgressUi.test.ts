import { describe, expect, it } from 'vitest';
import { pickRefineJobForUi, refineStageHint, refineStageProgress } from '@/lib/refineProgressUi';
import { refineAwareEditorBody, refineStreamSentinelForJob } from '@/lib/streamVersionSentinels';

describe('refineProgressUi', () => {
  it('pickRefineJobForUi prefers selected sentinel job', () => {
    const jobs = [
      { jobId: 'a', startedAt: 1 },
      { jobId: 'b', startedAt: 2 },
    ];
    expect(pickRefineJobForUi(jobs, refineStreamSentinelForJob('b'))?.jobId).toBe('b');
    expect(pickRefineJobForUi(jobs, null)?.jobId).toBe('a');
  });

  it('refineStageProgress follows panel stages', () => {
    expect(refineStageProgress('calling', false)).toBe(0.42);
    expect(refineStageProgress('streaming', false)).toBe(0.55);
    expect(refineStageProgress('streaming', true)).toBe(0.78);
  });

  it('refineStageHint shows thinking before partial', () => {
    expect(refineStageHint('streaming', false)).toBe('模型思考中…');
    expect(refineStageHint('streaming', true)).toBe('正在接收模型回复…');
  });
});

describe('refineAwareEditorBody', () => {
  const versions = [
    { id: 'v1', prompt: 'old prompt' },
    { id: 'v2', prompt: 'current prompt' },
  ];
  const refineJobs = [
    {
      jobId: 'job-1',
      partial: 'streaming text',
      refineBaselinePrompt: 'baseline',
    },
  ];

  it('shows history version when refining and history row selected', () => {
    expect(
      refineAwareEditorBody({
        versions,
        refineJobs,
        selectedVersionId: 'v1',
        draft: 'current prompt',
        prompt: 'current prompt',
      }),
    ).toBe('old prompt');
  });

  it('shows stream partial when generating job selected', () => {
    expect(
      refineAwareEditorBody({
        versions,
        refineJobs,
        selectedVersionId: refineStreamSentinelForJob('job-1'),
        draft: 'current prompt',
        prompt: 'current prompt',
      }),
    ).toBe('streaming text');
  });

  it('shows draft when not refining', () => {
    expect(
      refineAwareEditorBody({
        versions,
        refineJobs: [],
        selectedVersionId: null,
        draft: 'edited',
        prompt: 'stored',
      }),
    ).toBe('edited');
  });
});
