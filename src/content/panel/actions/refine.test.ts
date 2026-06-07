import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setCurrentState, type PanelState } from '../state';
import type { PromptVersion } from '@/lib/types';
import type { DataActionContext } from './types';

const { beginPanelReExtractFromSuccess, beginPanelRefineSession } = vi.hoisted(() => ({
  beginPanelReExtractFromSuccess: vi.fn(() => true),
  beginPanelRefineSession: vi.fn(),
}));

vi.mock('./copyAndRetry', () => ({
  beginPanelReExtractFromSuccess,
}));

vi.mock('../refineSession', () => ({
  beginPanelRefineSession,
}));

vi.mock('../panelRenderBridge', () => ({
  renderPanelFromState: vi.fn(),
}));

vi.mock('../dispatchPanel', () => ({
  commitPanelEvent: vi.fn(() => undefined),
}));

import { handleRunRefine } from './refine';
import { currentState } from '../state';

const versions: PromptVersion[] = [
  {
    id: 'v1',
    prompt: 'baseline prompt',
    createdAt: 1,
    source: 'extracted',
    meta: { provider: 'openai', model: 'gpt', style: 'natural-zh', strategy: 'v035' },
  },
];

function baseSuccessState(overrides: Partial<PanelState> = {}): PanelState {
  return {
    sessionRequestId: 'sess-1',
    imageUrl: 'https://example.com/a.png',
    imageUrls: ['https://example.com/a.png'],
    status: 'success',
    prompt: 'baseline prompt',
    draft: 'baseline prompt',
    versions,
    strategy: 'v036',
    outputStyle: 'natural-zh',
    refineInstruction: '',
    ...overrides,
  };
}

const ctx = {
  el: {} as HTMLElement,
  root: {} as HTMLElement,
  event: {} as MouseEvent,
} satisfies DataActionContext;

describe('handleRunRefine settings drift', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentState(baseSuccessState());
  });

  it('re-extracts when strategy drifted and references exist', () => {
    handleRunRefine(ctx);

    expect(beginPanelReExtractFromSuccess).toHaveBeenCalledWith(currentState);
    expect(beginPanelRefineSession).not.toHaveBeenCalled();
  });

  it('refines with synthetic instruction when only output style drifted', () => {
    setCurrentState(
      baseSuccessState({
        strategy: 'v035',
        outputStyle: 'json',
      }),
    );

    handleRunRefine(ctx);

    expect(beginPanelReExtractFromSuccess).not.toHaveBeenCalled();
    expect(beginPanelRefineSession).toHaveBeenCalledOnce();
    const [, , instruction] = beginPanelRefineSession.mock.calls[0]!;
    expect(instruction).toContain('JSON（英文）');
    expect(instruction).toContain('自然语言（中文）');
  });
});
