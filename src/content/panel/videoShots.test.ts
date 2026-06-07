import { describe, expect, it } from 'vitest';
import { parseVideoShots } from './videoShots';

describe('parseVideoShots', () => {
  it('parses standard multi-line shots with time anchors', () => {
    const text = [
      '分镜01（约1s）：远景，人物站立。',
      '分镜02（约2.5s）：中景，人物行走。',
      '分镜03（约3s）：特写，面部表情。',
    ].join('\n');

    const shots = parseVideoShots(text);
    expect(shots).toHaveLength(3);
    expect(shots[0]).toMatchObject({
      ordinal: 1,
      timeLabel: '约1s',
      charStart: 0,
    });
    expect(shots[1]).toMatchObject({ ordinal: 2, timeLabel: '约2.5s' });
    expect(shots[2]).toMatchObject({ ordinal: 3, timeLabel: '约3s' });
    expect(shots[0]!.text).toContain('远景');
    expect(shots[2]!.charEnd).toBe(text.length);
  });

  it('parses shots without time labels', () => {
    const text = '分镜01：第一帧描述。\n分镜02：第二帧描述。';
    const shots = parseVideoShots(text);
    expect(shots).toHaveLength(2);
    expect(shots[0]!.timeLabel).toBeUndefined();
    expect(shots[0]!.ordinal).toBe(1);
    expect(shots[1]!.ordinal).toBe(2);
  });

  it('parses parenthesis-style time anchors', () => {
    const text = '分镜1 (约 2s): English shot one.\n分镜2 (约 4s): English shot two.';
    const shots = parseVideoShots(text);
    expect(shots).toHaveLength(2);
    expect(shots[0]!.timeLabel).toBe('约2s');
    expect(shots[1]!.timeLabel).toBe('约4s');
  });

  it('returns empty when fewer than two shots', () => {
    expect(parseVideoShots('分镜01（约1s）：只有一条。')).toEqual([]);
    expect(parseVideoShots('普通提示词，无分镜标记。')).toEqual([]);
    expect(parseVideoShots('')).toEqual([]);
  });

  it('records correct char ranges for selection', () => {
    const text = '分镜01（约1s）：A\n分镜02（约2s）：B';
    const shots = parseVideoShots(text);
    expect(shots[0]!.charStart).toBe(0);
    expect(shots[0]!.charEnd).toBe(text.indexOf('分镜02'));
    expect(shots[1]!.charStart).toBe(text.indexOf('分镜02'));
    expect(shots[1]!.charEnd).toBe(text.length);
    expect(text.slice(shots[0]!.charStart, shots[0]!.charEnd)).toContain('A');
    expect(text.slice(shots[1]!.charStart, shots[1]!.charEnd)).toContain('B');
  });

  it('includes trailing non-shot lines in the last shot range', () => {
    const text = [
      '分镜01（约1s）：画面一。',
      '分镜02（约2s）：画面二。',
      '以上为该片段分镜总结。',
    ].join('\n');
    const shots = parseVideoShots(text);
    expect(shots).toHaveLength(2);
    expect(shots[1]!.text).toContain('画面二');
    expect(shots[1]!.text).toContain('总结');
    expect(shots[1]!.charEnd).toBe(text.length);
  });
});
