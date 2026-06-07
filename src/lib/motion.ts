import { UI_MOTION } from './uiTokens';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function motionDurationMs(
  key: 'durationFast' | 'durationBase' | 'durationSlow' = 'durationBase',
): number {
  return parseInt(UI_MOTION[key], 10);
}
