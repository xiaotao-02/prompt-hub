import { describe, expect, it } from 'vitest';
import {
  commonPrefixLength,
  versionListPreviewText,
  versionListReferencePrompt,
} from './versionPreview';

describe('commonPrefixLength', () => {
  it('counts shared start', () => {
    expect(commonPrefixLength('abcdef', 'abcxyz')).toBe(3);
  });
});

describe('versionListPreviewText', () => {
  const shared = '冷萃咖啡夏季促销海报：蓝白渐变、浅橙点缀，';

  it('shows tail after long common prefix with reference', () => {
    const current = shared + '左侧产品特写';
    const reference = shared + '右侧留白给价格条';
    const { text, truncated } = versionListPreviewText(current, reference, 40);
    expect(text.startsWith('…')).toBe(true);
    expect(text).toContain('左侧产品特写');
    expect(truncated).toBe(false);
  });

  it('falls back to head slice without reference', () => {
    const { text, truncated } = versionListPreviewText('hello world', undefined, 5);
    expect(text).toBe('hello');
    expect(truncated).toBe(true);
  });

  it('returns same label when identical to reference', () => {
    const p = 'same text here';
    const { text, truncated } = versionListPreviewText(p, p, 80);
    expect(text).toBe('与上一版相同');
    expect(truncated).toBe(false);
  });

  it('adds trailing ellipsis when diff exceeds maxLen', () => {
    const ref = 'prefix：';
    const current = 'prefix：' + 'x'.repeat(100);
    const { text, truncated } = versionListPreviewText(current, ref, 10);
    expect(text.startsWith('…')).toBe(true);
    expect(truncated).toBe(true);
  });
});

describe('versionListReferencePrompt', () => {
  it('uses next older for index 0 and newer neighbor otherwise', () => {
    const versions = [{ prompt: 'v0' }, { prompt: 'v1' }, { prompt: 'v2' }];
    expect(versionListReferencePrompt(versions, 0)).toBe('v1');
    expect(versionListReferencePrompt(versions, 1)).toBe('v0');
    expect(versionListReferencePrompt(versions, 2)).toBe('v1');
    expect(versionListReferencePrompt([{ prompt: 'only' }], 0)).toBeUndefined();
  });
});
