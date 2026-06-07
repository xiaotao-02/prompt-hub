import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { HistoryItem } from '../types';
import {
  bulkPutHistoryItems,
  bulkReplaceHistory,
  exportAllHistoryPublic,
  historyCount,
  resetHistoryDbForTests,
} from './historyDb';

function sampleItem(id: string, imageUrl: string): HistoryItem {
  return {
    id,
    prompt: `prompt-${id}`,
    provider: 'openai',
    model: 'gpt-4o',
    style: 'natural-zh',
    imageUrl,
    thumbnail: imageUrl,
    pageUrl: 'https://example.com',
    pageTitle: 'Example',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [
      {
        id: `${id}:v0`,
        prompt: `prompt-${id}`,
        versionNo: 0,
        createdAt: Date.now(),
        source: 'extracted',
      },
    ],
  };
}

describe('historyDb bulkReplaceHistory', () => {
  beforeEach(() => {
    resetHistoryDbForTests();
  });

  it('replaces all records atomically on success', async () => {
    await bulkPutHistoryItems([sampleItem('a', 'https://img/a.jpg')]);
    await bulkReplaceHistory([
      sampleItem('b', 'https://img/b.jpg'),
      sampleItem('c', 'https://img/c.jpg'),
    ]);
    expect(await historyCount()).toBe(2);
    const all = await exportAllHistoryPublic();
    expect(all.map((x) => x.id).sort()).toEqual(['b', 'c']);
  });

  it('clears store when replacing with an empty list atomically', async () => {
    await bulkPutHistoryItems([sampleItem('a', 'https://img/a.jpg')]);
    await bulkReplaceHistory([]);
    expect(await historyCount()).toBe(0);
  });
});
