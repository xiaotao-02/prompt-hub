import { describe, expect, it } from 'vitest';
import {
  buildOutputStyleReflowInstruction,
  buildStrategyStyleReflowInstruction,
  detectPromptSettingsDrift,
  effectiveOutputStyleForReflow,
  resolveDisplayedVersionMeta,
} from './panelSettingsReflow';
import type { PromptVersion } from './types';

const versions: PromptVersion[] = [
  {
    id: 'v1',
    prompt: 'p1',
    createdAt: 1,
    source: 'extracted',
    meta: { provider: 'openai', model: 'gpt', style: 'natural-zh', strategy: 'v035' },
  },
  {
    id: 'v2',
    prompt: 'p2',
    createdAt: 2,
    source: 'refined',
    meta: { provider: 'openai', model: 'gpt', style: 'json', strategy: 'v035' },
  },
];

describe('resolveDisplayedVersionMeta', () => {
  it('uses selected version meta when not a stream sentinel', () => {
    expect(resolveDisplayedVersionMeta(versions, 'v2')).toEqual({
      strategy: 'v035',
      style: 'json',
    });
  });

  it('falls back to head version when sentinel selected', () => {
    expect(resolveDisplayedVersionMeta(versions, '__pe_extract_stream__:x')).toEqual({
      strategy: 'v035',
      style: 'natural-zh',
    });
  });

  it('returns empty when no versions', () => {
    expect(resolveDisplayedVersionMeta([], undefined)).toEqual({});
  });
});

describe('detectPromptSettingsDrift', () => {
  it('detects strategy change', () => {
    const drift = detectPromptSettingsDrift({
      strategy: 'v036',
      outputStyle: 'natural-zh',
      versions,
      selectedVersionId: 'v1',
    });
    expect(drift.strategyChanged).toBe(true);
    expect(drift.outputStyleChanged).toBe(false);
  });

  it('detects output style only when strategy unchanged', () => {
    const drift = detectPromptSettingsDrift({
      strategy: 'v035',
      outputStyle: 'json',
      versions,
      selectedVersionId: 'v1',
    });
    expect(drift.strategyChanged).toBe(false);
    expect(drift.outputStyleChanged).toBe(true);
  });

  it('ignores output style drift under native strategy', () => {
    const nativeVersions: PromptVersion[] = [
      {
        id: 'n1',
        prompt: 'p',
        createdAt: 1,
        source: 'extracted',
        meta: { provider: 'openai', model: 'gpt', style: 'natural-zh', strategy: 'native' },
      },
    ];
    const drift = detectPromptSettingsDrift({
      strategy: 'native',
      outputStyle: 'json',
      versions: nativeVersions,
    });
    expect(drift.outputStyleChanged).toBe(false);
  });

  it('no drift when settings match meta', () => {
    const drift = detectPromptSettingsDrift({
      strategy: 'v035',
      outputStyle: 'natural-zh',
      versions,
      selectedVersionId: 'v1',
    });
    expect(drift.strategyChanged).toBe(false);
    expect(drift.outputStyleChanged).toBe(false);
  });
});

describe('effectiveOutputStyleForReflow', () => {
  it('forces natural-zh for native', () => {
    expect(effectiveOutputStyleForReflow('native', 'json')).toBe('natural-zh');
  });
});

describe('build*Instruction', () => {
  it('includes target output style labels', () => {
    const t = buildOutputStyleReflowInstruction('natural-zh', 'json');
    expect(t).toContain('自然语言（中文）');
    expect(t).toContain('JSON（英文）');
  });

  it('includes strategy labels for fallback refine', () => {
    const t = buildStrategyStyleReflowInstruction('v035', 'v036', 'natural-zh', 'json');
    expect(t).toContain('v0.3.5');
    expect(t).toContain('v0.3.6');
    expect(t).toContain('JSON（英文）');
  });
});
