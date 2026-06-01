/** @vitest-environment jsdom */
import { describe, expect, it, afterEach, vi } from 'vitest';
import type { PanelState } from './state';
import { HOST_ID, setHost, setPanel, setCurrentState } from './state';
import {
  bindPanelOutsideClose,
  panelOutsideCloseActions,
  unbindPanelOutsideClose,
} from './panelOutsideClose';

function baseState(patch: Partial<PanelState> = {}): PanelState {
  return {
    sessionRequestId: 'req-1',
    imageUrl: 'https://example.com/a.png',
    imageUrls: ['https://example.com/a.png'],
    status: 'compose',
    ...patch,
  };
}

describe('panelOutsideClose', () => {
  afterEach(() => {
    unbindPanelOutsideClose();
    panelOutsideCloseActions.closePanel = null;
    setHost(null);
    setPanel(null);
    setCurrentState(null);
    document.getElementById(HOST_ID)?.remove();
  });

  it('does not close panel on right-button pointerdown outside', () => {
    const closePanel = vi.fn();
    panelOutsideCloseActions.closePanel = closePanel;

    const hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.documentElement.appendChild(hostEl);
    setHost(hostEl);
    setPanel(document.createElement('div'));
    setCurrentState(baseState());

    bindPanelOutsideClose();

    document.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 2, cancelable: true }),
    );

    expect(closePanel).not.toHaveBeenCalled();
  });

  it('closes panel on left-button pointerdown outside', () => {
    const closePanel = vi.fn();
    panelOutsideCloseActions.closePanel = closePanel;

    const hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.documentElement.appendChild(hostEl);
    setHost(hostEl);
    setPanel(document.createElement('div'));
    setCurrentState(baseState());

    bindPanelOutsideClose();

    document.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, cancelable: true }),
    );

    expect(closePanel).toHaveBeenCalledTimes(1);
  });

  it('does not close panel on left-button pointerdown inside host', () => {
    const closePanel = vi.fn();
    panelOutsideCloseActions.closePanel = closePanel;

    const hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.documentElement.appendChild(hostEl);
    setHost(hostEl);
    setPanel(document.createElement('div'));
    setCurrentState(baseState());

    bindPanelOutsideClose();

    hostEl.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, cancelable: true }),
    );

    expect(closePanel).not.toHaveBeenCalled();
  });
});
