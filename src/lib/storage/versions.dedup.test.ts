import { describe, expect, it } from 'vitest';
import type { HistoryItem } from '../types';

/**
 * appendPromptVersion 去重逻辑与 runRefine 的 unchanged 判定对齐（纯函数镜像，避免 IDB）。
 */
function wouldSkipNewVersion(item: HistoryItem, prompt: string): boolean {
  const trimmed = prompt.replace(/\s+$/g, '');
  return trimmed === item.prompt.replace(/\s+$/g, '');
}

describe('appendPromptVersion dedup (mirror)', () => {
  const item = {
    prompt: 'thin leaves, dark bark',
    versions: [{ id: 'v1', prompt: 'thin leaves, dark bark', versionNo: 1 }],
  } as HistoryItem;

  it('skips when model output matches current prompt (trim trailing ws)', () => {
    expect(wouldSkipNewVersion(item, 'thin leaves, dark bark')).toBe(true);
    expect(wouldSkipNewVersion(item, 'thin leaves, dark bark\n')).toBe(true);
  });

  it('allows when output differs', () => {
    expect(wouldSkipNewVersion(item, 'thin translucent leaves')).toBe(false);
  });
});
