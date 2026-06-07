import './popupPreviewFrame.css';
import { installChromePreviewShim, DEV_PREVIEW_POPUP_SIZE } from './chromeShim';
import { ensurePreviewLibrarySeed } from './seedPreviewLibrary';
import { ensurePreviewSettingsForScene } from './seedPreviewSettings';
import '@/styles/globals.css';
import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PopupApp from '@/popup/PopupApp';
import { POPUP_BODY_CLASS, POPUP_CHROME_MAX_HEIGHT_PX } from '@/popup/popupShell';

installChromePreviewShim();

if (window.parent === window) {
  document.documentElement.classList.add('popup-preview-standalone');
  document.body.classList.add('popup-preview-standalone');
}

document.body.className = POPUP_BODY_CLASS;

function readExpandIdFromHash(): string | undefined {
  const raw =
    typeof window.location.hash === 'string' ? window.location.hash.replace(/^#/, '') : '';
  if (!raw) return undefined;
  try {
    const id = new URLSearchParams(raw).get('expand')?.trim();
    return id || undefined;
  } catch {
    return undefined;
  }
}

function PopupPreviewSizeReporter() {
  useLayoutEffect(() => {
    if (window.parent === window) return;

    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const report = (el: HTMLElement) => {
      const height = Math.min(el.scrollHeight, POPUP_CHROME_MAX_HEIGHT_PX);
      window.parent.postMessage({ type: DEV_PREVIEW_POPUP_SIZE, height }, window.location.origin);
    };

    const attach = (el: HTMLElement) => {
      observer?.disconnect();
      const onResize = () => report(el);
      observer = new ResizeObserver(onResize);
      observer.observe(el);
      onResize();
    };

    const root = document.querySelector<HTMLElement>('[data-popup-root]');
    if (root) {
      attach(root);
      return () => observer?.disconnect();
    }

    const mount = document.getElementById('root');
    if (!mount) return;

    mutationObserver = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>('[data-popup-root]');
      if (!el) return;
      mutationObserver?.disconnect();
      mutationObserver = null;
      attach(el);
    });
    mutationObserver.observe(mount, { childList: true, subtree: true });

    return () => {
      mutationObserver?.disconnect();
      observer?.disconnect();
    };
  }, []);

  return null;
}

void Promise.all([ensurePreviewSettingsForScene(), ensurePreviewLibrarySeed()]).then(() => {
  const initialVersionsExpandedId = readExpandIdFromHash() ?? null;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PopupApp initialVersionsExpandedId={initialVersionsExpandedId} />
      <PopupPreviewSizeReporter />
    </StrictMode>,
  );
});
