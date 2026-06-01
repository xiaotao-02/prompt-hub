import { describe, expect, it } from 'vitest';
import { BUFFERED_STREAM_HINT, refineStageHint } from '@/lib/refineProgressUi';
import { stageHint } from './loading';

describe('streamMode buffered hints', () => {
  it('stageHint shows buffered message before partial arrives', () => {
    expect(stageHint('streaming', false, 'buffered')).toBe(BUFFERED_STREAM_HINT);
  });

  it('stageHint prefers partial message when text exists', () => {
    expect(stageHint('streaming', true, 'buffered')).toBe('正在接收模型回复…');
  });

  it('refineStageHint shows buffered message before partial arrives', () => {
    expect(refineStageHint('streaming', false, 'buffered')).toBe(BUFFERED_STREAM_HINT);
  });
});
