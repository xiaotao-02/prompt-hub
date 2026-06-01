import type { PanelState } from '../state';
import type { PanelStateTransition } from './panelEvents';

export function applyReferenceSetUrls(
  state: PanelState,
  imageUrls: string[],
  imageUrl: string,
): PanelStateTransition {
  if (state.imageUrls === imageUrls && state.imageUrl === imageUrl) {
    return { changed: false, state };
  }
  return { changed: true, state: { ...state, imageUrls, imageUrl } };
}
