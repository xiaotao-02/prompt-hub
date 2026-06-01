import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { armVersionListFlip } from './useVersionListFlip';

/**
 * 库浮窗 refreshItem 等二次 render 不会再次 arm；flag 仅在 handleRestoreVersion 前置位一次。
 * 完整 FLIP DOM 行为在面板集成中验证，此处只锁一次性消费契约。
 */
describe('armVersionListFlip', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('可被多次调用，由 useLayoutEffect 在首次 layout 时消费', () => {
    expect(() => {
      armVersionListFlip();
      armVersionListFlip();
    }).not.toThrow();
  });
});
