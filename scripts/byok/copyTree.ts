import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { BYOK_DELETE_PATHS, EXPORT_EXCLUDE_DIRS } from './config.js';

const PRESERVE_ON_CLEAN = new Set(['node_modules', '.git']);

export function copyRepoTree(srcRoot: string, destRoot: string): void {
  cleanDest(destRoot);

  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: srcRoot,
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8');
  const files = out.split('\0').filter(Boolean);

  for (const rel of files) {
    const top = rel.split('/')[0];
    if (EXPORT_EXCLUDE_DIRS.has(top) || EXPORT_EXCLUDE_DIRS.has(rel)) continue;
    if (rel.startsWith('services/') || rel.startsWith('website/')) continue;
    const srcPath = join(srcRoot, rel);
    const destPath = join(destRoot, rel);
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath);
  }

  for (const rel of BYOK_DELETE_PATHS) {
    const abs = join(destRoot, rel);
    if (existsSync(abs)) rmSync(abs, { recursive: true, force: true });
  }
}

function cleanDest(destRoot: string): void {
  if (!existsSync(destRoot)) {
    mkdirSync(destRoot, { recursive: true });
    return;
  }
  for (const name of readdirSync(destRoot)) {
    if (PRESERVE_ON_CLEAN.has(name)) continue;
    rmSync(join(destRoot, name), { recursive: true, force: true });
  }
}

export function applyOverlayFiles(srcRoot: string, destRoot: string, overlayRoot: string): void {
  if (!existsSync(overlayRoot)) return;
  walkFiles(overlayRoot, (abs) => {
    const rel = relative(overlayRoot, abs);
    const dest = join(destRoot, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(abs, dest);
  });
}

export function patchFile(
  destRoot: string,
  relPath: string,
  transform: (content: string) => string,
): void {
  const abs = join(destRoot, relPath);
  if (!existsSync(abs)) return;
  const normalized = readFileSync(abs, 'utf-8').replace(/\r\n/g, '\n');
  writeFileSync(abs, transform(normalized), 'utf-8');
}

function walkFiles(dir: string, fn: (abs: string) => void): void {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walkFiles(abs, fn);
    else fn(abs);
  }
}

export function readDest(destRoot: string, relPath: string): string {
  return readFileSync(join(destRoot, relPath), 'utf-8');
}

export function writeDest(destRoot: string, relPath: string, content: string): void {
  const abs = join(destRoot, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
}
