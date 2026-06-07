import { describe, expect, it } from 'vitest';
import {
  defaultVideoSegmentRange,
  formatVideoSegmentInputSec,
  inferVideoDisplayTitle,
  resolveComposeVideoPreviewSource,
  selectVideoFrameCandidates,
  uniformSampleTimes,
} from './videoSegmentSample';
import type { VideoFrameCandidateForSelection } from './videoSegmentSample';

type MockElement = {
  getAttribute: (name: string) => string | null;
  parentElement: MockElement | null;
  closest?: (selector: string) => MockElement | null;
  querySelector?: (selector: string) => MockElement | null;
  textContent?: string;
};

function mockVideo(
  attrs: {
    title?: string;
    ariaLabel?: string;
    src?: string;
    currentSrc?: string;
    poster?: string;
    figcaption?: string;
    duration?: number;
    parentLabels?: Array<{ ariaLabel?: string; title?: string }>;
  } = {},
): HTMLVideoElement {
  let parent: MockElement | null = null;
  for (const label of attrs.parentLabels ?? []) {
    const ancestor: MockElement = {
      getAttribute(name: string) {
        if (name === 'aria-label') return label.ariaLabel ?? null;
        if (name === 'title') return label.title ?? null;
        return null;
      },
      parentElement: parent,
    };
    parent = ancestor;
  }

  const figure: MockElement | null = attrs.figcaption
    ? {
        getAttribute: () => null,
        parentElement: null,
        querySelector(selector: string) {
          if (selector !== 'figcaption') return null;
          return {
            getAttribute: () => null,
            parentElement: null,
            textContent: attrs.figcaption,
          };
        },
      }
    : null;

  return {
    title: attrs.title ?? '',
    getAttribute(name: string) {
      if (name === 'aria-label') return attrs.ariaLabel ?? null;
      if (name === 'poster') return attrs.poster ?? null;
      return null;
    },
    closest(selector: string) {
      if (selector === 'figure' && figure) return figure;
      return null;
    },
    parentElement: parent,
    currentSrc: attrs.currentSrc ?? '',
    src: attrs.src ?? '',
    duration: attrs.duration ?? Number.NaN,
    ownerDocument: { baseURI: 'https://example.com/' },
  } as unknown as HTMLVideoElement;
}

function frame(
  timeSec: number,
  signature: string,
  opts?: { contrast?: number; sharpness?: number },
): VideoFrameCandidateForSelection {
  return {
    timeSec,
    dataUrl: `data:image/jpeg;base64,${timeSec}`,
    signature,
    contrast: opts?.contrast ?? 20,
    sharpness: opts?.sharpness ?? 8,
  };
}

describe('video segment sampling helpers', () => {
  it('uniformSampleTimes includes both endpoints and keeps ascending order', () => {
    expect(uniformSampleTimes(2, 6, 5)).toEqual([2, 3, 4, 5, 6]);
  });

  it('selectVideoFrameCandidates preserves endpoints, filters duplicate and low-information middle frames, and caps output', () => {
    const firstSig = '0'.repeat(64);
    const duplicateOfFirst = `${'0'.repeat(63)}1`;
    const strongA = '1'.repeat(64);
    const strongB = '10'.repeat(32);
    const strongC = '1100'.repeat(16);
    const lastSig = '0011'.repeat(16);

    const selected = selectVideoFrameCandidates(
      [
        frame(0, firstSig),
        frame(1, duplicateOfFirst),
        frame(2, strongA, { contrast: 1, sharpness: 0.1 }),
        frame(4, strongA),
        frame(6, strongB),
        frame(8, strongC),
        frame(10, lastSig),
      ],
      4,
    );

    expect(selected.map((f) => f.timeSec)).toEqual([0, 4, 8, 10]);
    expect(selected).toHaveLength(4);
    expect(selected[0]?.timeSec).toBe(0);
    expect(selected[selected.length - 1]?.timeSec).toBe(10);
    expect(selected.map((f) => f.timeSec)).toEqual(
      [...selected].sort((a, b) => a.timeSec - b.timeSec).map((f) => f.timeSec),
    );
  });

  it('keeps first and last even when the segment is visually static', () => {
    const sig = '01'.repeat(32);

    const selected = selectVideoFrameCandidates(
      [frame(0, sig), frame(1, sig), frame(2, sig), frame(3, sig)],
      8,
    );

    expect(selected.map((f) => f.timeSec)).toEqual([0, 3]);
  });
});

describe('defaultVideoSegmentRange', () => {
  it('uses 0 through finite duration when metadata is available', () => {
    expect(defaultVideoSegmentRange(mockVideo({ duration: 42.5 }))).toEqual({
      startSec: 0,
      endSec: 42.5,
    });
  });

  it('falls back to a safe span when duration is missing or invalid', () => {
    expect(defaultVideoSegmentRange(mockVideo())).toEqual({ startSec: 0, endSec: 10 });
    expect(defaultVideoSegmentRange(mockVideo({ duration: 0 }))).toEqual({
      startSec: 0,
      endSec: 10,
    });
  });
});

describe('formatVideoSegmentInputSec', () => {
  it('formats seconds without trailing unit and trims trailing zeros', () => {
    expect(formatVideoSegmentInputSec(0)).toBe('0');
    expect(formatVideoSegmentInputSec(1.5)).toBe('1.5');
    expect(formatVideoSegmentInputSec(599.994)).toBe('599.99');
  });

  it('returns empty string for non-finite values', () => {
    expect(formatVideoSegmentInputSec(Number.NaN)).toBe('');
  });
});

describe('resolveComposeVideoPreviewSource', () => {
  it('returns src, poster and title when video has a playable address', () => {
    expect(
      resolveComposeVideoPreviewSource(
        mockVideo({
          currentSrc: 'https://cdn.example.com/clips/demo.mp4',
          poster: '/posters/demo.jpg',
        }),
        0,
      ),
    ).toEqual({
      src: 'https://cdn.example.com/clips/demo.mp4',
      poster: 'https://example.com/posters/demo.jpg',
      title: 'demo',
    });
  });

  it('returns null when src is empty', () => {
    expect(resolveComposeVideoPreviewSource(mockVideo(), 2)).toBeNull();
  });
});

describe('inferVideoDisplayTitle', () => {
  it('prefers title and aria-label on the video element', () => {
    expect(inferVideoDisplayTitle(mockVideo({ title: '产品演示' }), 0)).toBe('产品演示');
    expect(inferVideoDisplayTitle(mockVideo({ ariaLabel: 'Launch clip' }), 0)).toBe('Launch clip');
    expect(inferVideoDisplayTitle(mockVideo({ title: '主标题', ariaLabel: '备用' }), 0)).toBe(
      '主标题',
    );
  });

  it('uses figure figcaption when direct labels are missing', () => {
    expect(inferVideoDisplayTitle(mockVideo({ figcaption: '  分镜预览  ' }), 2)).toBe('分镜预览');
  });

  it('falls back to URL basename and then numbered label', () => {
    expect(
      inferVideoDisplayTitle(
        mockVideo({ currentSrc: 'https://cdn.example.com/clips/hero-intro.mp4' }),
        0,
      ),
    ).toBe('hero-intro');
    expect(inferVideoDisplayTitle(mockVideo(), 4)).toBe('视频 5');
  });
});
