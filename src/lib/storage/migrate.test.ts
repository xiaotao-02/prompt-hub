import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryItem } from '../types';
import { HISTORY_KEY } from './history';
import { ensureLibraryReady, historyCount, resetLibraryReadyForTests } from './history';
import { resetHistoryDbForTests } from './historyDb';

const HISTORY_IDB_MIGRATED_KEY = 'history_idb_migrated_v1';

function legacyItem(id: string): HistoryItem {
  return {
    id,
    prompt: `legacy-${id}`,
    provider: 'openai',
    model: 'gpt-4o',
    style: 'natural-zh',
    imageUrl: `https://legacy/${id}.jpg`,
    thumbnail: `https://legacy/${id}.jpg`,
    pageUrl: 'https://legacy.example',
    pageTitle: 'Legacy',
    createdAt: 1,
    updatedAt: 1,
    versions: [
      {
        id: `${id}:v0`,
        prompt: `legacy-${id}`,
        versionNo: 0,
        createdAt: 1,
        source: 'extracted',
      },
    ],
  };
}

describe('ensureLibraryReady migration', () => {
  beforeEach(() => {
    resetHistoryDbForTests();
    resetLibraryReadyForTests();
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          data: {} as Record<string, unknown>,
          async get(keys: string | string[]) {
            const list = Array.isArray(keys) ? keys : [keys];
            const out: Record<string, unknown> = {};
            for (const k of list) out[k] = this.data[k];
            return out;
          },
          async set(obj: Record<string, unknown>) {
            Object.assign(this.data, obj);
          },
          async remove(keys: string | string[]) {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) delete this.data[k];
          },
        },
        onChanged: { addListener: vi.fn() },
      },
    });
  });

  it('migrates legacy chrome.storage history into IndexedDB', async () => {
    const chromeMock = (
      globalThis as unknown as { chrome: { storage: { local: { data: Record<string, unknown> } } } }
    ).chrome;
    chromeMock.storage.local.data[HISTORY_KEY] = [legacyItem('m1'), legacyItem('m2')];

    await ensureLibraryReady();

    expect(await historyCount()).toBe(2);
    expect(chromeMock.storage.local.data[HISTORY_KEY]).toBeUndefined();
    expect(chromeMock.storage.local.data[HISTORY_IDB_MIGRATED_KEY]).toBeTruthy();
  });
});
