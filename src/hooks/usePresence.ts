import { useEffect, useState } from 'react';
import { motionDurationMs, prefersReducedMotion } from '@/lib/motion';

export type PresenceStatus = 'enter' | 'exit' | 'idle';

export interface UsePresenceOptions {
  durationMs?: number;
}

/**
 * 控制进出场动画期间的挂载状态：open=true 时挂载并播放 enter；
 * open=false 时先 exit，动画结束后再卸载。prefers-reduced-motion 时即时切换。
 */
export function usePresence(
  open: boolean,
  options?: UsePresenceOptions,
): { mounted: boolean; status: PresenceStatus } {
  const durationMs = options?.durationMs ?? motionDurationMs('durationBase');
  const [mounted, setMounted] = useState(open);
  const [status, setStatus] = useState<PresenceStatus>(open ? 'enter' : 'idle');

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (prefersReducedMotion()) {
        setStatus('idle');
        return;
      }
      setStatus('enter');
      const enterTimer = window.setTimeout(() => {
        setStatus('idle');
      }, durationMs);
      return () => window.clearTimeout(enterTimer);
    }

    if (!mounted) return;

    if (prefersReducedMotion()) {
      setMounted(false);
      setStatus('idle');
      return;
    }

    setStatus('exit');
    const exitTimer = window.setTimeout(() => {
      setMounted(false);
      setStatus('idle');
    }, durationMs);
    return () => window.clearTimeout(exitTimer);
  }, [open, durationMs, mounted]);

  return { mounted, status };
}
