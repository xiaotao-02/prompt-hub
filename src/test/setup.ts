import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

/** Minimal chrome global for component tests that touch extension APIs. */
if (typeof globalThis.chrome === 'undefined') {
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'test-extension-id',
      getURL: (p: string) => `chrome-extension://test/${p}`,
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      openOptionsPage: vi.fn(),
      reload: vi.fn(),
    },
    storage: {
      sync: { get: vi.fn(), set: vi.fn() },
      local: { get: vi.fn(), set: vi.fn() },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabs: {
      query: vi.fn((_q, cb) => cb?.([])),
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
    },
    windows: { update: vi.fn() },
  });
}
