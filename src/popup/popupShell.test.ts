import { describe, expect, it } from 'vitest';
import {
  POPUP_CHROME_MAX_HEIGHT_PX,
  POPUP_HEADER_RESERVE_PX,
  POPUP_LAYOUT_CLASS_NAMES,
  POPUP_SCROLL_MAX_HEIGHT_PX,
} from './popupShell';

describe('popupShell', () => {
  it('scroll max height matches chrome cap minus header reserve', () => {
    expect(POPUP_SCROLL_MAX_HEIGHT_PX).toBe(POPUP_CHROME_MAX_HEIGHT_PX - POPUP_HEADER_RESERVE_PX);
  });

  it('exported layout classes do not use viewport-relative units', () => {
    const forbidden = /\b(\d*vh|\d*vw|\d*dvh|\d*svh|\d*lvh)\b/i;
    for (const name of POPUP_LAYOUT_CLASS_NAMES) {
      expect(name).not.toMatch(forbidden);
    }
  });
});
