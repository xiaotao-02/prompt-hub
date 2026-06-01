import { describe, expect, it } from 'vitest';
import { validateExtractModel } from './providerValidation';

describe('validateExtractModel', () => {
  it('rejects MiniMax-M2 image extraction before API calls', () => {
    const result = validateExtractModel('minimax', 'MiniMax-M2-latest', true);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/MiniMax-VL-01/);
      expect(result.message).toMatch(/troubleshooting-minimax/);
      expect(result.recommendedModel).toBe('MiniMax-VL-01');
    }
  });

  it('matches MiniMax-M2 models case-insensitively', () => {
    const result = validateExtractModel('minimax', 'minimax-m2-highspeed', true);

    expect(result.ok).toBe(false);
  });

  it('allows MiniMax vision models with reference images', () => {
    expect(validateExtractModel('minimax', 'MiniMax-VL-01', true)).toEqual({
      ok: true,
    });
  });

  it('allows gpt-5.5 with reference images', () => {
    expect(validateExtractModel('openai', 'gpt-5.5', true)).toEqual({ ok: true });
  });

  it('allows gpt-3.5-turbo (unknown/low confidence, not blocked)', () => {
    expect(validateExtractModel('openai', 'gpt-3.5-turbo', true)).toEqual({ ok: true });
  });

  it('does not apply the MiniMax-specific message to other providers', () => {
    const result = validateExtractModel('openai', 'text-embedding-3-small', true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toMatch(/troubleshooting-minimax/);
    }
  });

  it('rejects high-confidence non-vision models when has images', () => {
    expect(validateExtractModel('openai', 'text-embedding-3-small', true).ok).toBe(false);
  });

  it('allows when visionById marks model as vision', () => {
    expect(
      validateExtractModel('openai', 'custom-weird-id', true, {
        'custom-weird-id': 'vision',
      }),
    ).toEqual({ ok: true });
  });

  it('allows MiniMax-M2 when no reference image is being sent', () => {
    expect(validateExtractModel('minimax', 'MiniMax-M2-latest', false)).toEqual({
      ok: true,
    });
  });
});
