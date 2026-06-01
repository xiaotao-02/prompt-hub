import { describe, expect, it } from 'vitest';
import {
  clampVersionsSidebarWidth,
  VERSIONS_SIDEBAR_WIDTH_DEFAULT,
  VERSIONS_SIDEBAR_WIDTH_MAX,
  VERSIONS_SIDEBAR_WIDTH_MIN,
} from './versionsSidebarWidth';

describe('clampVersionsSidebarWidth', () => {
  it('clamps to min/max and rounds', () => {
    expect(clampVersionsSidebarWidth(100)).toBe(VERSIONS_SIDEBAR_WIDTH_MIN);
    expect(clampVersionsSidebarWidth(999)).toBe(VERSIONS_SIDEBAR_WIDTH_MAX);
    expect(clampVersionsSidebarWidth(300.4)).toBe(300);
    expect(clampVersionsSidebarWidth(VERSIONS_SIDEBAR_WIDTH_DEFAULT)).toBe(
      VERSIONS_SIDEBAR_WIDTH_DEFAULT,
    );
  });
});
