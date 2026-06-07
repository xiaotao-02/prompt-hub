/** @vitest-environment jsdom */
import { describe, expect, it, afterEach, vi } from 'vitest';
import * as geometry from './geometry';
import {
  clampGeometry,
  updateGeometry,
  VIEWPORT_MARGIN,
  resetStableSurfaceHeight,
  stabilizePanelHeightNow,
  maybeResetStableSurfaceForPanelStatus,
  maybeAdjustGeometryForPanelStatus,
  computeComposePanelWidth,
  ratioCenteredGeometry,
  COMPOSE_PANEL_MIN_WIDTH,
  getStableSurfaceMinHeight,
  runPanelGeometryTransition,
  capturePanelHeightBeforeRender,
} from './geometry';
import { panelGeometry, setPanel, setPanelGeometry } from './state';

describe('clampGeometry', () => {
  it('keeps panel within viewport margins', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });

    const clamped = clampGeometry({ left: 900, top: 900, width: 2000, height: 2000 });
    expect(clamped.left).toBeLessThanOrEqual(800 - 360 - VIEWPORT_MARGIN);
    expect(clamped.top).toBeLessThanOrEqual(600 - 220 - VIEWPORT_MARGIN);
    expect(clamped.width).toBeLessThanOrEqual(800 - VIEWPORT_MARGIN * 2);
    expect(clamped.height).toBeLessThanOrEqual(600 - VIEWPORT_MARGIN * 2);
  });
});

describe('updateGeometry', () => {
  afterEach(() => {
    setPanelGeometry(null);
  });

  it('preserves height when patch only updates width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    setPanelGeometry({ left: 100, top: 80, width: 800, height: 600 });

    const result = updateGeometry({ width: 900 });

    expect(result.width).toBe(900);
    expect(result.height).toBe(600);
  });

  it('preserves width when patch only updates height', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    setPanelGeometry({ left: 100, top: 80, width: 800, height: 600 });

    const result = updateGeometry({ height: 700 });

    expect(result.width).toBe(800);
    expect(result.height).toBe(700);
  });
});

describe('maybeResetStableSurfaceForPanelStatus', () => {
  afterEach(() => {
    setPanelGeometry(null);
    setPanel(null);
    resetStableSurfaceHeight();
  });

  function mountPanelWithSurface(surfaceHeight: number): HTMLElement {
    const root = document.createElement('div');
    root.className = 'panel';
    const surface = document.createElement('div');
    surface.dataset.role = 'panel-surface';
    root.appendChild(surface);
    document.body.appendChild(root);
    setPanel(root);
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: surfaceHeight,
      width: 400,
      height: surfaceHeight,
      toJSON: () => ({}),
    } as DOMRect);
    return root;
  }

  it('clears stable min-height when entering compose from success in auto height mode', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    setPanelGeometry({ left: 24, top: 24 });
    mountPanelWithSurface(520);
    stabilizePanelHeightNow();
    expect(getStableSurfaceMinHeight()).toBeGreaterThan(0);

    maybeResetStableSurfaceForPanelStatus('compose', 'success');

    expect(getStableSurfaceMinHeight()).toBe(0);
    const surface = document.querySelector('[data-role="panel-surface"]') as HTMLElement;
    expect(surface.style.getPropertyValue('--pe-panel-surface-min-h')).toBe('');
  });

  it('does not clear stable min-height when panel height is manually locked', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    setPanelGeometry({ left: 24, top: 24, height: 600 });
    mountPanelWithSurface(520);
    const resetSpy = vi.spyOn(geometry, 'resetStableSurfaceHeight');

    maybeResetStableSurfaceForPanelStatus('compose', 'success');

    expect(resetSpy).not.toHaveBeenCalled();
    resetSpy.mockRestore();
  });

  it('does not reset on compose-to-compose re-render', () => {
    setPanelGeometry({ left: 24, top: 24 });
    mountPanelWithSurface(400);
    stabilizePanelHeightNow();
    const before = getStableSurfaceMinHeight();
    expect(before).toBeGreaterThan(0);

    maybeResetStableSurfaceForPanelStatus('compose', 'compose');

    expect(getStableSurfaceMinHeight()).toBe(before);
  });
});

describe('computeComposePanelWidth', () => {
  afterEach(() => {
    setPanelGeometry(null);
  });

  it('uses minimum width for empty or few references', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });

    expect(computeComposePanelWidth({ refCount: 0, videoMode: false })).toBe(
      COMPOSE_PANEL_MIN_WIDTH,
    );
    expect(computeComposePanelWidth({ refCount: 1, videoMode: false })).toBe(
      COMPOSE_PANEL_MIN_WIDTH,
    );
  });

  it('grows with more reference thumbnails up to cap', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });

    expect(computeComposePanelWidth({ refCount: 4, videoMode: false })).toBe(476);
    expect(computeComposePanelWidth({ refCount: 8, videoMode: false })).toBe(560);
  });
});

describe('maybeAdjustGeometryForPanelStatus', () => {
  afterEach(() => {
    setPanelGeometry(null);
    setPanel(null);
    sessionStorage.removeItem('__image_prompt_extractor_panel_geom__');
  });

  function setupViewport() {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
  }

  it('narrows width when entering compose from success', () => {
    setupViewport();
    setPanelGeometry({ left: 100, top: 80, width: 900 });

    maybeAdjustGeometryForPanelStatus('compose', 'success', { refCount: 1, videoMode: false });

    expect(panelGeometry?.width).toBe(COMPOSE_PANEL_MIN_WIDTH);
    expect(panelGeometry?.width).toBeLessThan(900);
  });

  it('restores wide width when leaving compose for loading', () => {
    setupViewport();
    setPanelGeometry({ left: 100, top: 80, width: COMPOSE_PANEL_MIN_WIDTH });
    const wideWidth = ratioCenteredGeometry().width;

    maybeAdjustGeometryForPanelStatus('loading', 'compose', { refCount: 1, videoMode: false });

    expect(panelGeometry?.width).toBe(wideWidth);
    expect(panelGeometry?.width).toBeGreaterThan(COMPOSE_PANEL_MIN_WIDTH);
  });

  it('skips auto width changes when widthUserLocked', () => {
    setupViewport();
    setPanelGeometry({ left: 100, top: 80, width: 900, widthUserLocked: true });

    maybeAdjustGeometryForPanelStatus('compose', 'success', { refCount: 1, videoMode: false });
    expect(panelGeometry?.width).toBe(900);

    maybeAdjustGeometryForPanelStatus('loading', 'compose', { refCount: 1, videoMode: false });
    expect(panelGeometry?.width).toBe(900);
  });

  it('does not adjust width on compose-to-compose re-render', () => {
    setupViewport();
    setPanelGeometry({ left: 100, top: 80, width: 520 });

    maybeAdjustGeometryForPanelStatus('compose', 'compose', { refCount: 3, videoMode: false });

    expect(panelGeometry?.width).toBe(520);
  });
});

describe('panel geometry transition', () => {
  afterEach(() => {
    setPanelGeometry(null);
    setPanel(null);
    vi.restoreAllMocks();
  });

  it('runPanelGeometryTransition adds geometry-transition class', () => {
    const root = document.createElement('div');
    root.className = 'panel';
    document.body.appendChild(root);
    setPanel(root);

    runPanelGeometryTransition();

    expect(root.classList.contains('geometry-transition')).toBe(true);
  });

  it('capturePanelHeightBeforeRender locks inline height in auto height mode', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    setPanelGeometry({ left: 24, top: 24, width: 720 });
    const root = document.createElement('div');
    root.className = 'panel';
    document.body.appendChild(root);
    setPanel(root);
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 720,
      bottom: 480,
      width: 720,
      height: 480,
      toJSON: () => ({}),
    } as DOMRect);

    capturePanelHeightBeforeRender();

    expect(root.style.height).toBe('480px');
    expect(root.classList.contains('geometry-transition')).toBe(true);
  });
});
