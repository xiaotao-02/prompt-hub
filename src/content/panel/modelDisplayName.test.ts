import { describe, expect, it } from 'vitest';
import { panelModelDisplayName } from './modelDisplayName';

describe('panelModelDisplayName', () => {
  it('returns empty when model is missing', () => {
    expect(panelModelDisplayName('openai', undefined)).toBe('');
    expect(panelModelDisplayName(undefined, undefined)).toBe('');
  });

  it('shows raw model id for non-platform providers', () => {
    expect(panelModelDisplayName('openai', 'gpt-4o-mini')).toBe('gpt-4o-mini');
    expect(panelModelDisplayName(undefined, 'deepseek-chat')).toBe('deepseek-chat');
  });

  it('strips upstream prefix for platform models', () => {
    expect(panelModelDisplayName('platform', 'openai/gpt-4o-mini')).toBe('gpt-4o-mini');
  });
});
