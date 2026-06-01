/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyFeedback } from './useCopyFeedback';
import { UI_COPY_FEEDBACK_MS } from '@/lib/uiFeedback';

describe('useCopyFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('highlights copied key then clears after shared duration', async () => {
    const { result } = renderHook(() => useCopyFeedback());

    await act(async () => {
      await result.current.onCopy('hello', 'k1');
    });
    expect(result.current.copiedKey).toBe('k1');

    act(() => {
      vi.advanceTimersByTime(UI_COPY_FEEDBACK_MS);
    });
    expect(result.current.copiedKey).toBeNull();
  });
});
