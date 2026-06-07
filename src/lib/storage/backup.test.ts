import { describe, expect, it } from 'vitest';
import type { AppSettings, HistoryItem } from '../types';
import { dedupeForRestore, parseBackupPayload } from './backup';
import { migrateItem } from './history';

const minimalSettings = { x: 1 } as unknown as AppSettings;

describe('parseBackupPayload', () => {
  it('coerces numeric version strings', () => {
    const p = parseBackupPayload({
      version: '2',
      exportedAt: '2020-01-01T00:00:00.000Z',
      settings: minimalSettings,
      history: [],
      folders: [],
    });
    expect(p.version).toBe(2);
  });

  it('infers v3 when version invalid but strategyPresets exists', () => {
    const p = parseBackupPayload({
      version: 'nope',
      settings: minimalSettings,
      history: [],
      strategyPresets: [],
    });
    expect(p.version).toBe(3);
  });

  it('infers v2 when version invalid but folders exists', () => {
    const p = parseBackupPayload({
      settings: minimalSettings,
      history: [],
      folders: [{ id: 'a', name: 'A', parentId: null, createdAt: 0 }],
    });
    expect(p.version).toBe(2);
  });

  it('defaults to v1 when version invalid and no v2/v3 markers', () => {
    const p = parseBackupPayload({
      settings: minimalSettings,
      history: [],
    });
    expect(p.version).toBe(1);
  });

  it('throws when settings missing', () => {
    expect(() => parseBackupPayload({ history: [] })).toThrow(/settings/);
  });

  it('throws when history entry is invalid', () => {
    expect(() =>
      parseBackupPayload({
        settings: minimalSettings,
        history: [{ id: '', prompt: 1 }],
      }),
    ).toThrow(/history\[0\]/);
  });
});

describe('dedupeForRestore', () => {
  const base = (id: string, imageUrl: string, createdAt: number): HistoryItem => ({
    id,
    imageUrl,
    thumbnail: imageUrl,
    prompt: `prompt-${id}`,
    provider: 'openai',
    model: 'gpt-4o',
    style: 'natural-zh',
    pageUrl: '',
    pageTitle: '',
    createdAt,
    versions: [
      {
        id: `${id}:v0`,
        prompt: `prompt-${id}`,
        versionNo: 0,
        createdAt,
        source: 'extracted',
      },
    ],
  });

  it('merges duplicate imageUrl entries and keeps newer winner', () => {
    const url = 'https://example.com/same-image.jpg';
    const list = [base('a', url, 100), base('b', url, 200)];
    const out = dedupeForRestore(list.map(migrateItem));
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('b');
    expect(out[0].versions).toHaveLength(2);
  });

  it('does not merge entries without shared natural dedupe key', () => {
    const list = [
      base('a', 'https://example.com/a.jpg', 100),
      base('b', 'https://example.com/b.jpg', 200),
    ];
    const out = dedupeForRestore(list.map(migrateItem));
    expect(out).toHaveLength(2);
  });
});

describe('migrateItem meta backfill', () => {
  it('fills meta on extracted versions from item top-level fields', () => {
    const raw: HistoryItem = {
      id: 'item-1',
      imageUrl: '',
      thumbnail: '',
      prompt: 'top',
      provider: 'openai',
      model: 'gpt-4o',
      style: 'natural-zh',
      pageUrl: '',
      pageTitle: '',
      createdAt: 100,
      versions: [
        {
          id: 'v1',
          prompt: 'a',
          createdAt: 100,
          source: 'extracted',
        },
      ],
    };
    const m = migrateItem(raw);
    expect(m.versions[0]?.meta?.provider).toBe('openai');
    expect(m.versions[0]?.meta?.model).toBe('gpt-4o');
    expect(m.versions[0]?.meta?.style).toBe('natural-zh');
  });

  it('preserves optional imageUrls on multi-ref items', () => {
    const raw: HistoryItem = {
      id: 'multi-1',
      imageUrl: 'thumb-a',
      thumbnail: 'thumb-a',
      imageUrls: ['thumb-a', 'thumb-b'],
      prompt: 'p',
      provider: 'openai',
      model: 'gpt-4o',
      style: 'natural-zh',
      pageUrl: '',
      pageTitle: '',
      createdAt: 100,
      versions: [
        {
          id: 'v1',
          prompt: 'p',
          createdAt: 100,
          source: 'extracted',
        },
      ],
    };
    const m = migrateItem(raw);
    expect(m.imageUrls).toEqual(['thumb-a', 'thumb-b']);
  });
});
