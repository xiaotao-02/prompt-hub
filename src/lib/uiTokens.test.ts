import { describe, expect, it } from 'vitest';
import { UI_THEME_DARK, UI_THEME_LIGHT, UI_MOTION, buildPanelThemeCss } from './uiTokens';

describe('uiTokens', () => {
  it('keeps light/dark accent aligned with extension pages', () => {
    expect(UI_THEME_LIGHT.accent).toBe('#6d28d9');
    expect(UI_THEME_DARK.accent).toBe('#a78bfa');
  });

  it('generates panel theme css with pe variables from shared source', () => {
    const css = buildPanelThemeCss();
    expect(css).toContain('--pe-accent: #6d28d9;');
    expect(css).toContain('--pe-success: #059669;');
    expect(css).toContain('--pe-collapse-duration: 220ms;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--pe-accent: #a78bfa;');
  });

  it('shares motion tokens with globals.css contract', () => {
    expect(UI_MOTION.radius).toBe('8px');
    expect(UI_MOTION.collapseEase).toBe('cubic-bezier(0.2, 0.9, 0.3, 1.2)');
  });
});
