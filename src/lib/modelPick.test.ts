import { describe, expect, it } from 'vitest';
import type { AppSettings } from './types';
import { PROVIDERS } from './providers';
import { DEFAULT_UPDATE_SETTINGS } from './updater';
import { sortModelsGroupedNewestFirst } from './api/modelSort';
import { buildVisionById } from './modelVision';
import {
  applyAutoModelPickToDraft,
  isUnresolvedModel,
  pickDefaultModelFromDiscovered,
  shouldHighlightFetchModelsButton,
} from './modelPick';

describe('isUnresolvedModel', () => {
  it('treats empty and default placeholder as unresolved', () => {
    expect(isUnresolvedModel('custom', '', [])).toBe(true);
    expect(isUnresolvedModel('custom', 'your-model', [])).toBe(true);
  });

  it('treats model not in discovered list as unresolved', () => {
    expect(isUnresolvedModel('openai', 'gpt-4o', ['gpt-4o-mini'])).toBe(true);
  });

  it('treats built-in defaultModel as unresolved until endpoint confirms it', () => {
    expect(isUnresolvedModel('openai', 'gpt-5.5', ['gpt-4o-mini', 'gpt-4o'])).toBe(true);
    expect(isUnresolvedModel('openai', 'gpt-5.5', ['gpt-5.5', 'gpt-4o-mini'])).toBe(false);
  });

  it('keeps valid discovered model', () => {
    expect(isUnresolvedModel('openai', 'gpt-4o-mini', ['gpt-4o-mini', 'gpt-4o'])).toBe(false);
  });
});

describe('shouldHighlightFetchModelsButton', () => {
  it('highlights when discovered list exists and model is unresolved', () => {
    expect(
      shouldHighlightFetchModelsButton('openai', 'your-model', ['gpt-4o-mini', 'gpt-4o']),
    ).toBe(true);
  });

  it('does not highlight while fetching or when model is already valid', () => {
    expect(
      shouldHighlightFetchModelsButton('openai', 'your-model', ['gpt-4o-mini'], {
        fetching: true,
      }),
    ).toBe(false);
    expect(
      shouldHighlightFetchModelsButton('openai', 'gpt-4o-mini', ['gpt-4o-mini', 'gpt-4o']),
    ).toBe(false);
  });
});

describe('pickDefaultModelFromDiscovered', () => {
  it('prefers newest vision-capable model for extract purpose', () => {
    const visionIds = ['text-embedding-3-small', 'gpt-4o-mini', 'gpt-5.5', 'gpt-4o'];
    const byId = buildVisionById('openai', visionIds);
    expect(pickDefaultModelFromDiscovered('openai', visionIds, byId, { purpose: 'vision' })).toBe(
      'gpt-5.5',
    );
  });

  it('uses created timestamps when entries are provided', () => {
    const visionIds = ['gpt-4o', 'gpt-5.5'];
    const byId = buildVisionById('openai', visionIds);
    const picked = pickDefaultModelFromDiscovered('openai', visionIds, byId, {
      purpose: 'vision',
      entries: [
        { id: 'gpt-4o', created: 1_700_000_000 },
        { id: 'gpt-5.5', created: 1_800_000_000 },
      ],
    });
    expect(picked).toBe('gpt-5.5');
  });

  it('prefers stable -latest alias when only variant snapshots exist', () => {
    const visionIds = ['claude-sonnet-4-6-20260217', 'claude-sonnet-4-6-latest'];
    const byId = buildVisionById('anthropic', visionIds);
    expect(
      pickDefaultModelFromDiscovered('anthropic', visionIds, byId, { purpose: 'vision' }),
    ).toBe('claude-sonnet-4-6-latest');
  });

  it('avoids embed models for text purpose and prefers fast chat models', () => {
    const textIds = ['text-embedding-3-small', 'gpt-3.5-turbo', 'claude-3-5-haiku-latest'];
    const byId = buildVisionById('openai', textIds);
    const picked = pickDefaultModelFromDiscovered('openai', textIds, byId, { purpose: 'text' });
    expect(picked).not.toBe('text-embedding-3-small');
    expect(['claude-3-5-haiku-latest', 'gpt-3.5-turbo']).toContain(picked);
  });

  it('returns null for empty list', () => {
    expect(pickDefaultModelFromDiscovered('custom', [], {}, { purpose: 'vision' })).toBeNull();
  });

  it('replaces your-model scenario picks from custom list', () => {
    const customIds = ['gpt-5.5', 'some-chat-model'];
    const byId = buildVisionById('custom', customIds);
    const picked = pickDefaultModelFromDiscovered('custom', customIds, byId, {
      purpose: 'vision',
    });
    expect(picked).toBe('gpt-5.5');
    expect(isUnresolvedModel('custom', 'your-model', customIds)).toBe(true);
  });

  it('vision purpose falls back to newest model when all are no_vision', () => {
    const noVisionIds = ['text-embedding-3-small', 'whisper-1'];
    const byId = buildVisionById('custom', noVisionIds);
    const newest = sortModelsGroupedNewestFirst(noVisionIds.map((id) => ({ id })))[0];
    const picked = pickDefaultModelFromDiscovered('custom', noVisionIds, byId, {
      purpose: 'vision',
    });
    expect(picked).not.toBeNull();
    expect(picked).toBe(newest);
  });

  it('vision purpose never returns null for non-empty list', () => {
    const ids = ['model-a', 'model-b'];
    const byId = buildVisionById('custom', ids);
    expect(
      pickDefaultModelFromDiscovered('custom', ids, byId, { purpose: 'vision' }),
    ).not.toBeNull();
  });
});

function draftWithOpenAiModel(model: string): AppSettings {
  const providers = Object.fromEntries(
    Object.values(PROVIDERS).map((p) => [
      p.id,
      {
        id: p.id,
        apiKey: p.id === 'openai' ? 'sk-test' : '',
        baseUrl: p.defaultBaseUrl,
        model: p.id === 'openai' ? model : p.defaultModel,
      },
    ]),
  ) as AppSettings['providers'];
  return {
    activeProvider: 'openai',
    providers,
    outputStyle: 'natural-zh',
    customPromptTemplate: '',
    saveHistory: true,
    updates: { ...DEFAULT_UPDATE_SETTINGS },
    promptStrategy: 'v036',
    panelAutofocus: true,
    popupToolbarPromptAction: 'library',
    oneClickRewriteRandomness: 'moderate',
    customComponents: {
      stylePromptSet: 'v0.3.0',
      sampling: 'v0.3.0',
      customJoin: 'v0.3.0',
    },
  };
}

describe('applyAutoModelPickToDraft', () => {
  const visionIds = ['text-embedding-3-small', 'gpt-4o-mini', 'gpt-5.5', 'gpt-4o'];
  const visionById = buildVisionById('openai', visionIds);

  it('without force keeps valid resolved model unchanged', () => {
    const draft = draftWithOpenAiModel('gpt-4o-mini');
    const result = applyAutoModelPickToDraft(draft, 'openai', visionIds, visionById, 'vision');
    expect(result.hint).toBeNull();
    expect(result.draft.providers.openai.model).toBe('gpt-4o-mini');
  });

  it('with force overwrites valid model to newest vision pick', () => {
    const draft = draftWithOpenAiModel('gpt-4o-mini');
    const result = applyAutoModelPickToDraft(draft, 'openai', visionIds, visionById, 'vision', {
      force: true,
    });
    expect(result.hint).toContain('gpt-5.5');
    expect(result.draft.providers.openai.model).toBe('gpt-5.5');
  });

  it('with force is idempotent when already on picked model', () => {
    const draft = draftWithOpenAiModel('gpt-5.5');
    const result = applyAutoModelPickToDraft(draft, 'openai', visionIds, visionById, 'vision', {
      force: true,
    });
    expect(result.hint).toBeNull();
    expect(result.draft.providers.openai.model).toBe('gpt-5.5');
  });
});
