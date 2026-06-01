import { describe, expect, it } from 'vitest';
import {
  resolveStrategyDisplayId,
  strategyDisplayLabel,
  strategyHeaderLabel,
} from './strategyDisplay';
import { DEFAULT_STRATEGY_ID, STRATEGY_LABELS } from '@/lib/strategies-meta';

describe('strategyDisplay', () => {
  it('falls back to default for unknown ids', () => {
    expect(resolveStrategyDisplayId(undefined)).toBe(DEFAULT_STRATEGY_ID);
    expect(resolveStrategyDisplayId('v010' as never)).toBe(DEFAULT_STRATEGY_ID);
  });

  it('keeps known strategy ids', () => {
    expect(resolveStrategyDisplayId('v035')).toBe('v035');
  });

  it('strategyDisplayLabel always returns a non-empty label', () => {
    expect(strategyDisplayLabel(undefined)).toBe(STRATEGY_LABELS[DEFAULT_STRATEGY_ID]);
    expect(strategyDisplayLabel('v035')).toBe(STRATEGY_LABELS.v035);
    expect(strategyDisplayLabel('fidelity' as never)).toBe(STRATEGY_LABELS[DEFAULT_STRATEGY_ID]);
  });

  it('strategyHeaderLabel hides badge text until strategy is known', () => {
    expect(strategyHeaderLabel(undefined)).toBe('');
    expect(strategyHeaderLabel('v035')).toBe(STRATEGY_LABELS.v035);
  });
});
