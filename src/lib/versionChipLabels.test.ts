import { describe, expect, it } from 'vitest';
import { providerModelChipLabel, strategyChipLabel } from '@/lib/versionChipLabels';

describe('strategyChipLabel', () => {
  it('uses compact built-in labels', () => {
    expect(strategyChipLabel('v036')).toBe('v0.3.6');
    expect(strategyChipLabel('classic')).toBe('经典');
    expect(strategyChipLabel('native')).toBe('原生');
  });

  it('strips long suffixes for unknown ids', () => {
    expect(strategyChipLabel('v036')).toBe('v0.3.6');
  });
});

describe('providerModelChipLabel', () => {
  it('shortens anthropic claude models', () => {
    const { short, full } = providerModelChipLabel('anthropic', 'claude-3-5-sonnet-latest');
    expect(short).toBe('Claude · sonnet');
    expect(full).toBe('anthropic · claude-3-5-sonnet-latest');
  });

  it('shortens openai gpt models', () => {
    const { short } = providerModelChipLabel('openai', 'gpt-4o-mini');
    expect(short).toBe('OpenAI · 4o-mini');
  });
});
