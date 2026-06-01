import type { AppSettings } from '../types';

export type ImportResult =
  | { ok: true; settings: AppSettings; hint: string }
  | { ok: false; error: string };
