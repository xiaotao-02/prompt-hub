import { describe, expect, it } from 'vitest';
import { DEFAULT_STRATEGY_ID, STRATEGY_LABELS, getStrategy, getStrategyList } from './strategies';

describe('strategies v036 default', () => {
  it('uses v036 as the default strategy', () => {
    expect(DEFAULT_STRATEGY_ID).toBe('v036');

    const strategy = getStrategy(undefined);
    expect(strategy.id).toBe('v036');
    expect(strategy.components).toEqual({
      stylePromptSet: 'v0.3.6',
      sampling: 'v0.3.0',
      customJoin: 'v0.3.0',
    });
    expect(strategy.temperature).toBe(0.3);
    expect(strategy.maxTokens).toBe(1536);
    expect(strategy.customPosition).toBe('prepend');
  });

  it('keeps v035 available and unchanged for rollback', () => {
    const strategy = getStrategy('v035');

    expect(strategy.id).toBe('v035');
    expect(strategy.components.stylePromptSet).toBe('v0.3.5');
    expect(strategy.stylePrompts['natural-zh']).toContain('3-8段落');
  });

  it('lists and labels v036 for the UI', () => {
    expect(STRATEGY_LABELS.v036).toBe('v0.3.6 通用高还原');
    expect(getStrategyList().map((strategy) => strategy.id)).toContain('v036');
  });

  it('includes json and natural-ja output styles in default strategy prompts', () => {
    const strategy = getStrategy('v036');
    expect(strategy.stylePrompts.json).toContain('valid JSON object');
    expect(strategy.stylePrompts['natural-ja']).toContain('日本語');
  });
});
