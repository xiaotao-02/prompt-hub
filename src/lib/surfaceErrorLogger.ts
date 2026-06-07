const LOG_PREFIX = '[PromptHub]';

/** 各扩展上下文统一的全局错误兜底（仅 console，不上报外部服务）。 */
export function installSurfaceErrorLogger(surface: string): void {
  const g = globalThis as typeof globalThis & {
    addEventListener?: (type: string, listener: (ev: Event) => void) => void;
  };
  if (typeof g.addEventListener !== 'function') return;

  g.addEventListener('error', (ev: Event) => {
    const e = ev as ErrorEvent;
    console.error(`${LOG_PREFIX} [${surface}] uncaught error`, e.error ?? e.message);
  });

  g.addEventListener('unhandledrejection', (ev: Event) => {
    const r = ev as PromiseRejectionEvent;
    console.error(`${LOG_PREFIX} [${surface}] unhandled rejection`, r.reason);
  });
}
